import { NextResponse } from "next/server";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { getShelterPortalTarget } from "@/utils/shelter-portal";

export async function GET() {
  const context = await getAdminAuthContext({ includePhraseGate: false });

  if (!context) {
    return NextResponse.json(
      { lane: "public", target: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (context.role === "shelter_admin") {
    return NextResponse.json(
      {
        lane: "shelter",
        target: await getShelterPortalTarget(context) ?? "/shelter",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { lane: "admin", target: "/admindraft" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
