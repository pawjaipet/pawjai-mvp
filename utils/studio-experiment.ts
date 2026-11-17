import "server-only";

import type { DogMediaItem } from "@/utils/dog-media";
import { STUDIO_EXPERIMENT_DEFAULTS, STUDIO_EXPERIMENT_ENTRIES } from "@/utils/studio-experiment-manifest";
import {
  resolveStudioExperimentConfig,
  resolveStudioPhotoAssignment,
  type StudioPhotoAssignment,
  type StudioPreview,
} from "@/utils/studio-experiment-model";

const ENTRY_BY_DOG = new Map(STUDIO_EXPERIMENT_ENTRIES.map((entry) => [entry.dogId, entry]));

/**
 * Kill switch: PAWJAI_STUDIO_EXPERIMENT=off (Vercel env, then redeploy) shows
 * every original photo and records no exposures. "c1,c2" enables cohorts
 * without a code change. Unset uses the reviewed defaults in the manifest.
 */
export function getStudioExperimentConfig() {
  return resolveStudioExperimentConfig(STUDIO_EXPERIMENT_DEFAULTS, process.env.PAWJAI_STUDIO_EXPERIMENT);
}

export function studioAssignmentsForDogs(
  dogs: { id: string; media?: DogMediaItem[] }[],
  { preview, unitId }: { preview: StudioPreview | null; unitId: string | null },
) {
  const config = getStudioExperimentConfig();
  const assignments = new Map<string, StudioPhotoAssignment>();
  for (const dog of dogs) {
    const assignment = resolveStudioPhotoAssignment({
      config,
      cover: dog.media?.[0],
      entry: ENTRY_BY_DOG.get(dog.id),
      preview,
      unitId,
    });
    if (assignment) assignments.set(dog.id, assignment);
  }
  return assignments;
}
