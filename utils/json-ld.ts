import { canonicalUrl, SITE_URL } from "@/utils/seo";

export function jsonLdScriptValue(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function pawjaiOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "PawJai",
    url: SITE_URL,
    logo: canonicalUrl("/pawjai-logo-square.png"),
    description: "PawJai helps people in Thailand discover, match with, and adopt dogs from shelter partners.",
  };
}

export function pawjaiWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "PawJai",
    alternateName: ["PawJai Pet", "PawJai Thailand", "PawJai dog adoption"],
    url: SITE_URL,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

export function webPageJsonLd({
  description,
  name,
  path,
}: {
  description: string;
  name: string;
  path: string;
}) {
  const url = canonicalUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name,
    description,
    url,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

export function dogProfileJsonLd({
  age,
  breed,
  description,
  gender,
  image,
  name,
  path,
  shelterName,
}: {
  age: string;
  breed: string | null;
  description: string;
  gender: string;
  image: string | null;
  name: string;
  path: string;
  shelterName: string | null;
}) {
  const url = canonicalUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name: `Adopt ${name} on PawJai`,
    description,
    url,
    image: image ?? undefined,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    about: {
      "@type": "Thing",
      name,
      additionalType: "https://www.wikidata.org/wiki/Q144",
      description,
      image: image ?? undefined,
      gender,
      breed: breed ?? undefined,
      age,
      provider: shelterName
        ? {
            "@type": "AnimalShelter",
            name: shelterName,
          }
        : undefined,
    },
  };
}
