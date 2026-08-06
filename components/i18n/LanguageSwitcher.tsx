"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { Language } from "@/components/i18n/translations";

const OPTIONS: { language: Language; label: string; flag: string; aria: string }[] = [
  { language: "th", label: "TH", flag: "🇹🇭", aria: "Switch to Thai" },
  { language: "en", label: "EN", flag: "🇬🇧", aria: "Switch to English" },
];

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export default function LanguageSwitcher({ className = "", compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-white/65 bg-white/86 p-[3px] shadow-[0_6px_18px_rgba(101,88,79,0.16)] backdrop-blur ${className}`}
      data-i18n-ignore
      aria-label="Language"
    >
      {OPTIONS.map((option) => {
        const active = language === option.language;
        return (
          <button
            key={option.language}
            type="button"
            onClick={() => setLanguage(option.language)}
            className={`flex h-[32px] items-center justify-center gap-[5px] rounded-full px-[9px] text-[11px] font-extrabold transition-all active:scale-95 ${
              active ? "bg-[#cd8188] text-white shadow-sm" : "text-[#65584f]/70 hover:bg-[#f5f1e8]"
            }`}
            aria-pressed={active}
            aria-label={option.aria}
          >
            <span className="text-[15px] leading-none" aria-hidden="true">
              {option.flag}
            </span>
            {!compact && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
