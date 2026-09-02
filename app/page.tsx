import type { Metadata } from "next";
import DogFeedPage from "@/components/dogs/DogFeedPage";
import JsonLd from "@/components/seo/JsonLd";
import { webPageJsonLd } from "@/utils/json-ld";
import { canonicalUrl } from "@/utils/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Adopt a Dog in Thailand",
  description: "PawJai Pet helps people searching for PawJai, Project Pet, or dog adoption in Thailand browse adoptable shelter dogs.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PawJai - Adopt a Dog in Thailand",
    description: "Browse adoptable dogs from Thai shelters and find your match on PawJai Pet.",
    url: canonicalUrl("/"),
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          description: "PawJai Pet helps people searching for PawJai, Project Pet, or dog adoption in Thailand browse adoptable shelter dogs.",
          name: "PawJai - Adopt a Dog in Thailand",
          path: "/",
        })}
      />
      <DogFeedPage />
    </>
  );
}
