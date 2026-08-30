import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getShelterDonationDetails } from "@/app/donations/actions";
import DonateScreen from "@/components/donations/DonateScreen";
import { normalizeDogMediaUrl } from "@/utils/dog-media";

export default async function DonatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ amount?: string; intent?: string; treat?: string }>;
}) {
  const { id } = await params;
  const { amount: amountParam, intent: intentParam, treat: treatParam } = await searchParams;
  const intentId = String(intentParam ?? "").trim() || null;
  const queryTreatCount = Number(treatParam);
  const queryAmountThb = Number(amountParam);
  const fallbackTreatCount = Number.isInteger(queryTreatCount) && queryTreatCount > 0
    ? queryTreatCount
    : null;
  const fallbackAmountThb = Number.isFinite(queryAmountThb) && queryAmountThb > 0
    ? queryAmountThb
    : null;

  const supabase = await createClient();

  const { data: dog } = await supabase
    .from("dogs")
    .select("id, name, shelter_id, cover_photo_id")
    .eq("id", id)
    .single();
  if (!dog) notFound();

  // Cover photo (matches dog detail ordering: cover first, then sort_order)
  const { data: photos } = await supabase
    .from("dog_photos")
    .select("id, public_url, sort_order, storage_path")
    .eq("dog_id", id)
    .order("sort_order");
  const orderedPhotos = [...(photos ?? [])].sort((a, b) => {
    const aCover = a.id === dog.cover_photo_id ? -1 : 0;
    const bCover = b.id === dog.cover_photo_id ? -1 : 0;
    if (aCover !== bCover) return aCover - bCover;
    return a.sort_order - b.sort_order;
  });
  const dogPhotoUrl = normalizeDogMediaUrl(orderedPhotos[0]?.public_url, orderedPhotos[0]?.storage_path);

  // Read the donation intent (RLS-scoped to the signed-in owner) for the
  // authoritative treat count + amount. Falls back to the dog's shelter.
  let intent: {
    id: string;
    shelter_id: string;
    treat_count: number;
    amount_thb: number;
    proof_original_file_name: string | null;
    proof_submitted_at: string | null;
    status: string;
  } | null = null;
  if (intentId) {
    const { data } = await supabase
      .from("donation_intents")
      .select("id, shelter_id, treat_count, amount_thb, status, proof_original_file_name, proof_submitted_at")
      .eq("id", intentId)
      .maybeSingle();
    intent = data ?? null;
  }

  const shelterId = intent?.shelter_id ?? dog.shelter_id;

  const { data: shelter } = await supabase
    .from("shelters")
    .select("name")
    .eq("id", shelterId)
    .maybeSingle();

  const donation = await getShelterDonationDetails(shelterId);

  return (
    <DonateScreen
      dogId={dog.id}
      dogName={dog.name}
      dogPhotoUrl={dogPhotoUrl}
      shelterName={shelter?.name ?? "this shelter"}
      intentId={intent?.id ?? null}
      treatCount={intent?.treat_count ?? fallbackTreatCount}
      amountThb={intent?.amount_thb ?? fallbackAmountThb}
      intentStatus={intent?.status ?? null}
      proofOriginalFileName={intent?.proof_original_file_name ?? null}
      proofSubmittedAt={intent?.proof_submitted_at ?? null}
      promptpayId={donation?.promptpay_id ?? null}
      bankName={donation?.bank_name ?? null}
      bankAccountNumber={donation?.bank_account_number ?? null}
      bankAccountName={donation?.bank_account_name ?? null}
    />
  );
}
