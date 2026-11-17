import type { Metadata } from "next";
import DogFeedPage from "@/components/dogs/DogFeedPage";
import JsonLd from "@/components/seo/JsonLd";
import { webPageJsonLd } from "@/utils/json-ld";
import { canonicalUrl } from "@/utils/seo";
import { parseStudioPreview } from "@/utils/studio-experiment-model";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PawJai Pet - Adopt a Dog in Thailand",
  description: "PawJai Pet helps people search adoptable shelter dogs, rescue dogs, and dog adoption appointments in Bangkok and Thailand.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PawJai Pet - Adopt a Dog in Thailand",
    description: "Browse adoptable dogs from Thai shelters and find your match on PawJai Pet.",
    url: canonicalUrl("/"),
    type: "website",
  },
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ focus_group_counts?: string; studio_preview?: string }> }) {
  const params = await searchParams;
  const sampleSaveCounts = params.focus_group_counts === "1";
  // QA only: ?studio_preview=studio|control shows one photo version and is never measured.
  const studioPreview = parseStudioPreview(params.studio_preview);
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          description: "PawJai Pet helps people search adoptable shelter dogs, rescue dogs, and dog adoption appointments in Bangkok and Thailand.",
          name: "PawJai Pet - Adopt a Dog in Thailand",
          path: "/",
        })}
      />
      <DogFeedPage sampleSaveCounts={sampleSaveCounts} studioPreview={studioPreview} />
    </>
  );
}
