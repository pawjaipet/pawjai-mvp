"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { useAuthModal } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { trackGA } from "@/utils/google-analytics";

type Props = {
  dogId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
  surface: "swipe_feed" | "dog_detail";
};

export default function WishlistSaveButton({ dogId, initialSaved, isLoggedIn, surface }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const [wishlistLimit, setWishlistLimit] = useState<number | null>(null);
  const requestPending = useRef(false);
  const [, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTitleId = useId();
  const { openAuthModal } = useAuthModal();
  const { t } = useLanguage();

  useEffect(() => {
    if (!feedback || feedback.error) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (wishlistLimit !== null) dialogRef.current?.showModal();
  }, [wishlistLimit]);

  async function toggle() {
    if (!isLoggedIn) {
      openAuthModal({
        nextPath: `/dogs/${dogId}`,
        reason: t("Sign in or create an account to save dogs to your wishlist."),
      });
      return;
    }
    if (requestPending.current) return;
    requestPending.current = true;
    setPending(true);
    setFeedback(null);
    try {
      const result = await toggleWishlistAction(dogId, surface);
      if (result.error === "not_authenticated") {
        openAuthModal({
          nextPath: `/dogs/${dogId}`,
          reason: t("Sign in or create an account to save dogs to your wishlist."),
        });
      } else if (result.error === "wishlist_limit_reached") {
        setWishlistLimit(result.limit ?? 5);
        trackGA("save_failed", { reason: result.error });
      } else if (result.error) {
        setFeedback({ message: t("Could not update saved dogs. Please try again."), error: true });
        trackGA("save_failed", { reason: result.error });
      } else {
        setSaved(result.saved);
        setFeedback({
          message: t(result.saved ? "Saved to your wishlist." : "Removed from your wishlist."),
          error: false,
        });
        trackGA(result.saved ? "dog_saved" : "dog_unsaved", { dog_id: dogId });
      }
    } catch {
      setFeedback({ message: t("Could not update saved dogs. Please try again."), error: true });
      trackGA("save_failed", { reason: "save_failed" });
    } finally {
      requestPending.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => startTransition(toggle)}
        disabled={pending}
        aria-label={t(saved ? "Remove from wishlist" : "Save to wishlist")}
        aria-pressed={saved}
        className={`${surface === "dog_detail" ? "h-[48px] w-[48px]" : "h-14 w-14"} flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-60`}
        style={{ background: saved ? "#65584f" : "#cd8188" }}
      >
        <Bookmark size={surface === "dog_detail" ? 22 : 24} stroke="white" fill={saved ? "white" : "none"} strokeWidth={2.2} />
      </button>

      {feedback && typeof document !== "undefined" && createPortal(
        <div
          role={feedback.error ? "alert" : "status"}
          className="fixed bottom-[92px] left-4 right-4 z-[90] mx-auto max-w-[370px] rounded-[14px] bg-white px-4 py-3 text-center text-[13px] font-semibold text-[#65584f] shadow-[0_10px_32px_rgba(0,0,0,0.20)]"
        >
          {feedback.message}
          {feedback.error && <button type="button" disabled={pending} onClick={() => startTransition(toggle)} className="ml-2 underline underline-offset-4">{t("Try again")}</button>}
        </div>,
        document.body,
      )}

      {wishlistLimit !== null && typeof document !== "undefined" && createPortal(
        <dialog
          ref={dialogRef}
          onCancel={() => setWishlistLimit(null)}
          aria-labelledby={dialogTitleId}
          className="m-auto w-[calc(100%_-_36px)] max-w-[342px] rounded-[22px] bg-white p-0 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop:bg-black/35"
        >
          <div
            className="px-[22px] py-[22px] text-center"
          >
            <p id={dialogTitleId} className="text-[20px] font-extrabold text-[#65584f]">{t("Wishlist limit reached")}</p>
            <p className="mt-[10px] text-[14px] leading-[1.55] text-[#65584f]/70">
              {t("Your current plan can save up to")} <strong className="font-bold text-[#65584f]">{wishlistLimit}</strong> {t("dogs. Upgrade to keep more favorites close before they disappear or get adopted.")}
            </p>
            <div className="mt-[18px] flex flex-col gap-[10px]">
              <Link href="/settings/subscription" className="rounded-[14px] bg-[#cd8188] py-[12px] text-[14px] font-bold text-white active:scale-[0.99]">
                {t("View plans")}
              </Link>
              <button type="button" onClick={() => setWishlistLimit(null)} className="rounded-[14px] py-[10px] text-[13px] font-bold text-[#65584f]/68">
                {t("Maybe later")}
              </button>
            </div>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
