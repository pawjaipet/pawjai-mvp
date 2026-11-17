// Studio-background photo experiment: pure model shared by server, client and tests.
// No runtime imports so it stays testable and safe to bundle anywhere.
import type { DogMediaItem } from "@/utils/dog-media";

export const STUDIO_EXPERIMENT_EVENT = "dog_photo_exposure" as const;
export const STUDIO_PREVIEW_PARAM = "studio_preview";

export type StudioVariant = "control" | "studio";
export type StudioPreview = StudioVariant;
/** What the visitor actually saw. A failed derivative falls back to the original. */
export type StudioRendered = "original" | "studio" | "original_fallback";

export type StudioManifestEntry = {
  /** Public listing id; the same dog row serves both arms. */
  dogId: string;
  /** Release cohort; only enabled cohorts are randomised. */
  cohort: string;
  /** Id of the cover media item the derivative was made from (manifest item or dog_photos row). */
  coverItemId: string;
  /** Normalised public URL of that cover at processing time. */
  sourceUrl: string;
  /** B2 content SHA-1 of the source file (first 12 hex chars name the derivative). */
  sourceSha1: string;
  /** Public CDN URL of the reviewed derivative (B2 object under experiments/studio-background-v1/). */
  derivativeUrl: string;
  /** SHA-1 of the derivative bytes, for auditing the uploaded object. */
  derivativeSha1: string;
  derivativeBytes: number;
  width: number;
  height: number;
};

export type StudioExperimentConfig = {
  version: string;
  enabled: boolean;
  enabledCohorts: string[];
};

export type StudioPhotoAssignment = {
  version: string;
  variant: StudioVariant;
  cohort: string;
  originalUrl: string;
  studioUrl: string;
  /** Short source fingerprint recorded with exposures (stale derivatives never apply). */
  source: string;
  /** False for QA previews: nothing is recorded as an experiment exposure. */
  measured: boolean;
  preview: StudioPreview | null;
};

/** 32-bit FNV-1a, deterministic across server and browser. */
export function fnv1a32(input: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Stable 50/50 assignment per (visitor, dog) within one experiment version.
 * The same visitor always sees the same version of the same dog; a new
 * version (e.g. studio-bg-v2) re-randomises independently.
 */
export function assignStudioVariant(unitId: string, dogId: string, version: string): StudioVariant {
  return fnv1a32(`${version}:${unitId.toLowerCase()}:${dogId.toLowerCase()}`) % 2 === 0 ? "control" : "studio";
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isExperimentUnitId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Kill switch / cohort control from the server environment.
 *   unset          -> code defaults (manifest file)
 *   "off"          -> experiment disabled everywhere (originals only)
 *   "c1" / "c1,c2" -> enable exactly those cohorts
 */
export function resolveStudioExperimentConfig(
  defaults: StudioExperimentConfig,
  setting: string | undefined | null,
): StudioExperimentConfig {
  const raw = setting?.trim().toLowerCase();
  if (!raw) return defaults;
  if (["off", "0", "false", "disabled", "none"].includes(raw)) {
    return { ...defaults, enabled: false, enabledCohorts: [] };
  }
  const cohorts = raw.split(",").map((value) => value.trim()).filter((value) => /^[a-z0-9_-]{1,20}$/.test(value));
  return cohorts.length ? { ...defaults, enabled: true, enabledCohorts: cohorts } : defaults;
}

export function parseStudioPreview(value: unknown): StudioPreview | null {
  return value === "studio" || value === "control" ? value : null;
}

type CoverLike = Pick<DogMediaItem, "id" | "publicUrl" | "type"> | null | undefined;

/**
 * Decide what one dog's feed cover shows for one visitor.
 * Returns null (original photo, not part of the experiment) whenever the dog
 * has no reviewed derivative, the cover is a video, the live cover no longer
 * matches the source the derivative was made from, the cohort is not enabled,
 * or there is no stable visitor id.
 */
export function resolveStudioPhotoAssignment({
  config,
  cover,
  entry,
  preview = null,
  unitId,
}: {
  config: StudioExperimentConfig;
  cover: CoverLike;
  entry: StudioManifestEntry | undefined;
  preview?: StudioPreview | null;
  unitId: string | null | undefined;
}): StudioPhotoAssignment | null {
  if (!entry || !cover || cover.type !== "photo" || !cover.publicUrl) return null;
  if (cover.publicUrl !== entry.sourceUrl || cover.id !== entry.coverItemId) return null;

  const base = {
    cohort: entry.cohort,
    originalUrl: cover.publicUrl,
    source: entry.sourceSha1.slice(0, 12),
    studioUrl: entry.derivativeUrl,
    version: config.version,
  };
  if (preview) return { ...base, measured: false, preview, variant: preview };
  if (!config.enabled || !config.enabledCohorts.includes(entry.cohort)) return null;
  if (!isExperimentUnitId(unitId)) return null;
  return { ...base, measured: true, preview: null, variant: assignStudioVariant(unitId, entry.dogId, config.version) };
}

export type ExposureConditions = {
  /** Card is the settled active feed card (preloaded neighbours are not). */
  active: boolean;
  /** The cover slide (not another gallery photo) is showing. */
  coverShowing: boolean;
  /** The chosen image finished loading. */
  loaded: boolean;
  pageVisible: boolean;
  /** Visible fraction of the photo inside the viewport (0..1). */
  visibleRatio: number;
  /** A modal, tutorial or other overlay covers the photo. */
  obstructed: boolean;
  /** QA previews and unassigned dogs are never measured. */
  measured: boolean;
};

export const QUALIFIED_EXPOSURE_MIN_RATIO = 0.6;
export const QUALIFIED_EXPOSURE_DWELL_MS = 1000;

export function exposureConditionsMet(state: ExposureConditions) {
  return state.measured
    && state.active
    && state.coverShowing
    && state.loaded
    && state.pageVisible
    && !state.obstructed
    && state.visibleRatio >= QUALIFIED_EXPOSURE_MIN_RATIO;
}

/** One qualified exposure per experiment version, dog and browser tab session. */
export function studioExposureDedupeKey(version: string, dogId: string) {
  return `photo-exposure:${version}:${dogId}`;
}

export const STUDIO_EXPOSURE_DEDUPE_WINDOW_MS = 12 * 60 * 60 * 1000;

export function studioExposureMetadata({
  assignment,
  cardPosition,
  dogPosition,
  feedVisitId,
  loadMs,
  rendered,
}: {
  assignment: StudioPhotoAssignment;
  cardPosition: number | null;
  dogPosition: number | null;
  feedVisitId: string | null;
  loadMs: number | null;
  rendered: StudioRendered;
}) {
  return {
    cardPosition,
    cohort: assignment.cohort,
    dogPosition,
    experiment: assignment.version,
    feedVisitId,
    loadMs: loadMs === null ? null : Math.max(0, Math.round(loadMs)),
    rendered,
    source: assignment.source,
    surface: "swipe_feed",
    variant: assignment.variant,
  } satisfies Record<string, boolean | number | string | null>;
}
