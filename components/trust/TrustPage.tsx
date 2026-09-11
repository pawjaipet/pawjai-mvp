import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import TrustLinks from "@/components/trust/TrustLinks";
import { webPageJsonLd } from "@/utils/json-ld";
import { canonicalUrl } from "@/utils/seo";

export function trustMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description,
    alternates: { canonical: canonicalUrl(path) },
    robots: { index: true, follow: true },
    openGraph: { title: `${title} | PawJai Pet`, description, url: canonicalUrl(path), type: "website" },
    twitter: { card: "summary", title: `${title} | PawJai Pet`, description },
  };
}

export default function TrustPage({ title, description, path, sections }: {
  title: string;
  description: string;
  path: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[402px] bg-[#F5F1E8] px-4 pb-[90px] pt-6 text-[#65584f]">
      <JsonLd data={webPageJsonLd({ name: `${title} | PawJai Pet`, description, path })} />
      <Link href="/about" className="inline-flex min-h-[44px] items-center text-sm font-semibold underline underline-offset-4">← About PawJai</Link>
      <header className="pb-6 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest">PawJai Pet</p>
        <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed">{description}</p>
        <p className="mt-4 text-xs">Last updated: <time dateTime="2026-09-11">11 September 2026</time></p>
      </header>
      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[20px] bg-white p-5">
            <h2 className="mb-2 text-[17px] font-bold leading-snug">{section.title}</h2>
            <p className="text-sm leading-7">{section.body}</p>
          </section>
        ))}
        <section className="rounded-[20px] bg-[#d6c8ad]/40 p-5">
          <h2 className="mb-2 text-[17px] font-bold">Contact PawJai</h2>
          <p className="text-sm leading-relaxed">For support, privacy requests, or adoption concerns:</p>
          <a href="mailto:pawjaipet@gmail.com" className="inline-flex min-h-[44px] items-center break-all text-sm font-semibold underline underline-offset-4">pawjaipet@gmail.com</a>
          <p className="text-xs leading-relaxed">Send a brief description first. Do not email passwords, sign-in codes, or identity documents.</p>
        </section>
      </div>
      <footer className="pt-6"><TrustLinks /></footer>
    </div>
  );
}
