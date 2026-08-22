import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Bone, PawPrint, ShieldCheck } from "lucide-react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import {
  AdminWorkspaceNav,
  type AdminWorkspaceNavItem,
} from "@/components/admin/AdminWorkspaceNav";

export default function PawjaiWorkspaceShell({
  active,
  actions,
  children,
  connectionLabel = "Connected to Supabase",
  description,
  eyebrow,
  homeHref,
  maxWidth = "max-w-6xl",
  title,
}: {
  active?: AdminWorkspaceNavItem;
  actions?: ReactNode;
  children: ReactNode;
  connectionLabel?: string;
  description?: ReactNode;
  eyebrow?: string;
  homeHref?: string;
  maxWidth?: "max-w-5xl" | "max-w-6xl" | "max-w-7xl";
  title?: string;
}) {
  const isAdminShell = Boolean(active);
  // Operational pages must fail closed into the shelter login lane. Admin-only
  // pages opt in through `active`, while every deep workflow should pass its
  // own explicit workspace return path.
  const resolvedHomeHref = isAdminShell ? "/admin" : homeHref ?? "/shelter";
  const resolvedEyebrow = isAdminShell ? "PawJai Admin" : eyebrow ?? "PawJai";
  const resolvedTitle = isAdminShell ? "PawJai management workspace" : title ?? "Workspace";
  const resolvedDescription = isAdminShell
    ? "Manage PawJai HQ, partner shelters, dogs, bookings, donations, ads, content, and platform activity from one workspace."
    : description;
  const isShelterShell = resolvedHomeHref.startsWith("/shelter/");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f1e8] px-4 py-8 text-[#65584f]">
      <Bone
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-20 hidden h-36 w-36 rotate-12 text-[#d6c8ad]/35 lg:block"
        strokeWidth={1.3}
      />
      <PawPrint
        aria-hidden="true"
        className="pointer-events-none absolute left-7 top-52 hidden h-24 w-24 -rotate-12 text-[#cd8188]/15 lg:block"
        strokeWidth={1.4}
      />

      <div className={`relative mx-auto ${isAdminShell ? "max-w-7xl" : maxWidth}`}>
        <header className="mb-6 overflow-hidden rounded-[32px] border border-[#d6c8ad] bg-white/90 p-5 shadow-[0_18px_54px_rgba(101,88,79,0.10)] backdrop-blur md:p-6">
          <div className={`flex flex-col gap-5 lg:flex-row lg:justify-between ${isAdminShell ? "lg:items-start" : "lg:items-center"}`}>
          <div className={`flex min-w-0 flex-col gap-4 sm:flex-row ${isAdminShell ? "sm:items-start" : "sm:items-center"}`}>
            <Link
              aria-label="Back to workspace"
              className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-[#f5f1e8] shadow-[inset_0_0_0_1px_rgba(214,200,173,0.8)] ${isAdminShell ? "h-20 w-20 rounded-[24px]" : "h-16 w-16 rounded-[20px]"}`}
              href={resolvedHomeHref}
            >
              <Image
                alt="PawJai"
                className={`object-contain ${isAdminShell ? "p-2" : "p-1.5"}`}
                fill
                priority
                sizes={isAdminShell ? "80px" : "64px"}
                src="/pawjai-logo-square.png"
              />
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">
                {resolvedEyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-[#65584f] md:text-4xl">
                {resolvedTitle}
              </h1>
              {resolvedDescription ? (
                <div className="mt-2 max-w-3xl text-sm leading-6 text-[#65584f]/75">
                  {resolvedDescription}
                </div>
              ) : null}
              {isAdminShell ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eaf6df] px-4 py-2 text-xs font-semibold text-[#3f6f24]">
                  <PawPrint className="h-4 w-4" />
                  {connectionLabel}
                </div>
              ) : null}
            </div>
          </div>
          {isAdminShell ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-[#cd8188] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(205,129,136,0.22)]"
                href="/admin"
              >
                View as PawJai
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-5 py-2.5 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
                href="/admin?role=shelter"
              >
                View as shelter
              </Link>
            </div>
          ) : actions || isShelterShell ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {isShelterShell ? <LanguageSwitcher /> : null}
              {actions}
            </div>
          ) : null}
          </div>
        </header>

        {active ? (
          <nav className="mb-6 flex flex-wrap gap-3 rounded-[28px] border border-[#d6c8ad] bg-white/90 p-4 shadow-[0_14px_42px_rgba(101,88,79,0.08)] backdrop-blur">
            <AdminWorkspaceNav active={active} basePath="/admin" />
            <div className="ml-auto flex items-center gap-2 rounded-full bg-[#d6c8ad] px-4 py-2 text-xs font-semibold text-[#65584f]">
              <ShieldCheck className="h-4 w-4" />
              PawJai HQ only
            </div>
          </nav>
        ) : null}

        {children}

        {active ? (
          <footer className="mt-6 rounded-[24px] border border-[#d6c8ad] bg-white p-4 text-sm leading-6 text-[#65584f]">
            This workspace is limited to the PawJai Google admin session. Deep workflow links keep PawJai admin and shelter portal users in their own lanes.
          </footer>
        ) : null}
      </div>
    </main>
  );
}
