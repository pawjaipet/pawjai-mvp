import Image from "next/image";
import Link from "next/link";

/**
 * Sticky gradient header used across all pages.
 * Matches Figma "Logo and Menu" component.
 */
export default function PageHeader() {
  return (
    <div
      className="sticky top-0 z-20 pointer-events-none h-[94px] w-full"
      style={{
        background:
          "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)",
      }}
    >
      <div className="pointer-events-auto absolute left-[8px] top-[39px] flex items-center">
        <Link href="/" className="block h-[55px] w-[110px] relative">
          <Image
            src="/pawjai-logo.png"
            alt="PawJai"
            fill
            className="object-contain object-left"
            priority
          />
        </Link>
      </div>
    </div>
  );
}
