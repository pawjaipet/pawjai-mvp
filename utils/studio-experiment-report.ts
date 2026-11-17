// Pure computation for the studio-background experiment report (no I/O).
// Unit of analysis: one (visitor, dog) pair, from its FIRST qualified exposure.
// Visitors see several dogs in both arms, so pairs are not independent; the
// difference interval is cluster-robust by visitor.

export type ExposureRow = {
  created_at: string;
  dog_id: string | null;
  metadata: Record<string, unknown> | null;
  session_id: string | null;
  user_id: string | null;
  visitor_id: string | null;
};

export type OutcomeRow = {
  created_at: string;
  dog_id: string | null;
  event_name: string;
  session_id: string | null;
  visitor_id: string | null;
};

export type SaveRow = { created_at: string; dog_id: string; user_id: string };

export const OUTCOME_EVENTS = ["dog_profile_view", "dog_shared", "booking_started", "booking_succeeded"] as const;
type Outcome = (typeof OUTCOME_EVENTS)[number];
export const ATTRIBUTION_WINDOW_HOURS = 24;
export const MIN_PAIRS_PER_ARM = 300;
export const MIN_DETAIL_OPENS_TOTAL = 40;

type Arm = "control" | "studio";

export type PairResult = {
  arm: Arm;
  cohort: string;
  dogId: string;
  firstExposureAt: number;
  loadMs: number | null;
  outcomes: Record<Outcome, boolean>;
  saved: boolean | null; // null when the exposure was not signed in
  unit: string;
};

export type ExclusionCounts = {
  conflictingVariant: number;
  invalidPayload: number;
  studioFallback: number;
};

function unitKey(row: { session_id: string | null; visitor_id: string | null }) {
  return row.visitor_id ? `v:${row.visitor_id}` : row.session_id ? `s:${row.session_id}` : null;
}

function str(value: unknown) {
  return typeof value === "string" ? value : null;
}

export function buildPairs({
  exposures,
  outcomes,
  saves,
  version,
  windowHours = ATTRIBUTION_WINDOW_HOURS,
}: {
  exposures: ExposureRow[];
  outcomes: OutcomeRow[];
  saves: SaveRow[];
  version: string;
  windowHours?: number;
}) {
  const exclusions: ExclusionCounts = { conflictingVariant: 0, invalidPayload: 0, studioFallback: 0 };
  const grouped = new Map<string, ExposureRow[]>();
  for (const row of exposures) {
    const meta = row.metadata ?? {};
    if (str(meta.experiment) !== version) continue;
    const unit = unitKey(row);
    const variant = str(meta.variant);
    const rendered = str(meta.rendered);
    if (!unit || !row.dog_id || (variant !== "control" && variant !== "studio") || !rendered) {
      exclusions.invalidPayload += 1;
      continue;
    }
    const key = `${unit}|${row.dog_id}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  const outcomeIndex = new Map<string, { at: number; name: string }[]>();
  for (const row of outcomes) {
    const unit = unitKey(row);
    if (!unit || !row.dog_id) continue;
    const key = `${unit}|${row.dog_id}`;
    if (!outcomeIndex.has(key)) outcomeIndex.set(key, []);
    outcomeIndex.get(key)!.push({ at: Date.parse(row.created_at), name: row.event_name });
  }
  const saveIndex = new Map<string, number[]>();
  for (const save of saves) {
    const key = `${save.user_id}|${save.dog_id}`;
    if (!saveIndex.has(key)) saveIndex.set(key, []);
    saveIndex.get(key)!.push(Date.parse(save.created_at));
  }

  const windowMs = windowHours * 60 * 60 * 1000;
  const pairs: PairResult[] = [];
  for (const [key, rows] of grouped) {
    rows.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    const variants = new Set(rows.map((row) => str(row.metadata?.variant)));
    if (variants.size > 1) {
      exclusions.conflictingVariant += 1;
      continue;
    }
    const arm = [...variants][0] as Arm;
    const renders = rows.map((row) => str(row.metadata?.rendered));
    // Never count an original shown after a failed derivative as a studio exposure.
    if (renders.includes("original_fallback")) {
      exclusions.studioFallback += 1;
      continue;
    }
    const expected = arm === "studio" ? "studio" : "original";
    if (renders.some((value) => value !== expected)) {
      exclusions.invalidPayload += 1;
      continue;
    }
    const first = rows[0];
    const t0 = Date.parse(first.created_at);
    const inWindow = (at: number) => at >= t0 && at < t0 + windowMs;
    const happened = (name: string) => (outcomeIndex.get(key) ?? []).some((event) => event.name === name && inWindow(event.at));
    const userId = rows.find((row) => row.user_id)?.user_id ?? null;
    const dogId = first.dog_id!;
    const loadMs = typeof first.metadata?.loadMs === "number" ? first.metadata.loadMs : null;
    pairs.push({
      arm,
      cohort: str(first.metadata?.cohort) ?? "unknown",
      dogId,
      firstExposureAt: t0,
      loadMs,
      outcomes: {
        booking_started: happened("booking_started"),
        booking_succeeded: happened("booking_succeeded"),
        dog_profile_view: happened("dog_profile_view"),
        dog_shared: happened("dog_shared"),
      },
      saved: userId ? (saveIndex.get(`${userId}|${dogId}`) ?? []).some(inWindow) : null,
      unit: key.split("|")[0],
    });
  }
  return { exclusions, pairs };
}

/** Wilson 95% interval for a proportion. */
export function wilson(successes: number, trials: number) {
  if (trials === 0) return null;
  const z = 1.959964;
  const p = successes / trials;
  const denom = 1 + (z * z) / trials;
  const centre = (p + (z * z) / (2 * trials)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / trials + (z * z) / (4 * trials * trials))) / denom;
  return { high: Math.min(1, centre + half), low: Math.max(0, centre - half), rate: p };
}

/**
 * Studio minus control difference in an outcome rate with a visitor-clustered
 * (linearisation) 95% interval. Pairs from the same visitor are correlated.
 */
export function clusteredDifference(pairs: PairResult[], outcome: (pair: PairResult) => boolean) {
  const byUnit = new Map<string, { nC: number; nS: number; yC: number; yS: number }>();
  let NC = 0, NS = 0, YC = 0, YS = 0;
  for (const pair of pairs) {
    const cell = byUnit.get(pair.unit) ?? { nC: 0, nS: 0, yC: 0, yS: 0 };
    const y = outcome(pair) ? 1 : 0;
    if (pair.arm === "control") { cell.nC += 1; cell.yC += y; NC += 1; YC += y; }
    else { cell.nS += 1; cell.yS += y; NS += 1; YS += y; }
    byUnit.set(pair.unit, cell);
  }
  if (NC === 0 || NS === 0) return null;
  const rC = YC / NC;
  const rS = YS / NS;
  const V = byUnit.size;
  if (V < 2) return { diff: rS - rC, high: null, low: null, clusters: V };
  let sum = 0;
  for (const cell of byUnit.values()) {
    const e = (cell.yS - rS * cell.nS) / NS - (cell.yC - rC * cell.nC) / NC;
    sum += e * e;
  }
  const se = Math.sqrt((V / (V - 1)) * sum);
  return { clusters: V, diff: rS - rC, high: rS - rC + 1.959964 * se, low: rS - rC - 1.959964 * se };
}

export function armSummary(pairs: PairResult[], arm: Arm) {
  const rows = pairs.filter((pair) => pair.arm === arm);
  const count = (fn: (pair: PairResult) => boolean) => rows.filter(fn).length;
  const signedIn = rows.filter((pair) => pair.saved !== null);
  const loads = rows.map((pair) => pair.loadMs).filter((value): value is number => typeof value === "number").sort((a, b) => a - b);
  return {
    bookingStarts: count((pair) => pair.outcomes.booking_started),
    bookingSuccesses: count((pair) => pair.outcomes.booking_succeeded),
    detailOpens: count((pair) => pair.outcomes.dog_profile_view),
    medianLoadMs: loads.length ? loads[Math.floor(loads.length / 2)] : null,
    pairs: rows.length,
    saves: signedIn.filter((pair) => pair.saved).length,
    shares: count((pair) => pair.outcomes.dog_shared),
    signedInPairs: signedIn.length,
    visitors: new Set(rows.map((pair) => pair.unit)).size,
  };
}

export function evidenceStatus(control: ReturnType<typeof armSummary>, studio: ReturnType<typeof armSummary>, diff: ReturnType<typeof clusteredDifference>) {
  if (Math.min(control.pairs, studio.pairs) < MIN_PAIRS_PER_ARM || control.detailOpens + studio.detailOpens < MIN_DETAIL_OPENS_TOTAL) {
    return `Insufficient data: needs at least ${MIN_PAIRS_PER_ARM} exposure pairs per arm and ${MIN_DETAIL_OPENS_TOTAL} detail opens in total before reading a difference.`;
  }
  if (!diff || diff.low === null || diff.high === null) return "Insufficient data: not enough distinct visitors to estimate uncertainty.";
  if (diff.low > 0) return "Studio photos show higher detail opens (95% interval above zero). Engagement signal only, not adoption outcomes.";
  if (diff.high < 0) return "Studio photos show lower detail opens (95% interval below zero). Engagement signal only, not adoption outcomes.";
  return "No clear difference yet: the 95% interval includes zero.";
}
