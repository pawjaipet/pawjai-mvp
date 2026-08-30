"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  formatSubscriptionLimit,
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from "@/utils/subscription-limits";

const M = "Montserrat, sans-serif";

type TierConfig = {
  id: SubscriptionTier;
  name: string;
  price: number; // THB / month
  features: {
    preference: boolean;
    dogsPerDay: string; // display string
    wishlistCap: string;
    priorityVisit: boolean;
    advancedMatching: boolean;
    adFree: boolean;
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
    price: SUBSCRIPTION_TIERS.free.priceThbMonthly,
    features: {
      preference: true,
      dogsPerDay: formatSubscriptionLimit(SUBSCRIPTION_TIERS.free.dogViewLimit),
      wishlistCap: formatSubscriptionLimit(SUBSCRIPTION_TIERS.free.wishlistLimit),
      priorityVisit: false,
      advancedMatching: false,
      adFree: false,
    },
    headerBg: "linear-gradient(135deg, #9c8f82 0%, #7c6f63 100%)",
    headerFg: "white",
    ctaBg: "#cd8188",
    ctaFg: "white",
  },
  {
    id: "standard",
    name: "Standard",
    price: SUBSCRIPTION_TIERS.standard.priceThbMonthly,
    features: {
      preference: true,
      dogsPerDay: formatSubscriptionLimit(SUBSCRIPTION_TIERS.standard.dogViewLimit),
      wishlistCap: formatSubscriptionLimit(SUBSCRIPTION_TIERS.standard.wishlistLimit),
      priorityVisit: true,
      advancedMatching: false,
      adFree: false,
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
    price: SUBSCRIPTION_TIERS.premium.priceThbMonthly,
    features: {
      preference: true,
      dogsPerDay: formatSubscriptionLimit(SUBSCRIPTION_TIERS.premium.dogViewLimit),
      wishlistCap: formatSubscriptionLimit(SUBSCRIPTION_TIERS.premium.wishlistLimit),
      priorityVisit: true,
      advancedMatching: true,
      adFree: true,
    },
    headerBg: "linear-gradient(135deg, #e89aa1 0%, #cd8188 100%)",
    headerFg: "white",
    ctaBg: "#cd8188",
    ctaFg: "white",
  },
];

interface Props {
  currentTier: SubscriptionTier;
}

export default function SubscriptionPageClient({ currentTier }: Props) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const current = TIERS.find((t) => t.id === currentTier)!;
  const { t } = useLanguage();

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
          {t("Your Current Plan")}
        </h1>
        <div className="h-[40px] w-[40px]" />
      </div>

      {/* Current Plan card */}
      <div className="mx-[16px] mt-[16px] rounded-[20px] overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(101,88,79,0.10)" }}>
        <div className="px-[20px] py-[20px]" style={{ background: current.headerBg }}>
          <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: current.headerFg, opacity: 0.75 }}>{t("Current")}</p>
          <p className="text-[26px] font-extrabold mt-[2px]" style={{ color: current.headerFg, fontFamily: M }}>{t(current.name)}</p>
          <p className="mt-[4px]" style={{ color: current.headerFg, fontFamily: M }}>
            <span className="text-[24px] font-bold">฿{current.price.toFixed(2)}</span>
            <span className="text-[14px] opacity-80"> {t("/Month")}</span>
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
            {t("Current Plan")}
          </button>
        </div>
      </div>

      {/* Choose Your Plan */}
      <div className="px-[16px] mt-[32px]">
        <h2 className="text-[22px] font-extrabold text-center" style={{ color: "#65584f", fontFamily: M }}>{t("Choose Your Plan")}</h2>
        <p className="text-[13px] text-center mt-[6px] leading-[1.45]" style={{ color: "rgba(101,88,79,0.65)", fontFamily: M }}>
          {t("Find your perfect furry companion with our flexible subscription plans")}
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
        {t("All plans include customer support. Upgrade when you want more browsing, more saved dogs, or premium matching.")}
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
            <p className="text-[20px] font-bold" style={{ color: "#65584f", fontFamily: M }}>{t("Coming soon")}</p>
            <p className="mt-[10px] text-[14px] leading-[1.55]" style={{ color: "rgba(101,88,79,0.7)", fontFamily: M }}>
              {t("Payment integration coming soon. We'll notify you when upgrades are available.")}
            </p>
            <button
              type="button"
              onClick={() => setUpgradeOpen(false)}
              className="mt-[18px] w-full rounded-[14px] py-[12px] text-[14px] font-bold text-white"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              {t("Got it")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TierCard({ tier, isCurrent, onUpgrade }: { tier: TierConfig; isCurrent: boolean; onUpgrade: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="relative rounded-[20px] overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(101,88,79,0.10)" }}>
      {tier.popular && (
        <div
          className="absolute top-0 right-0 z-10 rounded-bl-[12px] px-[12px] py-[6px] text-[10px] font-extrabold uppercase tracking-wide"
          style={{ background: "#65584f", color: "white", fontFamily: M, letterSpacing: "0.08em" }}
        >
          {t("Most Popular")}
        </div>
      )}
      <div className="px-[20px] py-[20px]" style={{ background: tier.headerBg }}>
        <p className="text-[22px] font-extrabold" style={{ color: tier.headerFg, fontFamily: M }}>{t(tier.name)}</p>
        <p className="mt-[4px]" style={{ color: tier.headerFg, fontFamily: M }}>
          <span className="text-[28px] font-bold">฿{tier.price}</span>
          <span className="text-[14px] opacity-80"> {t("/Month")}</span>
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
            {t("Current Plan")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onUpgrade}
            className="mt-[18px] w-full rounded-[12px] py-[12px] text-[14px] font-bold active:scale-[0.99] transition-transform"
            style={{ background: tier.ctaBg, color: tier.ctaFg, fontFamily: M }}
          >
            {t("Upgrade Now")}
          </button>
        )}
      </div>
    </div>
  );
}

function FeatureList({ tier }: { tier: TierConfig }) {
  const { t } = useLanguage();
  const items: { label: string; included: boolean; note?: string }[] = [
    { label: "Preference", included: tier.features.preference },
    { label: "Dogs Viewed Per Day", included: true, note: tier.features.dogsPerDay },
    { label: "Wishlisted Dog", included: true, note: tier.features.wishlistCap },
    { label: "Priority Dog Visit", included: tier.features.priorityVisit },
    { label: "Advanced Matching", included: tier.features.advancedMatching },
    { label: "Ad-Free Browsing", included: tier.features.adFree },
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
            {t(it.label)}
            {it.included && it.note ? ` (${t(it.note)})` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
