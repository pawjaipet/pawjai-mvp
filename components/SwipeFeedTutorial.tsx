"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, ChevronDown, Hand, Images, MousePointerClick, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const STORAGE_KEY = "pawjai.swipeFeedTutorial.v2";
const M = "Montserrat, sans-serif";

type SwipeFeedTutorialProps = {
  enabled?: boolean;
};

export default function SwipeFeedTutorial({ enabled = true }: SwipeFeedTutorialProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!enabled) return;
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "dismissed");
    } catch {
      setVisible(true);
    }
  }, [enabled]);

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      // The tutorial can still be dismissed for this session.
    }
    setVisible(false);
  }

  if (!enabled || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-[18px]"
      style={{
        background: "rgba(101,88,79,0.18)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        fontFamily: M,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="swipe-tutorial-title"
    >
      <style>{`
        @keyframes pawjai-tutorial-down {
          0%, 100% { transform: translateY(-18px); opacity: 0.42; }
          42% { transform: translateY(20px); opacity: 1; }
          68% { transform: translateY(28px); opacity: 0; }
        }
        @keyframes pawjai-tutorial-side {
          0%, 100% { transform: translateX(-28px); opacity: 0.45; }
          50% { transform: translateX(28px); opacity: 1; }
        }
        @keyframes pawjai-tutorial-tap {
          0%, 100% { transform: scale(1); opacity: 0.7; }
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

      <div
        className="relative w-full max-w-[366px] overflow-hidden rounded-[28px] bg-white px-[20px] pb-[20px] pt-[18px]"
        style={{
          boxShadow: "0 24px 60px rgba(101,88,79,0.26)",
          border: "1px solid rgba(255,255,255,0.72)",
        }}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-[14px] top-[14px] flex h-[34px] w-[34px] items-center justify-center rounded-full transition-transform active:scale-95"
          style={{ background: "rgba(101,88,79,0.08)", color: "#65584f" }}
          aria-label={t("Close tutorial")}
        >
          <X size={17} strokeWidth={2.4} />
        </button>

        <div className="pr-[42px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#cd8188]">
            {t("Quick guide")}
          </p>
          <h2 id="swipe-tutorial-title" className="mt-[5px] text-[24px] font-black leading-[1.05] text-[#65584f]">
            {t("Meet dogs faster")}
          </h2>
        </div>

        <div
          className="mt-[18px] rounded-[24px] px-[16px] py-[18px]"
          style={{ background: "linear-gradient(135deg, rgba(245,241,232,0.95), rgba(214,200,173,0.55))" }}
          aria-hidden="true"
        >
          <div className="relative mx-auto h-[138px] max-w-[246px] rounded-[24px] bg-white/82 shadow-[0_14px_32px_rgba(101,88,79,0.16)]">
            <div className="absolute left-[24px] right-[24px] top-[14px] flex gap-[5px]">
              <div className="h-[5px] flex-1 rounded-full bg-[#cd8188]" />
              <div className="h-[5px] flex-1 rounded-full bg-[#d6c8ad]" />
              <div className="h-[5px] flex-1 rounded-full bg-[#d6c8ad]" />
            </div>
            <div className="absolute left-[24px] top-[34px] h-[54px] w-[62px] rounded-[18px] bg-[#d6c8ad]" />
            <div className="absolute bottom-[18px] left-[24px] h-[10px] w-[94px] rounded-full bg-[#65584f]/18" />
            <div className="absolute bottom-[34px] left-[24px] h-[14px] w-[132px] rounded-full bg-[#65584f]/28" />
            <div className="absolute right-[20px] top-[42px] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#cd8188] shadow-[0_10px_24px_rgba(205,129,136,0.30)]">
              <Hand className="pawjai-gesture-down" size={28} stroke="white" strokeWidth={2.3} style={{ animation: "pawjai-tutorial-down 1.55s ease-in-out infinite" }} />
            </div>
            <ChevronDown className="absolute right-[39px] bottom-[17px]" size={20} stroke="#cd8188" strokeWidth={2.6} />
          </div>
        </div>

        <div className="mt-[16px] grid gap-[9px]">
          <TutorialRow
            icon={<ChevronDown className="pawjai-gesture-down" size={18} strokeWidth={2.8} style={{ animation: "pawjai-tutorial-down 1.55s ease-in-out infinite" }} />}
            title={t("Swipe down for the next dog")}
            detail={t("The feed moves vertically, one profile at a time.")}
          />
          <TutorialRow
            icon={<Images className="pawjai-gesture-side" size={18} strokeWidth={2.4} style={{ animation: "pawjai-tutorial-side 1.6s ease-in-out infinite" }} />}
            title={t("Swipe left or right for photos")}
            detail={t("Use the top photo bar to see where you are.")}
          />
          <TutorialRow
            icon={<MousePointerClick className="pawjai-gesture-tap" size={18} strokeWidth={2.4} style={{ animation: "pawjai-tutorial-tap 1.35s ease-in-out infinite" }} />}
            title={t("Tap the card for details")}
            detail={t("Use the calendar button to book a shelter visit.")}
            suffix={<CalendarDays size={17} strokeWidth={2.3} />}
          />
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-[18px] flex h-[48px] w-full items-center justify-center rounded-[22px] text-[15px] font-extrabold text-white transition-transform active:scale-[0.98]"
          style={{ background: "#cd8188", boxShadow: "0 10px 24px rgba(205,129,136,0.30)" }}
        >
          {t("Got it")}
        </button>
      </div>
    </div>
  );
}

function TutorialRow({
  icon,
  title,
  detail,
  suffix,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  suffix?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-[12px] rounded-[18px] bg-[#f5f1e8] px-[12px] py-[11px]">
      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white text-[#cd8188] shadow-[0_5px_14px_rgba(101,88,79,0.08)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold leading-[1.22] text-[#65584f]">{title}</p>
        <p className="mt-[2px] text-[11px] font-medium leading-[1.25] text-[#65584f]/62">{detail}</p>
      </div>
      {suffix && (
        <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[#cd8188] text-white">
          {suffix}
        </div>
      )}
    </div>
  );
}
