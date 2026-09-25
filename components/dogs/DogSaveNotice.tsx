"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, LoaderCircle, X } from "lucide-react";

export default function DogSaveNotice({ pending = false, message, success = false }: { pending?: boolean; message?: string; success?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setDismissed(false); }, [pending, message]);
  if (!mounted || dismissed || (!pending && !message)) return null;
  const Icon = pending ? LoaderCircle : success ? CheckCircle2 : AlertCircle;
  return createPortal(
    <div role={pending || success ? "status" : "alert"} aria-live="polite" className={`fixed bottom-5 left-4 right-4 z-[100] mx-auto flex max-w-lg items-start gap-3 rounded-lg border p-4 shadow-lg ${pending ? "border-blue-200 bg-blue-50 text-blue-900" : success ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
      <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${pending ? "animate-spin" : ""}`} />
      <p className="min-w-0 flex-1 break-words text-sm">{pending ? "Saving your dog profile..." : message}</p>
      {!pending ? <button type="button" title="Dismiss" aria-label="Dismiss save notification" onClick={() => setDismissed(true)} className="flex h-8 w-8 shrink-0 items-center justify-center"><X className="h-4 w-4" /></button> : null}
    </div>, document.body,
  );
}
