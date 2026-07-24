import "server-only";

import { headers } from "next/headers";

const SHARED_COOKIE_DOMAINS = ["pawjaipet.com", "pawjai.co.th"];

export async function getAdminCookieDomains() {
  const headerStore = await headers();
  const host = (headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "")
    .split(",")[0]
    .split(":")[0]
    .trim()
    .toLowerCase();
  const sharedDomain = SHARED_COOKIE_DOMAINS.find((domain) => host === domain || host.endsWith(`.${domain}`));

  return sharedDomain ? [undefined, `.${sharedDomain}`] : [undefined];
}
