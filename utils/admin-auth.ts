import "server-only";

import { cookies } from "next/headers";

export const ADMIN_GATE_COOKIE = "pawjai_admin_gate";
const DEFAULT_ADMIN_PASSPHRASE = "pawjaiadmin";

function getAdminPassphrase() {
  return process.env.PAWJAI_ADMIN_PASSPHRASE ?? DEFAULT_ADMIN_PASSPHRASE;
}

export async function isAdminGateOpen() {
  const cookieStore = await cookies();
  const gate = cookieStore.get(ADMIN_GATE_COOKIE)?.value;

  return gate === getAdminPassphrase();
}

export async function openAdminGate() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_GATE_COOKIE, getAdminPassphrase(), {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function closeAdminGate() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_GATE_COOKIE);
}

export function validateAdminPassphrase(value: string) {
  return value.trim() === getAdminPassphrase();
}
