import { NextResponse, type NextRequest } from "next/server";
import { buildAdminLoginPath, sanitizeAdminNextPath } from "@/utils/admin-auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = sanitizeAdminNextPath(String(formData.get("returnTo") ?? ""));
  return NextResponse.redirect(new URL(buildAdminLoginPath(returnTo), request.url));
}
