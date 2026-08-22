"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { completeAdminGoogleLogin } from "@/app/admin/login/actions";
import { createClient } from "@/utils/supabase/client";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  id: {
    cancel: () => void;
    initialize: (config: {
      callback: (response: GoogleCredentialResponse) => void;
      client_id: string;
      nonce?: string;
      use_fedcm_for_prompt?: boolean;
    }) => void;
    renderButton: (
      parent: HTMLElement,
      options: {
        logo_alignment?: "left" | "center";
        shape?: "pill" | "rectangular" | "circle" | "square";
        size?: "large" | "medium" | "small";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        theme?: "outline" | "filled_blue" | "filled_black";
        type?: "standard" | "icon";
        width?: string | number;
      },
    ) => void;
    prompt: (momentListener?: (notification: {
      getNotDisplayedReason?: () => string;
      getSkippedReason?: () => string;
      isDismissedMoment?: () => boolean;
      isNotDisplayed?: () => boolean;
      isSkippedMoment?: () => boolean;
    }) => void) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

async function generateGoogleNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...bytes));
  const encodedNonce = new TextEncoder().encode(nonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return { hashedNonce, nonce };
}

export default function AdminGoogleLogin({
  message,
  nextPath,
}: {
  message?: string | null;
  nextPath: string;
}) {
  const [localMessage, setLocalMessage] = useState<string | null>(message ?? null);
  const [googleReady, setGoogleReady] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [pending, setPending] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const nonceRef = useRef<string | null>(null);

  const handleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    setLocalMessage(null);

    if (!response.credential || !nonceRef.current) {
      setLocalMessage("Google sign-in could not finish. Please try again.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: response.credential,
      nonce: nonceRef.current,
    });

    if (error) {
      setPending(false);
      setLocalMessage(error.message || "Google sign-in could not finish. Please try again.");
      return;
    }

    const result = await completeAdminGoogleLogin(nextPath);
    if (!result.ok) {
      setPending(false);
      setLocalMessage(result.error ?? "This Google account cannot access PawJai admin.");
      return;
    }

    window.location.assign(result.redirectTo ?? "/admindraft");
  }, [nextPath]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !scriptReady || !buttonRef.current) return;

    let cancelled = false;
    const googleClientId = GOOGLE_CLIENT_ID;

    async function initializeButton() {
      const google = window.google;
      if (!google || !buttonRef.current) return;

      const { hashedNonce, nonce } = await generateGoogleNonce();
      if (cancelled) return;

      nonceRef.current = nonce;
      buttonRef.current.innerHTML = "";
      google.accounts.id.initialize({
        callback: handleCredential,
        client_id: googleClientId,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
      });
      google.accounts.id.renderButton(buttonRef.current, {
        logo_alignment: "left",
        shape: "pill",
        size: "large",
        text: "continue_with",
        theme: "outline",
        type: "standard",
        width: buttonRef.current.clientWidth || 320,
      });
      setGoogleReady(true);
    }

    void initializeButton();

    return () => {
      cancelled = true;
      setGoogleReady(false);
      window.google?.accounts.id.cancel();
    };
  }, [handleCredential, scriptReady]);

  function promptGoogleLogin() {
    setLocalMessage(null);

    if (!GOOGLE_CLIENT_ID) {
      setLocalMessage("Google admin login is missing the Google client ID.");
      return;
    }

    if (!googleReady || !window.google) {
      setLocalMessage("Google sign-in is still loading. Please try again in a moment.");
      return;
    }

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed?.()) {
        const reason = notification.getNotDisplayedReason?.();
        setLocalMessage(
          reason
            ? `Google sign-in could not open (${reason}). Try the Google button below.`
            : "Google sign-in could not open. Try the Google button below.",
        );
      } else if (notification.isSkippedMoment?.()) {
        const reason = notification.getSkippedReason?.();
        setLocalMessage(
          reason
            ? `Google sign-in was skipped (${reason}). Try the Google button below.`
            : "Google sign-in was skipped. Try the Google button below.",
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-16 text-[#65584f]">
      {GOOGLE_CLIENT_ID ? (
        <Script
          async
          defer
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      ) : null}

      <section className="mx-auto max-w-3xl rounded-[36px] bg-[#f3cbd0] p-5 shadow-[0_24px_80px_rgba(101,88,79,0.12)] sm:p-10">
        <div className="rounded-[28px] bg-white/95 px-6 py-10 shadow-[inset_0_0_0_1px_rgba(214,200,173,0.75)] sm:px-12">
          <div className="relative h-20 w-20 overflow-hidden rounded-[24px] bg-[#f5f1e8] shadow-[inset_0_0_0_1px_rgba(214,200,173,0.8)]">
            <Image
              alt="PawJai"
              className="object-contain p-2"
              fill
              priority
              sizes="80px"
              src="/pawjai-logo-square.png"
            />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-[#cd8188]">
            PawJai Admin
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Sign in with the PawJai Google account.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#65584f]">
            Admin access is limited to pawjaipet@gmail.com. Shelter teams should continue using the{" "}
            <Link
              className="font-semibold text-[#1d6fd4] underline underline-offset-4 hover:text-[#1557a8]"
              href="/shelter"
            >
              Shelter Portal
            </Link>
            .
          </p>

          <div className="mt-10 max-w-md">
            {localMessage ? (
              <p className="mb-5 rounded-2xl border border-[#f0c9c1] bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#9a3f2f]">
                {localMessage}
              </p>
            ) : null}

            {GOOGLE_CLIENT_ID ? (
              <div className="space-y-4">
                <button
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#cd8188] px-6 py-4 text-base font-semibold text-white shadow-[0_14px_26px_rgba(205,129,136,0.22)] transition hover:bg-[#b87179] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={pending || !scriptReady}
                  onClick={promptGoogleLogin}
                  type="button"
                >
                  {scriptReady ? "Log in with Google" : "Loading Google sign-in..."}
                </button>
                <div className="min-h-[48px]">
                  <div className="w-full [&>div]:mx-0" ref={buttonRef} />
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-[#f0c9c1] bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#9a3f2f]">
                Google admin login is missing the Google client ID.
              </p>
            )}

            {pending ? (
              <p className="mt-4 text-sm font-semibold text-[#65584f]/70">
                Checking admin access...
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
