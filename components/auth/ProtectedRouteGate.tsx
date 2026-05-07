"use client";

import { useEffect } from "react";
import { useAuthModal } from "@/components/auth/AuthProvider";
import { sanitizeNextPath } from "@/utils/account-model";

type ProtectedRouteGateProps = {
  nextPath: string;
  reason: string;
};

export default function ProtectedRouteGate({ nextPath, reason }: ProtectedRouteGateProps) {
  const { openAuthModal } = useAuthModal();
  const safeNextPath = sanitizeNextPath(nextPath);

  useEffect(() => {
    openAuthModal({ nextPath: safeNextPath, reason });
  }, [openAuthModal, reason, safeNextPath]);

  return (
    <div
      className="flex min-h-[calc(100vh-70px)] items-center justify-center px-[28px] text-center"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto" }}
    >
      <div>
        <p className="text-[22px] font-bold text-[#65584f]">Sign in to continue</p>
        <p className="mt-[8px] text-[14px] text-[#65584f]/65">{reason}</p>
        <button
          type="button"
          onClick={() => openAuthModal({ nextPath: safeNextPath, reason })}
          className="mt-[22px] rounded-full bg-[#cd8188] px-[28px] py-[12px] text-[15px] font-semibold text-white"
        >
          Open sign in
        </button>
      </div>
    </div>
  );
}
