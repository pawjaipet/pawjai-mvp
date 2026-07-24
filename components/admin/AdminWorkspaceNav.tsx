import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, FileText, Megaphone, PawPrint, ShieldCheck, Users } from "lucide-react";

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
        return "/admindraft/ads";
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
  return `inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition active:scale-[0.98] ${
    active
      ? "bg-[#cd8188] text-white shadow-[0_10px_24px_rgba(205,129,136,0.22)]"
      : "border border-[#d6c8ad] bg-white text-[#65584f] hover:bg-[#f5f1e8]"
  }`;
}

const icons: Record<AdminWorkspaceNavItem, ReactNode> = {
  accounts: <Users className="mr-2 h-4 w-4" />,
  ads: <Megaphone className="mr-2 h-4 w-4" />,
  audit: <ShieldCheck className="mr-2 h-4 w-4" />,
  about: <FileText className="mr-2 h-4 w-4" />,
  bookings: <CalendarDays className="mr-2 h-4 w-4" />,
  dogs: <PawPrint className="mr-2 h-4 w-4" />,
  home: <PawPrint className="mr-2 h-4 w-4" />,
};

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
          {icons[item]}
          {navLabel(basePath, item)}
        </Link>
      ))}
      {children}
    </div>
  );
}
