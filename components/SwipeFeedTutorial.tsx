"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Hand, Images, MousePointerClick, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const M = "Montserrat, sans-serif";

type SwipeFeedTutorialProps = {
  enabled?: boolean;
  isLoggedIn: boolean;
};

export default function SwipeFeedTutorial({ enabled = true, isLoggedIn }: SwipeFeedTutorialProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setVisible(Boolean(enabled && !isLoggedIn));
  }, [enabled, isLoggedIn]);

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
        background: "rgba(245,241,232,0.18)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        fontFamily: M,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="swipe-tutorial-title"
    >
      <style>{`
        @keyframes pawjai-tutorial-down {
          0%, 100% { transform: translateY(-20px); opacity: 0.42; }
          45% { transform: translateY(28px); opacity: 1; }
          72% { transform: translateY(40px); opacity: 0; }
        }
        @keyframes pawjai-tutorial-side {
          0%, 100% { transform: translateX(-30px); opacity: 0.45; }
          50% { transform: translateX(30px); opacity: 1; }
        }
        @keyframes pawjai-tutorial-tap {
          0%, 100% { transform: scale(1); opacity: 0.68; }
          48% { transform: scale(0.82); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pawjai-gesture-down,
          .pawjai-gesture-side,
          .pawjai-gesture-tap {
            animation: none !important;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-[18px] top-[18px] z-20 flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white/88 text-[#65584f] shadow-[0_8px_24px_rgba(101,88,79,0.18)] backdrop-blur transition-transform active:scale-95"
        aria-label={t("Close tutorial")}
      >
        <X size={17} strokeWidth={2.4} />
      </button>

      <div className="absolute left-[18px] right-[18px] top-[92px] z-10">
        <div className="inline-flex rounded-full bg-white/88 px-[14px] py-[8px] text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#cd8188] shadow-[0_10px_28px_rgba(101,88,79,0.18)] backdrop-blur">
          {t("Quick guide")}
        </div>
        <h2
          id="swipe-tutorial-title"
          className="mt-[10px] max-w-[300px] rounded-[24px] bg-white/88 px-[16px] py-[13px] text-[22px] font-black leading-[1.08] text-[#65584f] shadow-[0_14px_34px_rgba(101,88,79,0.18)] backdrop-blur"
        >
          {t("How to browse dogs")}
        </h2>
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-[238px] z-10 flex h-[88px] w-[88px] -translate-x-1/2 items-center justify-center rounded-full bg-[#cd8188] shadow-[0_18px_42px_rgba(205,129,136,0.38)]"
        aria-hidden="true"
      >
        <Hand
          className="pawjai-gesture-down"
          size={42}
          stroke="white"
          strokeWidth={2.4}
          style={{ animation: "pawjai-tutorial-down 1.55s ease-in-out infinite" }}
        />
      </div>

      <TutorialBubble
        className="absolute left-[20px] right-[20px] top-[344px]"
        icon={<ChevronDown className="pawjai-gesture-down" size={20} strokeWidth={2.8} style={{ animation: "pawjai-tutorial-down 1.55s ease-in-out infinite" }} />}
        title={t("Swipe down for the next dog")}
        detail={t("The feed moves vertically, one profile at a time.")}
      />

      <TutorialBubble
        className="absolute left-[20px] right-[20px] top-[446px]"
        icon={<Images className="pawjai-gesture-side" size={20} strokeWidth={2.4} style={{ animation: "pawjai-tutorial-side 1.6s ease-in-out infinite" }} />}
        title={t("Swipe left or right for photos")}
        detail={t("Use the top photo bar to see where you are.")}
      />

      <TutorialBubble
        className="absolute left-[20px] right-[20px] bottom-[116px]"
        icon={<MousePointerClick className="pawjai-gesture-tap" size={20} strokeWidth={2.4} style={{ animation: "pawjai-tutorial-tap 1.35s ease-in-out infinite" }} />}
        title={t("Tap the dog card for details")}
        detail={t("Open the full profile when you want to learn more.")}
      />

      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute bottom-[28px] left-[36px] right-[36px] z-20 flex h-[48px] items-center justify-center rounded-[24px] bg-[#cd8188] text-[15px] font-extrabold text-white shadow-[0_14px_32px_rgba(205,129,136,0.34)] transition-transform active:scale-[0.98]"
      >
        {t("Got it")}
      </button>
    </div>
  );
}

function TutorialBubble({
  className,
  icon,
  title,
  detail,
}: {
  className: string;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div
      className={`${className} flex items-center gap-[12px] rounded-[22px] bg-white/88 px-[14px] py-[12px] shadow-[0_14px_34px_rgba(101,88,79,0.18)] backdrop-blur`}
    >
      <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#f5f1e8] text-[#cd8188]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-extrabold leading-[1.2] text-[#65584f]">{title}</p>
        <p className="mt-[3px] text-[12px] font-medium leading-[1.28] text-[#65584f]/66">{detail}</p>
      </div>
    </div>
  );
}
