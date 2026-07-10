import Link from "next/link";
import type { ReactNode } from "react";

type AdminWorkspaceBasePath = "/admin" | "/admindraft";
type AdminWorkspaceNavItem = "home" | "dogs" | "bookings" | "ads" | "about" | "accounts" | "audit";

const labels: Record<AdminWorkspaceNavItem, string> = {
  accounts: "Accounts",
  ads: "Ads",
  audit: "Audit",
  about: "About content",
  bookings: "Bookings",
  dogs: "Manage listings",
  home: "Create dog",
};

function navLabel(basePath: AdminWorkspaceBasePath, item: AdminWorkspaceNavItem) {
  if (basePath === "/admindraft") {
    if (item === "home") return "Admin draft";
    if (item === "dogs") return "All dog listings";
  }

  return labels[item];
}

function navHref(basePath: AdminWorkspaceBasePath, item: AdminWorkspaceNavItem) {
  if (basePath === "/admindraft") {
    switch (item) {
      case "home":
        return "/admindraft";
      case "dogs":
        return "/admindraft?view=dogs";
      case "bookings":
        return "/admindraft?view=bookings";
      case "ads":
        return "/admindraft?view=ads";
      case "about":
        return "/admindraft/aboutcontent";
      case "accounts":
        return "/admindraft/accounts";
      case "audit":
        return "/admindraft/audit";
    }
  }

  switch (item) {
    case "home":
      return "/admin";
    case "dogs":
      return "/admin/listings";
    case "bookings":
      return "/admin/bookings";
    case "ads":
      return "/admin/ads";
    case "about":
      return "/admin/pawjaiprofile";
    case "accounts":
      return "/admin/accounts";
    case "audit":
      return "/admin/audit";
  }
}

function navClass(active: boolean) {
  return `inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition ${
    active
      ? "bg-[#d38a2c] text-white shadow-[0_10px_24px_rgba(179,111,31,0.22)]"
      : "border border-[#eadfce] bg-white text-[#5b4d40] hover:bg-[#faf4ec]"
  }`;
}

export function AdminWorkspaceNav({
  active,
  basePath,
  children,
  includePrimary = true,
  showAds = true,
  showGlobalOnly = true,
}: {
  active: AdminWorkspaceNavItem;
  basePath: AdminWorkspaceBasePath;
  children?: ReactNode;
  includePrimary?: boolean;
  showAds?: boolean;
  showGlobalOnly?: boolean;
}) {
  const items: AdminWorkspaceNavItem[] = [
    ...(includePrimary ? (["home", "dogs", "bookings"] as AdminWorkspaceNavItem[]) : []),
    ...(showAds ? (["ads"] as AdminWorkspaceNavItem[]) : []),
    ...(showGlobalOnly ? (["about", "accounts"] as AdminWorkspaceNavItem[]) : []),
    "audit",
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <Link className={navClass(active === item)} href={navHref(basePath, item)} key={item}>
          {navLabel(basePath, item)}
        </Link>
      ))}
      {children}
    </div>
  );
}
