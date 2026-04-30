import Image from "next/image";
import { signIn, signUp } from "./actions";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div
      className="bg-white relative overflow-y-auto overflow-x-hidden min-h-screen"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", scrollbarWidth: "none" }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Top spacer */}
      <div className="h-[14px]" />

      {/* Sticky gradient header with logo */}
      <div
        className="sticky top-0 z-20 h-[94px] pointer-events-none w-full"
        style={{
          background:
            "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)",
        }}
      >
        <div className="pointer-events-auto absolute left-[8px] top-[39px]">
          <a href="/swipe" className="block h-[55px] w-[110px] relative">
            <Image
              src="/pawjai-logo.png"
              alt="PawJai"
              fill
              className="object-contain object-left"
              priority
            />
          </a>
        </div>
      </div>

      {/* Form container */}
      <div className="px-[36px] pt-[40px] pb-[60px]">
        {/* Title */}
        <div className="text-center mb-[8px]">
          <h1
            className="font-extrabold text-[48px] leading-[0.95] text-[#65584f]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Sign Up
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-[32px]">
          <p
            className="text-[14px] text-[#65584f]"
            style={{ fontFamily: "Montserrat, sans-serif", opacity: 0.6 }}
          >
            Create an account to start your adoption journey
          </p>
        </div>

        {message && (
          <div className="mb-[20px] rounded-[12px] bg-[#d6c8ad]/30 px-4 py-3 text-sm text-[#65584f] text-center">
            {message}
          </div>
        )}

        <form className="space-y-0">
          {/* Name field */}
          <div className="mb-[16px]">
            <div className="relative">
              <div className="absolute left-[16px] top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10ZM10 12.5C6.66667 12.5 0 14.175 0 17.5V20H20V17.5C20 14.175 13.3333 12.5 10 12.5Z"
                    fill="#65584f"
                    fillOpacity="0.5"
                  />
                </svg>
              </div>
              <input
                name="fullName"
                type="text"
                placeholder="Full name"
                autoComplete="name"
                className="w-full rounded-[12px] px-[52px] py-[16px] text-[16px] text-[#65584f] placeholder:text-[#65584f]/50 outline-none border-none"
                style={{ background: "#d6c8ad", fontFamily: "Montserrat, sans-serif" }}
              />
            </div>
          </div>

          {/* Email field */}
          <div className="mb-[16px]">
            <div className="relative">
              <div className="absolute left-[16px] top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
                    fill="#65584f"
                    fillOpacity="0.5"
                  />
                </svg>
              </div>
              <input
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
                className="w-full rounded-[12px] px-[52px] py-[16px] text-[16px] text-[#65584f] placeholder:text-[#65584f]/50 outline-none border-none"
                style={{ background: "#d6c8ad", fontFamily: "Montserrat, sans-serif" }}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="mb-[24px]">
            <div className="relative">
              <div className="absolute left-[16px] top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M15 6.66667H14.1667V5C14.1667 2.7 12.3 0.833333 10 0.833333C7.7 0.833333 5.83333 2.7 5.83333 5V6.66667H5C4.08333 6.66667 3.33333 7.41667 3.33333 8.33333V16.6667C3.33333 17.5833 4.08333 18.3333 5 18.3333H15C15.9167 18.3333 16.6667 17.5833 16.6667 16.6667V8.33333C16.6667 7.41667 15.9167 6.66667 15 6.66667ZM7.5 5C7.5 3.61667 8.61667 2.5 10 2.5C11.3833 2.5 12.5 3.61667 12.5 5V6.66667H7.5V5ZM15 16.6667H5V8.33333H15V16.6667ZM10 14.1667C10.9167 14.1667 11.6667 13.4167 11.6667 12.5C11.6667 11.5833 10.9167 10.8333 10 10.8333C9.08333 10.8333 8.33333 11.5833 8.33333 12.5C8.33333 13.4167 9.08333 14.1667 10 14.1667Z"
                    fill="#65584f"
                    fillOpacity="0.5"
                  />
                </svg>
              </div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
                minLength={8}
                className="w-full rounded-[12px] px-[52px] py-[16px] text-[16px] text-[#65584f] placeholder:text-[#65584f]/50 outline-none border-none"
                style={{ background: "#d6c8ad", fontFamily: "Montserrat, sans-serif" }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-[12px] mb-[28px]">
            <button
              formAction={signIn}
              className="flex-1 rounded-[16px] py-[14px] font-bold text-[18px] text-[#65584f] border-2 border-[#65584f] bg-white active:bg-[#d6c8ad] transition-all"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Sign In
            </button>
            <button
              formAction={signUp}
              className="flex-1 rounded-[16px] py-[14px] font-bold text-[18px] text-white border-0 active:bg-[#65584f] transition-all"
              style={{ background: "#cd8188", fontFamily: "Montserrat, sans-serif" }}
            >
              Sign Up
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="text-center mb-[20px]">
          <p
            className="text-[14px] text-[#65584f]"
            style={{ fontFamily: "Montserrat, sans-serif", opacity: 0.6 }}
          >
            Login with Others
          </p>
        </div>

        {/* Google button */}
        <button
          type="button"
          className="w-full bg-white rounded-[12px] px-[16px] py-[14px] mb-[12px] flex items-center justify-center gap-[12px] border border-[rgba(101,88,79,0.1)] shadow-sm active:bg-[#f5f0eb] transition-all"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span
            className="text-[16px] text-[#65584f]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Login with Google
          </span>
        </button>

        {/* Facebook button */}
        <button
          type="button"
          className="w-full bg-white rounded-[12px] px-[16px] py-[14px] flex items-center justify-center gap-[12px] border border-[rgba(101,88,79,0.1)] shadow-sm active:bg-[#f5f0eb] transition-all"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
          </svg>
          <span
            className="text-[16px] text-[#65584f]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Login with Facebook
          </span>
        </button>
      </div>
    </div>
  );
}
