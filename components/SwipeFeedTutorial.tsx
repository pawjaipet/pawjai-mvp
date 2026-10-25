"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ArrowUp, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const M = "Montserrat, sans-serif";
const DISMISSED_KEY = "pawjai.swipeFeedTutorialDismissed";

type SwipeFeedTutorialProps = {
  enabled?: boolean;
  isLoggedIn: boolean;
};

// Echo the logo’s four rounded toes and paw-shaped “A” without cropping the wordmark.
function PawGesture({ className, size, style }: { className: string; size: number; style: CSSProperties }) {
  return (
    <span
      className={`${className} relative inline-flex shrink-0 items-center justify-center rounded-full bg-[#fff8f0] p-[7px] shadow-[0_2px_8px_rgba(101,88,79,0.25)]`}
      style={{ width: size, height: size, ...style }}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="#cd8188" aria-hidden="true" focusable="false">
        <ellipse cx="12" cy="23" rx="5.5" ry="8" transform="rotate(-14 12 23)" />
        <ellipse cx="25" cy="15" rx="6.5" ry="8" transform="rotate(-7 25 15)" />
        <ellipse cx="40" cy="15" rx="6.5" ry="8" transform="rotate(7 40 15)" />
        <ellipse cx="53" cy="23" rx="5.5" ry="8" transform="rotate(14 53 23)" />
        <path
          fillRule="evenodd"
          d="M32 26C21 26 12 37 7 51C3 63 17 61 25 55L32 49L39 55C47 61 61 63 57 51C52 37 43 26 32 26ZM32 35C28 35 25 39 24 43C29 41 35 41 40 43C39 39 36 35 32 35Z"
        />
      </svg>
    </span>
  );
}

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
      if (event.key === "Escape") {
        setVisible(false);
        try { window.localStorage.setItem(DISMISSED_KEY, "true"); } catch { /* Storage may be disabled. */ }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  if (!enabled || isLoggedIn || !visible) return null;

  return (
    <div
      className="fixed left-1/2 top-[114px] z-[80] -translate-x-1/2 overflow-hidden rounded-[22px] border border-white/40 bg-[#65584f]/45 text-white"
      style={{ width: "min(370px, calc(100vw - 32px))", height: "min(590px, calc(100svh - 200px))", fontFamily: M }}
      role="dialog" aria-labelledby="swipe-tutorial-title"
    >
      <style>{`
        @keyframes pawjai-tutorial-up {
          0%, 100% { transform: translateY(46px); opacity: 0.4; }
          65% { transform: translateY(-44px); opacity: 1; }
          85% { transform: translateY(-54px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .pawjai-gesture-up { animation: none !important; } }
      `}</style>
      <button type="button" onClick={dismiss} aria-label={t("Close tutorial")} className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#65584f] text-white"><X size={22} /></button>
      <div className="flex h-full flex-col items-center justify-center gap-6 px-7 py-16 text-center">
        <p id="swipe-tutorial-title" className="rounded-2xl bg-[#65584f]/90 px-5 py-3 text-lg font-bold">{t("Swipe up to see the next dog.")}</p>
        <div className="relative flex min-h-32 flex-1 items-center justify-center" aria-hidden="true">
          <ArrowUp size={100} strokeWidth={3} className="absolute -translate-y-6 drop-shadow-lg" />
          <PawGesture className="pawjai-gesture-up" size={66} style={{ animation: "pawjai-tutorial-up 1.8s ease-in-out infinite" }} />
        </div>
        <button type="button" onClick={dismiss} className="min-h-12 w-full shrink-0 rounded-full bg-[#cd8188] px-6 py-3 font-bold shadow-lg">{t("Got it")}</button>
      </div>
    </div>
  );
}
