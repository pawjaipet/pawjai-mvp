import type { Metadata } from "next";
import SwipePage from "../swipe/page";
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

export default SwipePage;
