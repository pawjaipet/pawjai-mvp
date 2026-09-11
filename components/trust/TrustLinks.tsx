import Link from "next/link";

export default function TrustLinks() {
  return (
    <nav aria-label="PawJai policies and support" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] text-[#65584f]">
      {[["/privacy", "Privacy Policy"], ["/terms", "Terms of Use"], ["/safety", "Adoption Safety"], ["/about#contact", "Contact us"]].map(([href, label]) => (
        <Link key={href} href={href} className="inline-flex min-h-[44px] items-center underline underline-offset-4 hover:text-[#8a4f58]">{label}</Link>
      ))}
    </nav>
  );
}
