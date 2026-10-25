"use client";
import { useEffect, useState } from "react";
import { PawPrint } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function DogCardPhoto({ src, alt, first, active }: { src: string; alt: string; first: boolean; active: boolean }) {
  const { t } = useLanguage();
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (state !== "loading" || !first) return;
    const timeout = window.setTimeout(() => setState("failed"), 15000);
    return () => window.clearTimeout(timeout);
  }, [state, first, attempt]);
  return <div className="relative h-full w-full">
    {state !== "ready" && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-20 text-center text-sm text-[#65584f]" role="status">
      <PawPrint size={36} />
      <span>{t(state === "failed" ? "Photo could not load." : "Loading photo…")}</span>
      {state === "failed" && <button type="button" onClick={event => { event.preventDefault(); event.stopPropagation(); setState("loading"); setAttempt(value => value + 1); }} className="rounded-full bg-white px-4 py-2 underline">{t("Try again")}</button>}
    </div>}
    {/* First images of mounted neighbours start early; the feed mounts only nearby cards. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img key={`${src}-${attempt}`} src={src} alt={alt} className={`h-full w-full object-cover ${state === "ready" ? "opacity-100" : "opacity-0"}`} decoding="async" draggable={false} fetchPriority={active && first ? "high" : "auto"} loading={first ? "eager" : "lazy"} onLoad={() => setState("ready")} onError={() => setState("failed")} />
  </div>;
}
