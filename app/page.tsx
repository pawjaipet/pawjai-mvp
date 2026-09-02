import type { Metadata } from "next";
import DogFeedPage from "@/components/dogs/DogFeedPage";
import JsonLd from "@/components/seo/JsonLd";
import { webPageJsonLd } from "@/utils/json-ld";
import { canonicalUrl } from "@/utils/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Adopt a Dog in Thailand",
  description: "Browse adoptable dogs from Thai shelters and find a companion who matches your home, lifestyle, and heart.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PawJai - Adopt a Dog in Thailand",
    description: "Browse adoptable dogs from Thai shelters and find your match.",
    url: canonicalUrl("/"),
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          description: "Browse adoptable dogs from Thai shelters and find a companion who matches your home, lifestyle, and heart.",
          name: "PawJai - Adopt a Dog in Thailand",
          path: "/",
        })}
      />
      <DogFeedPage />
    </>
  );
}
