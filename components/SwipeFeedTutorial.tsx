"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, ChevronUp, Hand, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const M = "Montserrat, sans-serif";
const DISMISSED_KEY = "pawjai.swipeFeedTutorialDismissed";

type SwipeFeedTutorialProps = {
  enabled?: boolean;
  isLoggedIn: boolean;
};

export default function SwipeFeedTutorial({ enabled = true, isLoggedIn }: SwipeFeedTutorialProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!enabled || isLoggedIn) {
      setVisible(false);
      return;
    }

    try {
      setVisible(window.localStorage.getItem(DISMISSED_KEY) !== "true");
    } catch {
      setVisible(true);
    }
  }, [enabled, isLoggedIn]);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Tutorial dismissal is a comfort preference; ignore blocked storage.
    }
  }

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setVisible(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  if (!enabled || isLoggedIn || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[80] mx-auto h-[100dvh] w-full max-w-[402px] overflow-hidden"
      style={{
        background: "rgba(101,88,79,0.72)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        fontFamily: M,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="swipe-tutorial-title"
    >
      <style>{`
        @keyframes pawjai-tutorial-up {
          0%, 100% { transform: translateY(26px); opacity: 0.45; }
          44% { transform: translateY(-24px); opacity: 1; }
          72% { transform: translateY(-36px); opacity: 0; }
        }
        @keyframes pawjai-tutorial-side {
          0%, 100% { transform: translateX(-30px); opacity: 0.45; }
          50% { transform: translateX(30px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pawjai-gesture-up,
          .pawjai-gesture-side {
            animation: none !important;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={dismiss}
        className="absolute right-[18px] top-[18px] z-20 flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#cd8188]/90 text-white shadow-[0_8px_24px_rgba(205,129,136,0.35)] ring-1 ring-white/35 backdrop-blur transition-transform active:scale-95"
        aria-label={t("Close tutorial")}
      >
        <X size={17} strokeWidth={2.4} />
      </button>

      <div className="absolute left-[24px] right-[24px] top-[126px] z-10 text-center">
        <p
          id="swipe-tutorial-title"
          className="rounded-[26px] bg-[#cd8188]/90 px-[18px] py-[14px] text-[18px] font-extrabold leading-[1.28] text-white shadow-[0_16px_38px_rgba(205,129,136,0.34)] ring-1 ring-white/35 backdrop-blur"
        >
          {t("Scroll up to view dogs. Swipe left or right to see more photos.")}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[266px] z-10 flex flex-col items-center gap-[42px]" aria-hidden="true">
        <div className="relative flex h-[118px] w-[118px] items-center justify-center rounded-full bg-[#cd8188] shadow-[0_18px_42px_rgba(205,129,136,0.38)]">
          <ChevronUp className="absolute top-[14px] text-white/80" size={26} strokeWidth={3} />
          <Hand
            className="pawjai-gesture-up"
            size={44}
            stroke="white"
            strokeWidth={2.4}
            style={{ animation: "pawjai-tutorial-up 1.55s ease-in-out infinite" }}
          />
        </div>

        <div className="relative flex h-[96px] w-[168px] items-center justify-center rounded-full bg-[#cd8188]/90 text-white shadow-[0_16px_36px_rgba(205,129,136,0.32)] ring-1 ring-white/35 backdrop-blur">
          <ArrowLeftRight className="absolute opacity-70" size={76} strokeWidth={1.7} />
          <Hand
            className="pawjai-gesture-side"
            size={38}
            stroke="white"
            strokeWidth={2.4}
            style={{ animation: "pawjai-tutorial-side 1.6s ease-in-out infinite" }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="absolute bottom-[28px] left-[36px] right-[36px] z-20 flex h-[48px] items-center justify-center rounded-[24px] bg-[#cd8188] text-[15px] font-extrabold text-white shadow-[0_14px_32px_rgba(205,129,136,0.34)] transition-transform active:scale-[0.98]"
      >
        {t("Got it")}
      </button>
    </div>
  );
}
