"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
          ? "/swipe"
          : `${window.location.pathname}${window.location.search}${window.location.hash}`;
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

  const value = useMemo(() => ({ openAuthModal, closeAuthModal }), [openAuthModal, closeAuthModal]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modal.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-[18px] py-[24px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[370px]">
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
