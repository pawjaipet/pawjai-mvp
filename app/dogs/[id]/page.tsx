import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, ShieldCheck, Bookmark } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { canBookAppointment, getAdopterVerificationSnapshot } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import AuthPromptButton from "@/components/auth/AuthPromptButton";
import DogPhotoGallery from "@/components/dogs/DogPhotoGallery";
import TreatButton from "@/components/donations/TreatButton";
import MachineTranslatedText from "@/components/i18n/MachineTranslatedText";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import type { DogPhoto, DogTrait } from "@/types/database";
import { canonicalizeBreedLabel } from "@/utils/dog-breeds";
import { buildDogMediaItems, normalizeDogMediaUrl } from "@/utils/dog-media";
import { NOINDEX_ROBOTS, canonicalUrl } from "@/utils/seo";
import { toggleWishlist } from "./actions";

const M = "Montserrat, sans-serif";
const BG = "#F5F1E8";

function ageLabel(months: number | null): string {
  if (months === null) return "Unknown";
  if (months < 12) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} yr ${m} mo` : `${y} Year${y > 1 ? "s" : ""} Old`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[16px] px-[16px] py-[14px]"
      style={{ background: "#e6dcc4" }}
    >
      <p
        className="text-[11px] uppercase tracking-[0.12em] text-[#65584f]/55 font-semibold"
        style={{ fontFamily: M }}
      >
        <MachineTranslatedText text={label} />
      </p>
      <p
        className="mt-[4px] text-[18px] font-bold text-[#65584f] capitalize"
        style={{ fontFamily: M }}
      >
        <MachineTranslatedText text={value} />
      </p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const canonicalPath = `/dogs/${id}`;

  try {
    const supabase = await createClient();
    const { data: dog } = await supabase
      .from("dogs")
      .select("name, breed, background, adoption_status")
      .eq("id", id)
      .maybeSingle();

    if (!dog) {
      return {
        title: "Dog profile",
        alternates: { canonical: canonicalPath },
        robots: NOINDEX_ROBOTS,
      };
    }

    const isAvailable = dog.adoption_status === "available";
    const breedLabel = canonicalizeBreedLabel(dog.breed);
    const title = isAvailable ? `Adopt ${dog.name}` : `${dog.name} profile`;
    const description =
      dog.background?.trim().slice(0, 155) ||
      `${dog.name}${breedLabel ? `, a ${breedLabel}` : ""}, is listed on PawJai.`;

    return {
      title,
      description,
      alternates: { canonical: canonicalPath },
      robots: isAvailable ? { index: true, follow: true } : NOINDEX_ROBOTS,
      openGraph: {
        title,
        description,
        url: canonicalUrl(canonicalPath),
        type: "article",
      },
    };
  } catch {
    return {
      title: "Dog profile",
      alternates: { canonical: canonicalPath },
    };
  }
}

export default async function DogProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ treat?: string }>;
}) {
  const { id } = await params;
  const { treat: treatParam } = await searchParams;
  const autoOpenTreatCount = (() => {
    const n = Number(treatParam);
    return Number.isInteger(n) && n > 0 ? n : null;
  })();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: dog } = await supabase.from("dogs").select("*").eq("id", id).single();
  if (!dog) notFound();
  const breedLabel = canonicalizeBreedLabel(dog.breed);

  const [{ data: photosData }, { data: traitsData }, { data: shelter }] = await Promise.all([
    supabase.from("dog_photos").select("*").eq("dog_id", id).order("sort_order"),
    supabase.from("dog_traits").select("*").eq("dog_id", id).order("created_at"),
    supabase
      .from("shelters")
      .select("name, hygiene_rating, professionalism_rating, province, district, phone_number, facebook_url")
      .eq("id", dog.shelter_id)
      .single(),
  ]);

  const photos: DogPhoto[] = photosData ?? [];
  const traits: DogTrait[] = traitsData ?? [];
  const coverVideoUrl = traits.find((t) => t.trait_type === "cover_video_url")?.trait_value ?? null;
  const coverVideoPosterUrl = traits.find((t) => t.trait_type === "cover_video_poster_url")?.trait_value ?? null;
  const mediaItems = buildDogMediaItems({ photos, traits });

  // Order: cover photo first, then by sort_order
  const orderedPhotos = [...photos].sort((a, b) => {
    const aCover = a.id === dog.cover_photo_id ? -1 : 0;
    const bCover = b.id === dog.cover_photo_id ? -1 : 0;
    if (aCover !== bCover) return aCover - bCover;
    return a.sort_order - b.sort_order;
  });
  const primaryDogPhotoUrl = normalizeDogMediaUrl(orderedPhotos[0]?.public_url, orderedPhotos[0]?.storage_path);

  const personalityTraits = traits
    .filter((t) => t.trait_type === "personality")
    .map((t) => t.trait_value);

  // Fallback tags derived from structured dog attributes so every profile
  // shows pills, even when an admin hasn't filled out personality_tag yet.
  function deriveFallbackTags(currentDog: NonNullable<typeof dog>): string[] {
    const tags: string[] = [];
    if (currentDog.energy_level === "low") tags.push("Calm");
    if (currentDog.energy_level === "medium") tags.push("Easy-going");
    if (currentDog.energy_level === "high") tags.push("Energetic");
    if (currentDog.house_trained) tags.push("House-trained");
    if (currentDog.leash_trained) tags.push("Leash-trained");
    if (currentDog.good_with_kids) tags.push("Good with kids");
    if (currentDog.good_with_dogs) tags.push("Dog-friendly");
    if (currentDog.good_with_cats) tags.push("Cat-friendly");
    if (currentDog.human_friendly) tags.push("People-friendly");
    if (currentDog.sterilized) tags.push("Sterilized");
    // Always at least one tag so the row never collapses
    if (tags.length === 0) tags.push("Looking for a home");
    return tags.slice(0, 5);
  }

  const displayTags = personalityTraits.length > 0 ? personalityTraits : deriveFallbackTags(dog);

  let canRequestAppointment = false;
  let saved = false;

  if (user) {
    const verification = await getAdopterVerificationSnapshot(supabase, user);
    canRequestAppointment = canBookAppointment(verification);
    const adopter = verification.adopter;
    const admin = createAdminClient();
    const { data: wishlist } = await admin
      .from("wishlists")
      .select("dog_id")
      .eq("adopter_id", adopter.id)
      .eq("dog_id", id)
      .maybeSingle();
    saved = Boolean(wishlist);
  }

  const genderLabel = dog.gender === "unknown" ? "Unknown" : dog.gender === "male" ? "Male" : "Female";
  const sizeLabel = dog.size ? dog.size.replace("_", " ") : "Unknown";

  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden"
      style={{
        width: "402px",
        maxWidth: "100vw",
        margin: "0 auto",
        minHeight: "100dvh",
        paddingBottom: "90px",
        scrollbarWidth: "none",
        background: BG,
        fontFamily: M,
      }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Hero photo carousel */}
      <div className="relative">
        <DogPhotoGallery
          photos={orderedPhotos.map((p) => ({ id: p.id, public_url: p.public_url }))}
          dogName={dog.name}
          media={mediaItems}
          videoUrl={coverVideoUrl}
          videoPosterUrl={coverVideoPosterUrl}
        />

        {/* Back to home — floating top-left, matches save button style */}
        <Link
          href="/"
          className="absolute left-[14px] top-[14px] w-[48px] h-[48px] rounded-full flex items-center justify-center shadow-lg z-10 active:scale-95 transition-all"
          style={{ background: "#cd8188" }}
          aria-label="Back to home"
        >
          <ArrowLeft size={22} stroke="white" strokeWidth={2.2} />
        </Link>

        {/* Treat button — floating bottom-right of the hero image */}
        <div className="absolute right-[14px] bottom-[14px] z-20">
          <TreatButton
            variant="floating"
            size="sm"
            dogId={dog.id}
            dogName={dog.name}
            shelterId={dog.shelter_id}
            shelterName={shelter?.name ?? "their shelter"}
            dogPhotoUrl={primaryDogPhotoUrl}
            isLoggedIn={Boolean(user)}
          />
        </div>

        {/* Wishlist save (bookmark) — floating top-right, matches swipe card */}
        {user && (
          <form action={toggleWishlist} className="absolute right-[14px] top-[14px] z-10">
            <input type="hidden" name="dogId" value={dog.id} />
            <input type="hidden" name="isSaved" value={String(saved)} />
            <button
              type="submit"
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
              style={{ background: "#cd8188" }}
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Bookmark
                size={22}
                stroke="white"
                fill={saved ? "white" : "none"}
                strokeWidth={2.2}
              />
            </button>
          </form>
        )}
        <div className={`absolute right-[14px] ${user ? "top-[74px]" : "top-[14px]"} z-10`}>
          <LanguageSwitcher compact />
        </div>
      </div>

      {/* Main content */}
      <div className="px-[20px] pt-[20px]">
        {/* Name + breed */}
        <h1
          data-i18n-ignore
          className="text-[32px] font-bold leading-tight text-[#65584f]"
          style={{ fontFamily: M }}
        >
          {dog.name}
        </h1>
        {breedLabel && (
          <p
            className="text-[16px] text-[#65584f]/55 mt-[2px]"
            style={{ fontFamily: M }}
          >
            <MachineTranslatedText text={breedLabel} />
          </p>
        )}

        {/* 2x2 stats grid */}
        <div className="grid grid-cols-2 gap-[10px] mt-[18px]">
          <StatCard label="Age" value={ageLabel(dog.age_months)} />
          <StatCard label="Gender" value={genderLabel} />
          <StatCard label="Size" value={sizeLabel} />
          <StatCard label="Weight" value={dog.weight_kg ? `${dog.weight_kg} Kg` : "Unknown"} />
        </div>

        {/* About */}
        {dog.background && (
          <div className="mt-[24px]">
            <h2
              className="text-[20px] font-bold text-[#65584f] mb-[10px]"
              style={{ fontFamily: M }}
            >
              <MachineTranslatedText text="About" /> <span data-i18n-ignore>{dog.name}</span>
            </h2>
            <MachineTranslatedText
              as="p"
              text={dog.background}
              className="text-[14px] text-[#65584f]/75 leading-relaxed whitespace-pre-wrap"
              style={{ fontFamily: M }}
            />
          </div>
        )}

        {/* Personality pills — always shown (falls back to derived tags) */}
        <div className="mt-[16px] flex flex-wrap gap-[8px]">
          {displayTags.map((trait) => (
            <span
              key={trait}
              className="rounded-full px-[18px] py-[8px] text-[13px] font-semibold text-white"
              style={{ background: "#65584f", fontFamily: M }}
            >
              <MachineTranslatedText text={trait} />
            </span>
          ))}
        </div>

        {/* Special needs callout — always show, says None if empty */}
        <div
          className="mt-[20px] rounded-[16px] px-[18px] py-[14px]"
          style={{ background: "rgba(205,129,136,0.12)" }}
        >
          <p
            className="text-[13px] font-semibold text-[#cd8188]"
            style={{ fontFamily: M }}
          >
            <MachineTranslatedText text="Special needs" />
          </p>
          <p
            className="text-[15px] text-[#65584f] mt-[4px]"
            style={{ fontFamily: M }}
          >
            <MachineTranslatedText text={dog.special_needs?.trim() || "None"} />
          </p>
        </div>

        {/* Shelter card */}
        {shelter && (
          <div
            className="mt-[20px] rounded-[20px] p-[16px] flex items-center gap-[14px]"
            style={{ background: "white", boxShadow: "0 2px 12px rgba(101,88,79,0.08)" }}
          >
            {/* Logo placeholder */}
            <div
              className="shrink-0 w-[64px] h-[64px] rounded-[14px] flex items-center justify-center"
              style={{ background: "#F5F1E8", border: "1.5px solid #d6c8ad" }}
            >
              <span className="text-[26px]">🏠</span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[12px] uppercase tracking-[0.14em] text-[#65584f]/55 font-semibold"
                style={{ fontFamily: M }}
              >
                <MachineTranslatedText text="Shelter" />
              </p>
              <p
                data-i18n-ignore
                className="text-[16px] font-bold text-[#65584f] truncate"
                style={{ fontFamily: M }}
              >
                {shelter.name}
              </p>
              <div className="flex items-center gap-[5px] mt-[4px]">
                <ShieldCheck size={14} stroke="#cd8188" strokeWidth={2.4} />
                <span
                  className="text-[12px] font-semibold text-[#cd8188]"
                  style={{ fontFamily: M }}
                >
                  <MachineTranslatedText text="Verified Shelter" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Appointment CTA */}
        <div className="mt-[24px]">
          {user ? (
            canRequestAppointment ? (
              <Link
                href={`/schedule?dog=${encodeURIComponent(dog.name)}&shelter=${encodeURIComponent(shelter?.name ?? "")}&dogId=${dog.id}&shelterId=${dog.shelter_id}`}
                className="w-full rounded-full py-[16px] flex items-center justify-center gap-[10px] text-white font-bold text-[16px] transition-all active:scale-[0.98]"
                style={{ background: "#cd8188", fontFamily: M, boxShadow: "0 6px 18px rgba(205,129,136,0.35)" }}
              >
                <Calendar size={20} stroke="white" strokeWidth={2.2} />
                <MachineTranslatedText text="Make an Appointment" />
              </Link>
            ) : (
              <div className="space-y-[10px]">
                <Link
                  href="/documents"
                  className="block w-full rounded-full py-[16px] text-center text-white font-bold text-[16px] transition-all active:scale-[0.98]"
                  style={{ background: "#cd8188", fontFamily: M, boxShadow: "0 6px 18px rgba(205,129,136,0.35)" }}
                >
                  <MachineTranslatedText text="Verify to book →" />
                </Link>
                <p
                  className="text-[13px] text-center font-bold"
                  style={{ fontFamily: M, color: "#cd8188" }}
                >
                  <MachineTranslatedText text="Complete one-time verification, then book any visit instantly." />
                </p>
              </div>
            )
          ) : (
            <AuthPromptButton
              nextPath={`/dogs/${dog.id}`}
              reason="Sign in to save dogs and book shelter visits."
              className="block w-full text-center rounded-full py-[16px] text-white font-bold text-[16px] transition-all active:scale-[0.98]"
              style={{ background: "#cd8188", fontFamily: M, boxShadow: "0 6px 18px rgba(205,129,136,0.35)" }}
            >
              <MachineTranslatedText text="Sign in to book a visit" />
            </AuthPromptButton>
          )}
        </div>

        {/* Treat CTA — secondary outlined button below the appointment CTA */}
        <div className="mt-[10px]">
          <TreatButton
            variant="cta"
            dogId={dog.id}
            dogName={dog.name}
            shelterId={dog.shelter_id}
            shelterName={shelter?.name ?? "their shelter"}
            dogPhotoUrl={primaryDogPhotoUrl}
            isLoggedIn={Boolean(user)}
            autoOpenCount={autoOpenTreatCount}
          />
        </div>
      </div>
    </div>
  );
}
