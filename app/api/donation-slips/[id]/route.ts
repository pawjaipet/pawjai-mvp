import { NextResponse, type NextRequest } from "next/server";
import { canAccessShelter } from "@/utils/admin-authorization";
import { buildAdminLoginPath, getAdminAuthContext } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";

const DEFAULT_DONATION_SLIPS_BUCKET = "donation-slips";
const SIGNED_SLIP_URL_SECONDS = 60 * 5;

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const adminReturnPath = "/admin?view=donations";
  const authContext = await getAdminAuthContext({ includePhraseGate: false });

  if (!authContext) {
    return NextResponse.redirect(new URL(buildAdminLoginPath(adminReturnPath), request.url));
  }

  const admin = createAdminClient();
  const { data: donation, error: donationError } = await admin
    .from("donation_intents")
    .select("id,shelter_id,proof_bucket_id,proof_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (donationError) {
    return new NextResponse("Donation slip could not be loaded.", { status: 500 });
  }

  if (!donation?.proof_storage_path) {
    return new NextResponse("Donation slip not found.", { status: 404 });
  }

  const allowed = canAccessShelter({
    role: authContext.role,
    shelterIds: authContext.shelterIds,
    targetShelterId: donation.shelter_id,
  });

  if (!allowed) {
    return new NextResponse("Donation slip not found.", { status: 404 });
  }

  const { data, error: signedUrlError } = await admin.storage
    .from(donation.proof_bucket_id || DEFAULT_DONATION_SLIPS_BUCKET)
    .createSignedUrl(donation.proof_storage_path, SIGNED_SLIP_URL_SECONDS);

  if (signedUrlError || !data?.signedUrl) {
    return new NextResponse("Donation slip could not be opened.", { status: 500 });
  }

  const response = NextResponse.redirect(data.signedUrl);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
