"use client";

import { useEffect, useState } from "react";

const M = "Montserrat, sans-serif";
const PINK = "#cd8188";
const BROWN = "#65584f";
const TAN = "#efe3cf";
const PRICE_PER_TREAT = 10;

const TILES = [
  { count: 1, bones: "🦴" },
  { count: 2, bones: "🦴🦴" },
  { count: 3, bones: "🦴🦴🦴" },
];

export type TreatSelection = { treatCount: number; amountThb: number };

type TreatModalProps = {
  open: boolean;
  onClose: () => void;
  dogName: string;
  shelterName: string;
  dogPhotoUrl: string | null;
  initialCount?: number;
  pending?: boolean;
  onContinue: (selection: TreatSelection) => void;
};

export default function TreatModal({
  open,
  onClose,
  dogName,
  shelterName,
  dogPhotoUrl,
  initialCount = 1,
  pending = false,
  onContinue,
}: TreatModalProps) {
  const [count, setCount] = useState(initialCount);
  const [customOpen, setCustomOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  useEffect(() => {
    if (open) {
      setCount(initialCount);
      setCustomOpen(false);
      setCustomAmount("");
    }
  }, [open, initialCount]);

  if (!open) return null;

  function handleContinue() {
    if (customOpen) {
      const amount = Math.max(PRICE_PER_TREAT, Math.round(Number(customAmount) || 0));
      onContinue({
        amountThb: amount,
        treatCount: Math.max(1, Math.round(amount / PRICE_PER_TREAT)),
      });
      return;
    }
    onContinue({ treatCount: count, amountThb: count * PRICE_PER_TREAT });
  }

  const customValid = !customOpen || Number(customAmount) >= PRICE_PER_TREAT;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-[18px] py-[24px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[370px] rounded-[24px] bg-white px-[24px] pb-[24px] pt-[28px]"
        style={{ fontFamily: M }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dog photo */}
        <div className="flex justify-center">
          <div className="h-[80px] w-[80px] overflow-hidden rounded-full" style={{ background: TAN }}>
            {dogPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dogPhotoUrl} alt={dogName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">🐾</div>
            )}
          </div>
        </div>

        {/* Title + subtitle */}
        <h2 className="mt-[16px] text-center text-[20px] font-bold leading-tight" style={{ color: BROWN }}>
          Buy {dogName} snacks and toys 🦴
        </h2>
        <p className="mt-[8px] text-center text-[13px] leading-5 text-[#8d7f72]">
          Your treats go to {shelterName} to care for {dogName} and friends.
        </p>

        {/* Treat tiles */}
        <div className="mt-[20px] grid grid-cols-3 gap-[10px]">
          {TILES.map((tile) => {
            const selected = !customOpen && count === tile.count;
            return (
              <button
                key={tile.count}
                type="button"
                onClick={() => {
                  setCustomOpen(false);
                  setCount(tile.count);
                }}
                className="flex flex-col items-center rounded-[16px] py-[14px] transition-all active:scale-95"
                style={{
                  background: selected ? PINK : TAN,
                  color: selected ? "#ffffff" : BROWN,
                }}
              >
                <span className="text-[18px] leading-none">{tile.bones}</span>
                <span className="mt-[8px] text-[13px] font-bold">
                  {tile.count} treat{tile.count > 1 ? "s" : ""}
                </span>
                <span className="mt-[2px] text-[12px] font-semibold opacity-80">
                  ฿{tile.count * PRICE_PER_TREAT}
                </span>
              </button>
            );
          })}
        </div>

        {/* Give more */}
        {!customOpen ? (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="mt-[14px] block w-full text-center text-[13px] font-semibold"
            style={{ color: PINK }}
          >
            Give more →
          </button>
        ) : (
          <div className="mt-[14px]">
            <label className="mb-[6px] block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8d7f72]">
              Custom amount (฿)
            </label>
            <input
              autoFocus
              inputMode="numeric"
              min={PRICE_PER_TREAT}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="e.g. 100"
              className="w-full rounded-[14px] border border-[#eadfce] bg-[#fffdfa] px-[16px] py-[12px] text-[15px] font-bold outline-none focus:border-[#cd8188]"
              style={{ color: BROWN }}
            />
            <button
              type="button"
              onClick={() => setCustomOpen(false)}
              className="mt-[8px] text-[12px] font-semibold text-[#8d7f72]"
            >
              ← Back to treats
            </button>
          </div>
        )}

        {/* Continue */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={pending || !customValid}
          className="mt-[20px] w-full rounded-full py-[15px] text-[16px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: PINK, boxShadow: "0 6px 18px rgba(205,129,136,0.35)" }}
        >
          {pending ? "…" : "Continue"}
        </button>

        {/* Maybe later */}
        <button
          type="button"
          onClick={onClose}
          className="mt-[12px] block w-full text-center text-[13px] font-semibold text-[#8d7f72]"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
