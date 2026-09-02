import type { Metadata } from "next";
import DogFeedPage from "@/components/dogs/DogFeedPage";
import JsonLd from "@/components/seo/JsonLd";
import { webPageJsonLd } from "@/utils/json-ld";
import { canonicalUrl } from "@/utils/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Available Dogs",
  description: "Meet available dogs on PawJai and start your adoption journey with verified Thai shelter partners.",
  alternates: {
    canonical: "/dogs",
  },
  openGraph: {
    title: "Available Dogs on PawJai",
    description: "Meet available dogs from Thai shelter partners.",
    url: canonicalUrl("/dogs"),
    type: "website",
  },
};

export default function DogsPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          description: "Meet available dogs on PawJai and start your adoption journey with verified Thai shelter partners.",
          name: "Available Dogs on PawJai",
          path: "/dogs",
        })}
      />
      <DogFeedPage />
    </>
  );
}
