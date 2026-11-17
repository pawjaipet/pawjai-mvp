import { getAdminAuthContext } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { makeAnalyticsWorkbook, type WorkbookCell } from "@/utils/admin-analytics-workbook";
import { STUDIO_EXPERIMENT_DEFAULTS, STUDIO_EXPERIMENT_ENTRIES } from "@/utils/studio-experiment-manifest";
import { getStudioExperimentConfig } from "@/utils/studio-experiment";
import { STUDIO_EXPERIMENT_EVENT } from "@/utils/studio-experiment-model";
import {
  ATTRIBUTION_WINDOW_HOURS,
  armSummary,
  buildPairs,
  clusteredDifference,
  evidenceStatus,
  wilson,
  type ExposureRow,
  type OutcomeRow,
  type PairResult,
  type SaveRow,
} from "@/utils/studio-experiment-report";

export const runtime = "nodejs";
export const maxDuration = 60;

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const PAGE = 1000;
const MAX_ROWS = 50000;
const day = (ms: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
const pct = (value: number | null | undefined) => (value === null || value === undefined ? "—" : Math.round(value * 1000) / 10);

async function paginate<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE) {
    const { data, error } = await query(offset, offset + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) return rows;
  }
  throw new Error("Experiment export limit reached; choose a shorter range.");
}

export async function GET(request: Request) {
  const context = await getAdminAuthContext();
  if (!context?.isGlobalAdmin || context.role !== "admin" || !context.userId) {
    return Response.json({ error: "PawJai HQ access required." }, { status: 403, headers });
  }
  const range = new URL(request.url).searchParams.get("range");
  const selectedRange = range === "7d" || range === "30d" ? range : "all";
  const start = selectedRange === "all" ? new Date("2026-11-17T00:00:00Z") : new Date(Date.now() - (selectedRange === "30d" ? 30 : 7) * 86400000);
  const startIso = start.toISOString();
  const version = STUDIO_EXPERIMENT_DEFAULTS.version;
  const config = getStudioExperimentConfig();
  const db = createAdminClient();
  try {
    const exposures = await paginate<ExposureRow>((from, to) => db.from("product_analytics_events")
      .select("dog_id,visitor_id,session_id,user_id,created_at,metadata")
      .eq("event_name", STUDIO_EXPERIMENT_EVENT).gte("created_at", startIso)
      .order("created_at", { ascending: true }).range(from, to) as unknown as PromiseLike<{ data: ExposureRow[] | null; error: unknown }>);
    const outcomes = await paginate<OutcomeRow>((from, to) => db.from("product_analytics_events")
      .select("event_name,dog_id,visitor_id,session_id,created_at")
      .in("event_name", ["dog_profile_view", "dog_shared", "booking_started", "booking_succeeded"]).gte("created_at", startIso)
      .order("created_at", { ascending: true }).range(from, to));
    // Saves: wishlist rows are server-confirmed. Only signed-in exposures can be linked; identities never leave this route.
    const dogIds = [...new Set(exposures.map((row) => row.dog_id).filter((id): id is string => Boolean(id)))];
    const wishlistRows = dogIds.length ? await paginate<{ adopter_id: string; dog_id: string; created_at: string }>((from, to) => db.from("wishlists")
      .select("adopter_id,dog_id,created_at").in("dog_id", dogIds).gte("created_at", startIso)
      .order("created_at", { ascending: true }).range(from, to)) : [];
    const adopterIds = [...new Set(wishlistRows.map((row) => row.adopter_id))];
    const profileByAdopter = new Map<string, string>();
    for (let index = 0; index < adopterIds.length; index += 200) {
      const { data, error } = await db.from("adopters").select("id,profile_id").in("id", adopterIds.slice(index, index + 200));
      if (error) throw error;
      for (const row of data ?? []) if (row.profile_id) profileByAdopter.set(row.id, row.profile_id);
    }
    const saves: SaveRow[] = wishlistRows.flatMap((row) => {
      const userId = profileByAdopter.get(row.adopter_id);
      return userId ? [{ created_at: row.created_at, dog_id: row.dog_id, user_id: userId }] : [];
    });
    const { data: dogs, error: dogError } = await db.from("dogs").select("id,name,adoption_status")
      .in("id", [...new Set([...STUDIO_EXPERIMENT_ENTRIES.map((entry) => entry.dogId), ...dogIds])]);
    if (dogError) throw dogError;
    const dogName = new Map((dogs ?? []).map((dog) => [dog.id, dog.name]));
    const dogStatus = new Map((dogs ?? []).map((dog) => [dog.id, dog.adoption_status]));

    const { exclusions, pairs } = buildPairs({ exposures, outcomes, saves, version });
    const control = armSummary(pairs, "control");
    const studio = armSummary(pairs, "studio");
    const diff = clusteredDifference(pairs, (pair) => pair.outcomes.dog_profile_view);
    const cC = wilson(control.detailOpens, control.pairs);
    const cS = wilson(studio.detailOpens, studio.pairs);
    const firstAt = pairs.length ? Math.min(...pairs.map((pair) => pair.firstExposureAt)) : null;
    const lastAt = pairs.length ? Math.max(...pairs.map((pair) => pair.firstExposureAt)) : null;
    const openWindow = pairs.filter((pair) => pair.firstExposureAt > Date.now() - ATTRIBUTION_WINDOW_HOURS * 3600000).length;

    const rate = (n: number, d: number) => (d ? pct(n / d) : "—");
    const summary: WorkbookCell[][] = [
      ["Metric", "Control (original photo)", "Studio background", "Notes"],
      ["Experiment version", version, version, `Cohorts enabled now: ${config.enabled ? config.enabledCohorts.join(", ") || "none" : "OFF (kill switch)"}`],
      ["Date range (Bangkok)", firstAt ? `${day(firstAt)} to ${day(lastAt!)}` : "No exposures yet", "", `Export range: ${selectedRange === "all" ? "since launch" : `last ${selectedRange}`}; generated ${new Date().toISOString()}`],
      ["Evidence status", evidenceStatus(control, studio, diff), "", "Event delivery is not evidence that backgrounds change adoptions."],
      ["Qualified exposure pairs (visitor × dog)", control.pairs, studio.pairs, "First qualified exposure per visitor and dog: image loaded, active card, cover slide, ≥60% visible, page visible, unobstructed for 1s"],
      ["Distinct visitors", control.visitors, studio.visitors, "First-party visitor cookie; a visitor usually sees dogs in both arms"],
      ["Dog-detail opens (primary)", control.detailOpens, studio.detailOpens, `Pairs with a dog_profile_view by the same visitor for the same dog within ${ATTRIBUTION_WINDOW_HOURS}h after first exposure`],
      ["Detail-open rate %", rate(control.detailOpens, control.pairs), rate(studio.detailOpens, studio.pairs), "Primary metric"],
      ["Detail-open rate 95% interval %", cC ? `${pct(cC.low)}–${pct(cC.high)}` : "—", cS ? `${pct(cS.low)}–${pct(cS.high)}` : "—", "Wilson interval per arm (ignores within-visitor correlation)"],
      ["Studio − control, percentage points", diff ? pct(diff.diff) : "—", diff && diff.low !== null && diff.high !== null ? `${pct(diff.low)} to ${pct(diff.high)}` : "—", "Difference with visitor-clustered 95% interval"],
      ["Shares", control.shares, studio.shares, "dog_shared after a completed share sheet or link copy, same visitor and dog, within window"],
      ["Booking starts", control.bookingStarts, studio.bookingStarts, "booking_started (schedule page opened), within window"],
      ["Booking successes", control.bookingSuccesses, studio.bookingSuccesses, "Server-confirmed booking_succeeded, within window"],
      ["Signed-in exposure pairs", control.signedInPairs, studio.signedInPairs, "Denominator for saves"],
      ["Confirmed saves still saved", control.saves, studio.saves, "Wishlist rows created within window that still exist (unsaved dogs drop out)"],
      ["Save rate (signed-in) %", rate(control.saves, control.signedInPairs), rate(studio.saves, studio.signedInPairs), "Wishlist is a current snapshot; no dated unsave events exist"],
      ["Median photo load ms", control.medianLoadMs ?? "—", studio.medianLoadMs ?? "—", "Mount-to-load on the first exposure; derivatives are smaller WebP files"],
      ["Excluded: studio derivative failed (original shown)", "", exclusions.studioFallback, "Never counted as studio exposures"],
      ["Excluded: conflicting variant / invalid payload", exclusions.conflictingVariant, exclusions.invalidPayload, "Should stay at zero"],
      ["Pairs still inside the attribution window", openWindow, "", "Outcomes for these pairs may still arrive"],
      ["QA previews", "Excluded at source", "Excluded at source", "?studio_preview never sends exposure events"],
    ];

    const perDogHeader = ["Dog", "Dog id", "Status now", "Cohort", "Control pairs", "Control detail opens", "Control rate %", "Studio pairs", "Studio detail opens", "Studio rate %", "Studio fallbacks excluded"];
    const byDog = new Map<string, PairResult[]>();
    for (const pair of pairs) {
      if (!byDog.has(pair.dogId)) byDog.set(pair.dogId, []);
      byDog.get(pair.dogId)!.push(pair);
    }
    const fallbackByDog = new Map<string, number>();
    for (const row of exposures) if (row.dog_id && row.metadata?.rendered === "original_fallback") fallbackByDog.set(row.dog_id, (fallbackByDog.get(row.dog_id) ?? 0) + 1);
    const perDogRows: WorkbookCell[][] = STUDIO_EXPERIMENT_ENTRIES.map((entry) => {
      const rows = byDog.get(entry.dogId) ?? [];
      const c = rows.filter((pair) => pair.arm === "control");
      const s = rows.filter((pair) => pair.arm === "studio");
      const opens = (list: PairResult[]) => list.filter((pair) => pair.outcomes.dog_profile_view).length;
      return [dogName.get(entry.dogId) ?? "", entry.dogId, dogStatus.get(entry.dogId) ?? "unknown", entry.cohort,
        c.length, opens(c), rate(opens(c), c.length), s.length, opens(s), rate(opens(s), s.length), fallbackByDog.get(entry.dogId) ?? 0];
    });

    const dailyHeader = ["Date (Bangkok)", "Control first exposures", "Studio first exposures", "Control detail opens", "Studio detail opens"];
    const daily = new Map<string, number[]>();
    for (const pair of pairs) {
      const key = day(pair.firstExposureAt);
      const cell = daily.get(key) ?? [0, 0, 0, 0];
      const armIndex = pair.arm === "control" ? 0 : 1;
      cell[armIndex] += 1;
      if (pair.outcomes.dog_profile_view) cell[armIndex + 2] += 1;
      daily.set(key, cell);
    }
    const dailyRows: WorkbookCell[][] = [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, cells]) => [date, ...cells]);

    const definitions: WorkbookCell[][] = [
      ["Topic", "Definition"],
      ["Design", "Same dog, same listing id. Each visitor is randomly assigned 50/50 per dog (stable for the experiment version), so most visitors see some dogs in each arm."],
      ["Control", "The dog's original cover photo, unchanged."],
      ["Treatment", "The reviewed studio-background derivative: original dog pixels kept, background replaced locally (no generative model). A small 'Edited background' label is shown."],
      ["Excluded dogs", "Genuine studio originals, video covers, failed or unreviewed edits, and any dog whose live cover no longer matches the source of its derivative."],
      ["Qualified exposure", "Active feed card, cover slide showing, chosen image loaded, page visible, ≥60% of the photo in view, nothing on top of it, held for one second. Preloaded neighbours never count."],
      ["Deduplication", "One exposure per dog per browser tab session; the report then keeps only the first exposure per visitor and dog."],
      ["Attribution", `Outcomes count when the same visitor (first-party cookie) acts on the same dog within ${ATTRIBUTION_WINDOW_HOURS} hours after the first exposure, from any page.`],
      ["Privacy", "First-party only; nothing in this experiment is sent to Google Analytics. Events carry dog id, variant and position; no form contents, messages, email addresses or documents."],
      ["Cohort expansion", "Each dog is randomised within itself, so adding cohorts keeps arms balanced. Compare per-dog rows and dates when cohorts change."],
      ["Limits", "Visitor cookies reset across browsers and devices. Internal or test traffic is not tagged. Saves are a current snapshot. Detail opens are an engagement signal, not adoption outcomes."],
    ];

    const workbook = makeAnalyticsWorkbook([
      { name: "Summary", rows: summary },
      { name: "Per dog", rows: [perDogHeader, ...perDogRows] },
      { name: "Daily", rows: [dailyHeader, ...dailyRows] },
      { name: "Definitions", rows: definitions },
    ]);
    return new Response(Buffer.from(workbook), {
      headers: {
        ...headers,
        "Content-Disposition": `attachment; filename="pawjai-studio-photo-experiment-${version}-${selectedRange}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Export unavailable." }, { status: 503, headers });
  }
}
