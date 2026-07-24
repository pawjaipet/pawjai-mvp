import "server-only";

import { headers } from "next/headers";

const SHARED_COOKIE_DOMAINS = ["pawjaipet.com", "pawjai.co.th"];

export function getAdminCookieDomainsForHost(hostValue: string | null | undefined) {
  const host = (hostValue ?? "")
    .split(",")[0]
    .split(":")[0]
    .trim()
    .toLowerCase();
  const sharedDomain = SHARED_COOKIE_DOMAINS.find((domain) => host === domain || host.endsWith(`.${domain}`));

  return sharedDomain ? [undefined, `.${sharedDomain}`] : [undefined];
}

export async function getAdminCookieDomains() {
  const headerStore = await headers();
  return getAdminCookieDomainsForHost(headerStore.get("x-forwarded-host") ?? headerStore.get("host"));
}
