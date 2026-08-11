import Image from "next/image";
import Link from "next/link";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

type AdopterPageHeaderProps = {
  title?: string;
};

export default function AdopterPageHeader({ title }: AdopterPageHeaderProps) {
  return (
    <div
      className="sticky top-0 z-10 flex h-[80px] items-center justify-between px-[18px]"
      style={{ background: "rgba(245,241,232,0.95)", backdropFilter: "blur(8px)" }}
    >
      <Link
        href="/"
        className="relative block h-[74px] w-[118px] shrink-0 active:scale-95 transition-transform"
        aria-label="PawJai home"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
      >
        <Image src="/pawjai-logo.png" alt="PawJai" fill sizes="118px" className="object-contain object-left" priority />
      </Link>
      <div className="flex items-center gap-[10px] pt-[4px]">
        {title && <h1 className="text-[18px] font-bold text-[#65584f]">{title}</h1>}
        <LanguageSwitcher compact={!title} />
      </div>
    </div>
  );
}
