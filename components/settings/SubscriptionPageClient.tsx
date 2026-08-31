"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
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
  billingConfigured: boolean;
  billingStatus: string | null;
  cancelAtPeriodEnd: boolean;
  checkoutState: string | null;
  currentPeriodEnd: string | null;
  currentTier: SubscriptionTier;
  hasBillingAccount: boolean;
  launchPremiumGrantNumber: number | null;
}

export default function SubscriptionPageClient({
  billingConfigured,
  billingStatus,
  cancelAtPeriodEnd,
  checkoutState,
  currentPeriodEnd,
  currentTier,
  hasBillingAccount,
  launchPremiumGrantNumber,
}: Props) {
  const [busyTier, setBusyTier] = useState<SubscriptionTier | "portal" | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const current = TIERS.find((t) => t.id === currentTier)!;
  const hasLaunchPremium = launchPremiumGrantNumber !== null;
  const { t } = useLanguage();

  async function openBilling(targetTier: SubscriptionTier) {
    setBillingError(null);
    const usePortal = hasBillingAccount || targetTier === "free";
    setBusyTier(usePortal ? "portal" : targetTier);
    try {
      const response = await fetch(usePortal ? "/api/billing/portal" : "/api/billing/checkout", {
        body: usePortal ? undefined : JSON.stringify({ tier: targetTier }),
        headers: usePortal ? undefined : { "content-type": "application/json" },
        method: "POST",
      });
      const payload = await response.json() as { error?: string; url?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Billing is unavailable.");
      window.location.assign(payload.url);
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : "Billing is unavailable.");
      setBusyTier(null);
    }
  }

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
          <p className="text-[26px] font-extrabold mt-[2px]" style={{ color: current.headerFg, fontFamily: M }}>
            {t(hasLaunchPremium ? "Founding Premium" : current.name)}
          </p>
          <p className="mt-[4px]" style={{ color: current.headerFg, fontFamily: M }}>
            {hasLaunchPremium ? (
              <>
                <span className="text-[24px] font-bold">{t("Free")}</span>
                <span className="text-[14px] opacity-80"> · {t("Founding member access")}</span>
              </>
            ) : (
              <>
                <span className="text-[24px] font-bold">฿{current.price.toFixed(2)}</span>
                <span className="text-[14px] opacity-80"> {t("/Month")}</span>
              </>
            )}
          </p>
        </div>
        <div className="bg-white p-[18px]">
          <FeatureList tier={current} />
          {billingStatus && billingStatus !== "none" && (
            <p className="mt-[14px] text-[12px] leading-[1.5] text-[#65584f]/65">
              Billing status: <strong className="font-bold text-[#65584f]">{billingStatus.replaceAll("_", " ")}</strong>
              {cancelAtPeriodEnd && currentPeriodEnd
                ? ` · Ends ${new Date(currentPeriodEnd).toLocaleDateString("en-GB")}`
                : ""}
            </p>
          )}
          {hasLaunchPremium ? (
            <div
              className="mt-[18px] w-full rounded-[12px] bg-[#f7e4e6] px-[14px] py-[12px] text-center text-[14px] font-bold text-[#9f5960]"
              role="status"
            >
              {t("Premium access is included")}
            </div>
          ) : (
            <button
              type="button"
              disabled={!hasBillingAccount || busyTier !== null}
              onClick={() => openBilling(currentTier)}
              className="mt-[18px] w-full rounded-[12px] py-[12px] text-[14px] font-bold disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: "#cd8188", color: "white", fontFamily: M }}
            >
              {busyTier === "portal" ? "Opening billing…" : hasBillingAccount ? "Manage billing" : t("Current Plan")}
            </button>
          )}
        </div>
      </div>

      {hasLaunchPremium && (
        <div className="mx-[16px] mt-[14px] rounded-[16px] border border-[#e9c7ca] bg-white px-[16px] py-[15px] text-[#65584f]">
          <p className="text-[13px] font-extrabold text-[#b46870]">
            {t("Founding member")} #{launchPremiumGrantNumber} {t("of 200")}
          </p>
          <p className="mt-[5px] text-[13px] leading-[1.55] text-[#65584f]/75">
            {t("Your free Premium access includes unlimited dog browsing, unlimited wishlist saves, advanced matching, priority visits, and no ads.")}
          </p>
        </div>
      )}

      {!hasLaunchPremium && checkoutState === "success" && (
        <p className="mx-[16px] mt-[14px] rounded-[12px] bg-[#e8f4df] px-[14px] py-[11px] text-[13px] font-semibold text-[#356c2d]" role="status">
          Payment received. Your plan updates as soon as Stripe confirms it.
        </p>
      )}
      {!hasLaunchPremium && checkoutState === "cancelled" && (
        <p className="mx-[16px] mt-[14px] rounded-[12px] bg-white px-[14px] py-[11px] text-[13px] text-[#65584f]/70" role="status">
          Checkout was cancelled. Your current plan has not changed.
        </p>
      )}
      {!hasLaunchPremium && !billingConfigured && (
        <p className="mx-[16px] mt-[14px] rounded-[12px] bg-[#fff0db] px-[14px] py-[11px] text-[13px] text-[#8b5a14]" role="status">
          Subscription checkout is temporarily unavailable while billing setup is completed.
        </p>
      )}
      {!hasLaunchPremium && billingError && (
        <p className="mx-[16px] mt-[14px] rounded-[12px] bg-[#fde9e9] px-[14px] py-[11px] text-[13px] text-[#9f3636]" role="alert">
          {billingError}
        </p>
      )}

      {!hasLaunchPremium && (
        <>
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
                billingConfigured={billingConfigured}
                busy={busyTier !== null}
                onSelect={() => openBilling(tier.id)}
              />
            ))}
          </div>

          <p className="px-[24px] mt-[28px] text-[12px] text-center leading-[1.5]" style={{ color: "rgba(101,88,79,0.6)", fontFamily: M }}>
            {t("All plans include customer support. Upgrade when you want more browsing, more saved dogs, or premium matching.")}
          </p>
        </>
      )}

    </div>
  );
}

function TierCard({
  tier,
  isCurrent,
  billingConfigured,
  busy,
  onSelect,
}: {
  tier: TierConfig;
  isCurrent: boolean;
  billingConfigured: boolean;
  busy: boolean;
  onSelect: () => void;
}) {
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
            disabled={!billingConfigured || busy}
            onClick={onSelect}
            className="mt-[18px] flex w-full items-center justify-center gap-2 rounded-[12px] py-[12px] text-[14px] font-bold transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: tier.ctaBg, color: tier.ctaFg, fontFamily: M }}
          >
            {busy && <LoaderCircle size={16} className="animate-spin" />}
            {tier.id === "free" ? "Manage downgrade" : t("Upgrade Now")}
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
