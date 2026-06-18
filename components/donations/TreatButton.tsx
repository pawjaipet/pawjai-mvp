"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bone } from "lucide-react";
import { useAuthModal } from "@/components/auth/AuthProvider";
import { createDonationIntent } from "@/app/donations/actions";
import TreatModal, { type TreatSelection } from "./TreatModal";

const PINK = "#cd8188";
const BROWN = "#65584f";

type Variant = "floating" | "cta" | "swipe";

type TreatButtonProps = {
  variant: Variant;
  dogId: string;
  dogName: string;
  shelterId: string;
  shelterName: string;
  dogPhotoUrl: string | null;
  isLoggedIn: boolean;
  autoOpenCount?: number | null;
  size?: "sm" | "md";
};

export default function TreatButton({
  variant,
  dogId,
  dogName,
  shelterId,
  shelterName,
  dogPhotoUrl,
  isLoggedIn,
  autoOpenCount = null,
  size = "md",
}: TreatButtonProps) {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const [open, setOpen] = useState(autoOpenCount != null);
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleContinue({ treatCount, amountThb }: TreatSelection) {
    if (!isLoggedIn) {
      // Preserve treat count + dog context across the sign-in round trip.
      setOpen(false);
      openAuthModal({
        nextPath: `/dogs/${dogId}?treat=${treatCount}`,
        reason: `Sign in to send treats to ${dogName}.`,
      });
      return;
    }

    startTransition(async () => {
      let intentId: string | null = null;
      try {
        intentId = await createDonationIntent({ amountThb, dogId, shelterId, treatCount });
      } catch {
        // Fire-and-forget: tracking failure must not block the donor's journey.
      }
      const query = intentId ? `?intent=${intentId}` : "";
      router.push(`/dogs/${dogId}/donate${query}`);
    });
  }

  const trigger =
    variant === "cta" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-full py-[15px] flex items-center justify-center gap-[8px] font-bold text-[16px] transition-all active:scale-[0.98]"
        style={{ border: `2px solid ${PINK}`, color: BROWN, background: "transparent", fontFamily: "Montserrat, sans-serif" }}
      >
        🦴 Treat {dogName}
      </button>
    ) : (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`bg-[#cd8188] ${size === "sm" ? "w-[48px] h-[48px]" : "w-14 h-14"} rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform`}
        aria-label={`Treat ${dogName}`}
      >
        <Bone size={size === "sm" ? 22 : 24} stroke="white" strokeWidth={2} />
      </button>
    );

  return (
    <>
      {trigger}
      {mounted
        ? createPortal(
            <TreatModal
              open={open}
              onClose={() => setOpen(false)}
              dogName={dogName}
              shelterName={shelterName}
              dogPhotoUrl={dogPhotoUrl}
              initialCount={autoOpenCount ?? 1}
              pending={pending}
              onContinue={handleContinue}
            />,
            document.body,
          )
        : null}
    </>
  );
}
