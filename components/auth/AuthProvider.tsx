"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { trackGA, analyticsPath } from "@/utils/google-analytics";
import AuthForm from "@/components/auth/AuthForm";
import { createClient } from "@/utils/supabase/client";
import { sanitizeNextPath } from "@/utils/account-model";

type OpenAuthModalOptions = {
  nextPath?: string | null;
  reason?: string | null;
};

type AuthModalState = {
  isOpen: boolean;
  nextPath: string;
  reason: string | null;
};

type AuthContextValue = {
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
  const [modal, setModal] = useState<AuthModalState>({
    isOpen: false,
    nextPath: "/swipe",
    reason: null,
  });

  const closeAuthModal = useCallback(() => {
    setModal((current) => ({ ...current, isOpen: false }));
  }, []);

  const openAuthModal = useCallback(
    (options?: OpenAuthModalOptions) => {
      const currentPath =
        typeof window === "undefined"
          ? "/"
          : `${window.location.pathname}${window.location.search}${window.location.hash}`;
      trackGA("auth_prompt", { destination: analyticsPath(options?.nextPath ?? currentPath) ?? "other" });
      setModal({
        isOpen: true,
        nextPath: sanitizeNextPath(options?.nextPath ?? currentPath),
        reason: options?.reason ?? null,
      });
    },
    [],
  );

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        closeAuthModal();
      }
    });

    return () => subscription.unsubscribe();
  }, [closeAuthModal]);

  useEffect(() => {
    if (!modal.isOpen) return;
    const updateViewport = () => setViewport({ height: Math.max(100, (window.visualViewport?.height ?? window.innerHeight) - 70), top: window.visualViewport?.offsetTop ?? 0 });
    updateViewport();
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeAuthModal(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
    };
  }, [modal.isOpen, closeAuthModal]);

  const value = useMemo(() => ({ openAuthModal, closeAuthModal }), [openAuthModal, closeAuthModal]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modal.isOpen && (
        <div
          className="fixed inset-x-0 top-0 bottom-[70px] z-[40] flex items-center justify-center bg-black/45 px-[12px] py-[12px]"
          style={viewport ? { top: viewport.top, height: viewport.height, bottom: "auto" } : undefined}
          role="dialog"
          aria-label="Sign in"
        >
          <div className="w-full max-w-[370px] max-h-full overflow-y-auto overscroll-contain rounded-[24px]">
            <AuthForm
              message={modal.reason}
              nextPath={modal.nextPath}
              onClose={closeAuthModal}
            />
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthModal must be used inside AuthProvider.");
  }
  return context;
}
