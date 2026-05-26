import { Resend } from "resend";

let resend: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === "re_xxxxxxxxx") {
    throw new Error("Missing RESEND_API_KEY. Add your real Resend API key to .env.local or your deployment environment.");
  }

  resend ??= new Resend(apiKey);
  return resend;
}
