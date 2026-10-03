"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { analyticsConsent, analyticsHost, analyticsPath, GA_CHANGE_EVENT, GA_ID, initializeAnalytics, setAnalyticsConsent, syncAnalyticsConsent, trackGA, trackGAPage } from "@/utils/google-analytics";

function subscribe(callback: () => void) {
  window.addEventListener(GA_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(GA_CHANGE_EVENT, callback); window.removeEventListener("storage", callback); };
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribe, analyticsConsent, () => "pending");
  const [editing, setEditing] = useState(false);
  const { language } = useLanguage();
  const thai = language === "th";
  const enabled = consent === "granted" && analyticsHost() && analyticsPath(pathname) !== null;

  useEffect(() => {
    syncAnalyticsConsent(enabled);
    if (!enabled) return;
    initializeAnalytics();
    trackGAPage(pathname);
    // Receipts are issued only after a server-confirmed outcome. Consume once.
    for (const name of ["pawjai_ga_booking", "pawjai_ga_auth"]) {
      const value = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
      if (!value) continue;
      document.cookie = `${name}=;Max-Age=0;path=/;SameSite=Lax`;
      try {
        const [event, reason] = decodeURIComponent(value).split(":");
        if (["booking_succeeded", "booking_failed", "login", "email_verified"].includes(event)) trackGA(event, { reason: reason || "confirmed" });
      } catch { /* Ignore malformed receipts without affecting navigation. */ }
    }
  }, [enabled, pathname]);

  if (analyticsPath(pathname) === null) return null;
  return <>
    {enabled && <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />}
    {consent !== "pending" && (!consent || editing) && <section data-i18n-ignore aria-label={thai ? "การวิเคราะห์การใช้งาน" : "Analytics preferences"} className="fixed bottom-[82px] left-3 right-3 z-[110] mx-auto max-w-md rounded-2xl border border-[#d6c8ad] bg-white p-4 text-[#65584f] shadow-lg">
      <p className="text-sm leading-6">{thai ? "อนุญาต Google Analytics เพื่อช่วยให้เราเข้าใจการใช้งานและปรับปรุงการรับเลี้ยงสุนัขไหม? ไม่ส่งข้อมูลที่กรอกในแบบฟอร์ม" : "Allow Google Analytics to help us understand site use and make adoption easier? We do not send form contents."} <Link href="/privacy" className="underline">{thai ? "ความเป็นส่วนตัว" : "Privacy"}</Link></p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => { setAnalyticsConsent("denied"); setEditing(false); }} className="min-h-11 flex-1 rounded-xl border border-[#d6c8ad] px-3 text-sm font-semibold">{thai ? "ไม่อนุญาต" : "Decline"}</button>
        <button onClick={() => { setAnalyticsConsent("granted"); setEditing(false); }} className="min-h-11 flex-1 rounded-xl bg-[#cd8188] px-3 text-sm font-semibold text-white">{thai ? "อนุญาต" : "Allow analytics"}</button>
      </div>
    </section>}
    {(pathname === "/privacy" || pathname === "/settings") && <button data-i18n-ignore onClick={() => setEditing(true)} className="mx-auto mb-6 block min-h-11 rounded-full border border-[#d6c8ad] px-5 text-sm underline">{thai ? "ตั้งค่าการวิเคราะห์การใช้งาน" : "Analytics preferences"}</button>}
  </>;
}
