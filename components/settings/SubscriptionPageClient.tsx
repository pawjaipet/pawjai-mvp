"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";

const M = "Montserrat, sans-serif";

type Tier = "free" | "standard" | "premium";

type TierConfig = {
  id: Tier;
  name: string;
  price: number; // THB / month
  features: {
    preference: boolean;
    dogsPerDay: string; // display string
    wishlistCap: string;
    priorityVisit: { included: boolean; label?: string };
    advancedMatching: boolean;
    customerSupport: boolean;
  };
  headerBg: string;
  headerFg: string;
  ctaBg: string;
  ctaFg: string;
  popular?: boolean;
};

const TIERS: TierConfig[] = [
  {
    id: "free",
    name: "Free Tier",
    price: 0,
    features: {
      preference: true,
      dogsPerDay: "25",
      wishlistCap: "5",
      priorityVisit: { included: false },
      advancedMatching: false,
      customerSupport: false,
    },
    headerBg: "linear-gradient(135deg, #9c8f82 0%, #7c6f63 100%)",
    headerFg: "white",
    ctaBg: "#cd8188",
    ctaFg: "white",
  },
  {
    id: "standard",
    name: "Standard",
    price: 199,
    features: {
      preference: true,
      dogsPerDay: "100",
      wishlistCap: "20",
      priorityVisit: { included: true, label: "5" },
      advancedMatching: true,
      customerSupport: false,
    },
    headerBg: "linear-gradient(135deg, #e8d9bd 0%, #d6c8ad 100%)",
    headerFg: "#65584f",
    ctaBg: "#65584f",
    ctaFg: "white",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 399,
    features: {
      preference: true,
      dogsPerDay: "Unlimited",
      wishlistCap: "50",
      priorityVisit: { included: true, label: "10" },
      advancedMatching: true,
      customerSupport: true,
    },
    headerBg: "linear-gradient(135deg, #e89aa1 0%, #cd8188 100%)",
    headerFg: "white",
    ctaBg: "#cd8188",
    ctaFg: "white",
  },
];

interface Props {
  currentTier: Tier;
}

export default function SubscriptionPageClient({ currentTier }: Props) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const current = TIERS.find((t) => t.id === currentTier)!;

  return (
    <div
      className="overflow-y-auto overflow-x-hidden"
      style={{
        width: "402px",
        maxWidth: "100vw",
        margin: "0 auto",
        minHeight: "100dvh",
        paddingBottom: "90px",
        background: "#F5F1E8",
        fontFamily: M,
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-[14px] h-[64px]"
        style={{ background: "rgba(245,241,232,0.95)", backdropFilter: "blur(8px)" }}
      >
        <Link
          href="/settings"
          className="flex h-[40px] w-[40px] items-center justify-center rounded-full active:scale-95 transition-transform"
          style={{ background: "#cd8188" }}
          aria-label="Back to settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-[18px] font-bold absolute left-1/2 -translate-x-1/2" style={{ color: "#65584f", fontFamily: M }}>
          Your Current Plan
        </h1>
        <div className="h-[40px] w-[40px]" />
      </div>

      {/* Current Plan card */}
      <div className="mx-[16px] mt-[16px] rounded-[20px] overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(101,88,79,0.10)" }}>
        <div className="px-[20px] py-[20px]" style={{ background: current.headerBg }}>
          <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: current.headerFg, opacity: 0.75 }}>Current</p>
          <p className="text-[26px] font-extrabold mt-[2px]" style={{ color: current.headerFg, fontFamily: M }}>{current.name}</p>
          <p className="mt-[4px]" style={{ color: current.headerFg, fontFamily: M }}>
            <span className="text-[24px] font-bold">฿{current.price.toFixed(2)}</span>
            <span className="text-[14px] opacity-80"> /Month</span>
          </p>
        </div>
        <div className="bg-white p-[18px]">
          <FeatureList tier={current} />
          <button
            type="button"
            disabled
            className="mt-[18px] w-full rounded-[12px] py-[12px] text-[14px] font-bold opacity-70 cursor-not-allowed"
            style={{ background: "#cd8188", color: "white", fontFamily: M }}
          >
            Current Plan
          </button>
        </div>
      </div>

      {/* Choose Your Plan */}
      <div className="px-[16px] mt-[32px]">
        <h2 className="text-[22px] font-extrabold text-center" style={{ color: "#65584f", fontFamily: M }}>Choose Your Plan</h2>
        <p className="text-[13px] text-center mt-[6px] leading-[1.45]" style={{ color: "rgba(101,88,79,0.65)", fontFamily: M }}>
          Find your perfect furry companion with our flexible subscription plans
        </p>
      </div>

      <div className="px-[16px] mt-[20px] space-y-[18px]">
        {TIERS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isCurrent={tier.id === currentTier}
            onUpgrade={() => setUpgradeOpen(true)}
          />
        ))}
      </div>

      <p className="px-[24px] mt-[28px] text-[12px] text-center leading-[1.5]" style={{ color: "rgba(101,88,79,0.6)", fontFamily: M }}>
        All plans include our happiness guarantee. Cancel anytime.
      </p>

      {upgradeOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-[18px]"
          onClick={() => setUpgradeOpen(false)}
          style={{ paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[340px] rounded-[20px] bg-white px-[22px] py-[22px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[20px] font-bold" style={{ color: "#65584f", fontFamily: M }}>Coming soon</p>
            <p className="mt-[10px] text-[14px] leading-[1.55]" style={{ color: "rgba(101,88,79,0.7)", fontFamily: M }}>
              Payment integration coming soon. We&apos;ll notify you when upgrades are available.
            </p>
            <button
              type="button"
              onClick={() => setUpgradeOpen(false)}
              className="mt-[18px] w-full rounded-[14px] py-[12px] text-[14px] font-bold text-white"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TierCard({ tier, isCurrent, onUpgrade }: { tier: TierConfig; isCurrent: boolean; onUpgrade: () => void }) {
  return (
    <div className="relative rounded-[20px] overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(101,88,79,0.10)" }}>
      {tier.popular && (
        <div
          className="absolute top-0 right-0 z-10 rounded-bl-[12px] px-[12px] py-[6px] text-[10px] font-extrabold uppercase tracking-wide"
          style={{ background: "#65584f", color: "white", fontFamily: M, letterSpacing: "0.08em" }}
        >
          Most Popular
        </div>
      )}
      <div className="px-[20px] py-[20px]" style={{ background: tier.headerBg }}>
        <p className="text-[22px] font-extrabold" style={{ color: tier.headerFg, fontFamily: M }}>{tier.name}</p>
        <p className="mt-[4px]" style={{ color: tier.headerFg, fontFamily: M }}>
          <span className="text-[28px] font-bold">฿{tier.price}</span>
          <span className="text-[14px] opacity-80"> /Month</span>
        </p>
      </div>
      <div className="bg-white p-[18px]">
        <FeatureList tier={tier} />
        {isCurrent ? (
          <button
            type="button"
            disabled
            className="mt-[18px] w-full rounded-[12px] py-[12px] text-[14px] font-bold opacity-70 cursor-not-allowed"
            style={{ background: "#cd8188", color: "white", fontFamily: M }}
          >
            Current Plan
          </button>
        ) : (
          <button
            type="button"
            onClick={onUpgrade}
            className="mt-[18px] w-full rounded-[12px] py-[12px] text-[14px] font-bold active:scale-[0.99] transition-transform"
            style={{ background: tier.ctaBg, color: tier.ctaFg, fontFamily: M }}
          >
            Upgrade Now
          </button>
        )}
      </div>
    </div>
  );
}

function FeatureList({ tier }: { tier: TierConfig }) {
  const items: { label: string; included: boolean; note?: string }[] = [
    { label: "Preference", included: tier.features.preference },
    { label: "Dogs Viewed Per Day", included: true, note: tier.features.dogsPerDay },
    { label: "Wishlisted Dog", included: true, note: tier.features.wishlistCap },
    {
      label: "Priority Dog Visit",
      included: tier.features.priorityVisit.included,
      note: tier.features.priorityVisit.label,
    },
    { label: "Advanced Matching", included: tier.features.advancedMatching },
    { label: "Customer Support", included: tier.features.customerSupport },
  ];
  return (
    <ul className="space-y-[10px]">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-[10px]">
          {it.included ? (
            <Check size={18} className="shrink-0" style={{ color: "#388e4c" }} strokeWidth={2.6} />
          ) : (
            <X size={18} className="shrink-0" style={{ color: "#b3565e" }} strokeWidth={2.6} />
          )}
          <span className="text-[13px]" style={{ color: it.included ? "#65584f" : "rgba(101,88,79,0.5)", fontFamily: M }}>
            {it.label}
            {it.included && it.note ? ` (${it.note})` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
