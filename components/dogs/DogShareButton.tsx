"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { sendProductAnalyticsEvent } from "@/utils/product-analytics-client";

export default function DogShareButton({ dogId, dogName, surface, compact = false }: {
  dogId: string; dogName: string; surface: "swipe_feed" | "dog_detail"; compact?: boolean;
}) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  async function share() {
    const url = new URL(`/dogs/${dogId}`, window.location.origin).toString();
    const nativeShare = typeof navigator.share === "function";
    try {
      if (nativeShare) await navigator.share({ title: dogName, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied");
      }
      sendProductAnalyticsEvent({ dogId, eventName: "dog_shared", metadata: { method: nativeShare ? "native" : "clipboard", source: surface } });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) setMessage("Could not share. Please try again.");
    }
  }
  return <div className="relative">
    <button type="button" onClick={share} aria-label={t("Share")} className={`${compact ? "h-12 w-12" : "h-14 w-14"} flex items-center justify-center rounded-full bg-[#cd8188] text-white shadow-lg active:scale-95`}><Share2 size={24} /></button>
    {message && <span role="status" className="absolute bottom-full right-0 mb-2 w-44 rounded-xl bg-white p-2 text-center text-xs text-[#65584f] shadow-lg">{t(message)}</span>}
  </div>;
}
