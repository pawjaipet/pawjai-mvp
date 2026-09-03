import type { Metadata } from "next";
import DogFeedPage from "@/components/dogs/DogFeedPage";
import JsonLd from "@/components/seo/JsonLd";
import { webPageJsonLd } from "@/utils/json-ld";
import { canonicalUrl } from "@/utils/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Available Dogs for Adoption in Thailand",
  description: "Browse adoptable dogs on PawJai Pet and start your adoption journey with Thai shelter partners.",
  alternates: {
    canonical: "/dogs",
  },
  openGraph: {
    title: "Available Dogs on PawJai Pet",
    description: "Meet available dogs from Thai shelter partners on PawJai Pet.",
    url: canonicalUrl("/dogs"),
    type: "website",
  },
};

export default function DogsPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          description: "Browse adoptable dogs on PawJai Pet and start your adoption journey with Thai shelter partners.",
          name: "Available Dogs on PawJai Pet",
          path: "/dogs",
        })}
      />
      <DogFeedPage />
    </>
  );
}
