"use client";

import { useAuthModal } from "@/components/auth/AuthProvider";

type AuthPromptButtonProps = {
  children: React.ReactNode;
  nextPath: string;
  reason: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function AuthPromptButton({
  children,
  nextPath,
  reason,
  className,
  style,
}: AuthPromptButtonProps) {
  const { openAuthModal } = useAuthModal();

  return (
    <button
      type="button"
      onClick={() => openAuthModal({ nextPath, reason })}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
