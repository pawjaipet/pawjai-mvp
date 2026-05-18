"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { ensureCurrentUserProfile } from "@/app/auth/actions";
import { parseAccountCredentials, sanitizeNextPath } from "@/utils/account-model";
import { createClient } from "@/utils/supabase/client";

type AuthFormProps = {
  message?: string | null;
  nextPath?: string | null;
  onClose?: () => void;
};

export default function AuthForm({ message, nextPath, onClose }: AuthFormProps) {
  const safeNextPath = sanitizeNextPath(nextPath);
  const [localMessage, setLocalMessage] = useState<string | null>(message ?? null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isPending, startTransition] = useTransition();
  const isSignup = mode === "signup";

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void submitEmailAuth(formData);
    });
  }

  function handleGoogleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void submitGoogleAuth(formData);
    });
  }

  async function submitEmailAuth(formData: FormData) {
    setLocalMessage(null);
    let credentials;

    try {
      credentials = parseAccountCredentials({
        email: formData.get("email"),
        password: formData.get("password"),
        confirmPassword: isSignup ? formData.get("confirmPassword") : null,
      });
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : "Please check your details.");
      return;
    }

    const supabase = createClient();

    if (isSignup) {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", safeNextPath);

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: { full_name: null },
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        setLocalMessage(error.message);
        return;
      }

      if (!data.session) {
        setLocalMessage("Check your email to verify your account, then come back to sign in.");
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        setLocalMessage(error.message);
        return;
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLocalMessage("Check your email to verify your account, then come back to sign in.");
      return;
    }

    const ensured = await ensureCurrentUserProfile();
    if (!ensured.ok) {
      setLocalMessage(ensured.error);
      return;
    }

    window.location.assign(safeNextPath);
  }

  async function submitGoogleAuth(formData: FormData) {
    setLocalMessage(null);
    const supabase = createClient();
    const next = sanitizeNextPath(String(formData.get("next") ?? ""));
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) setLocalMessage(error.message);
  }

  return (
    <div className="relative rounded-[24px] bg-white px-[30px] pb-[30px] pt-[28px] shadow-2xl">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-[10px] top-[10px] flex size-[52px] items-center justify-center rounded-full text-[36px] text-[#65584f] active:bg-[#d6c8ad]/40"
          aria-label="Close"
        >
          ×
        </button>
      )}

      <div className="mx-auto mb-[22px] h-[120px] w-[120px] relative">
        <Image src="/pawjai-logo.png" alt="PawJai" fill sizes="96px" className="object-contain" priority />
      </div>

      <div className="mb-[24px] text-center">
        <h1 className="text-[38px] font-extrabold leading-[1] text-[#65584f]">
          {isSignup ? "Create account" : "Sign in"}
        </h1>
        <p className="mx-auto mt-[10px] max-w-[270px] text-[14px] leading-[1.45] text-[#65584f]/60">
          {isSignup
            ? "Use your email now. Profile details can wait until documents."
            : "Save your dogs, preferences, visits, and documents."}
        </p>
      </div>

      {localMessage && (
        <div className="mb-[18px] rounded-[14px] bg-[#d6c8ad]/30 px-4 py-3 text-center text-[14px] leading-[1.35] text-[#65584f]">
          {localMessage}
        </div>
      )}

      {isSignup ? (
        <form onSubmit={handleEmailSubmit} className="space-y-[12px]">
          <input type="hidden" name="next" value={safeNextPath} />
          <input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            className="h-[58px] w-full rounded-[18px] border-0 bg-[#d6c8ad] px-[20px] text-[16px] text-[#65584f] outline-none placeholder:text-[#65584f]/45"
          />
          <input
            name="password"
            type="password"
            placeholder="Create password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-[58px] w-full rounded-[18px] border-0 bg-[#d6c8ad] px-[20px] text-[16px] text-[#65584f] outline-none placeholder:text-[#65584f]/45"
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-[58px] w-full rounded-[18px] border-0 bg-[#d6c8ad] px-[20px] text-[16px] text-[#65584f] outline-none placeholder:text-[#65584f]/45"
          />
          <div className="pt-[6px]">
            <button
              type="submit"
              disabled={isPending}
              className="h-[58px] w-full rounded-[20px] border-0 bg-[#cd8188] text-[18px] font-bold text-white transition-all active:bg-[#65584f]"
            >
              {isPending ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleEmailSubmit} className="space-y-[12px]">
          <input type="hidden" name="next" value={safeNextPath} />
          <input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            className="h-[58px] w-full rounded-[18px] border-0 bg-[#d6c8ad] px-[20px] text-[16px] text-[#65584f] outline-none placeholder:text-[#65584f]/45"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
            minLength={8}
            className="h-[58px] w-full rounded-[18px] border-0 bg-[#d6c8ad] px-[20px] text-[16px] text-[#65584f] outline-none placeholder:text-[#65584f]/45"
          />
          <div className="pt-[6px]">
            <button
              type="submit"
              disabled={isPending}
              className="h-[58px] w-full rounded-[20px] border-0 bg-[#cd8188] text-[18px] font-bold text-white transition-all active:bg-[#65584f]"
            >
              {isPending ? "Signing in..." : "Log in"}
            </button>
          </div>
        </form>
      )}

      <div className="my-[18px] flex items-center gap-[12px]">
        <div className="h-px flex-1 bg-[#d6c8ad]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#65584f]/38">or</span>
        <div className="h-px flex-1 bg-[#d6c8ad]" />
      </div>

      <form onSubmit={handleGoogleSubmit}>
        <input type="hidden" name="next" value={safeNextPath} />
        <button
          type="submit"
          className="flex h-[52px] w-full items-center justify-center gap-[12px] rounded-[18px] border border-[rgba(101,88,79,0.16)] bg-white text-[15px] font-bold text-[#65584f] shadow-sm transition-all active:bg-[#f5f0eb]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </form>

      <div className="pt-[10px] text-center">
        <button
          type="button"
          onClick={() => setMode(isSignup ? "login" : "signup")}
          className="rounded-full px-[14px] py-[8px] text-[14px] font-semibold text-[#65584f]/75 transition-all active:bg-[#d6c8ad]/35"
        >
          {isSignup ? "Already have an account? Log in" : "New here? Create account"}
        </button>
      </div>
    </div>
  );
}
