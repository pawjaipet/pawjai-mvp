"use client";

import Image from "next/image";
import { signIn, signInWithGoogle, signUp } from "@/app/auth/actions";
import { sanitizeNextPath } from "@/utils/account-model";

type AuthFormProps = {
  message?: string | null;
  nextPath?: string | null;
  onClose?: () => void;
};

export default function AuthForm({ message, nextPath, onClose }: AuthFormProps) {
  const safeNextPath = sanitizeNextPath(nextPath);

  return (
    <div className="relative rounded-[24px] bg-white px-[28px] pb-[28px] pt-[26px] shadow-2xl">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-[14px] top-[14px] flex size-[34px] items-center justify-center rounded-full text-[#65584f] active:bg-[#d6c8ad]/40"
          aria-label="Close"
        >
          ×
        </button>
      )}

      <div className="mx-auto mb-[16px] h-[55px] w-[110px] relative">
        <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain" priority />
      </div>

      <div className="mb-[22px] text-center">
        <h1 className="text-[34px] font-extrabold leading-[1] text-[#65584f]">Sign in</h1>
        <p className="mt-[8px] text-[13px] text-[#65584f]/65">
          Create an account to save dogs, preferences, visits, and documents.
        </p>
      </div>

      {message && (
        <div className="mb-[16px] rounded-[12px] bg-[#d6c8ad]/30 px-4 py-3 text-center text-sm text-[#65584f]">
          {message}
        </div>
      )}

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={safeNextPath} />
        <button
          type="submit"
          className="mb-[12px] flex w-full items-center justify-center gap-[12px] rounded-[12px] border border-[rgba(101,88,79,0.12)] bg-white px-[16px] py-[14px] shadow-sm transition-all active:bg-[#f5f0eb]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="text-[15px] font-semibold text-[#65584f]">Continue with Google</span>
        </button>
      </form>

      <div className="mb-[16px] flex items-center gap-[12px]">
        <div className="h-px flex-1 bg-[#d6c8ad]" />
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#65584f]/45">or email</span>
        <div className="h-px flex-1 bg-[#d6c8ad]" />
      </div>

      <form className="space-y-0">
        <input type="hidden" name="next" value={safeNextPath} />

        <input
          name="fullName"
          type="text"
          placeholder="Full name"
          autoComplete="name"
          className="mb-[12px] w-full rounded-[12px] border-0 bg-[#d6c8ad] px-[16px] py-[14px] text-[15px] text-[#65584f] outline-none placeholder:text-[#65584f]/50"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          className="mb-[12px] w-full rounded-[12px] border-0 bg-[#d6c8ad] px-[16px] py-[14px] text-[15px] text-[#65584f] outline-none placeholder:text-[#65584f]/50"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          minLength={8}
          className="mb-[18px] w-full rounded-[12px] border-0 bg-[#d6c8ad] px-[16px] py-[14px] text-[15px] text-[#65584f] outline-none placeholder:text-[#65584f]/50"
        />

        <div className="flex gap-[12px]">
          <button
            formAction={signIn}
            className="flex-1 rounded-[16px] border-2 border-[#65584f] bg-white py-[13px] text-[16px] font-bold text-[#65584f] transition-all active:bg-[#d6c8ad]"
          >
            Log in
          </button>
          <button
            formAction={signUp}
            className="flex-1 rounded-[16px] border-0 bg-[#cd8188] py-[13px] text-[16px] font-bold text-white transition-all active:bg-[#65584f]"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
}
