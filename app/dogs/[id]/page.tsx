import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import ImageWithFallback from "@/components/ImageWithFallback";
import type { DogPhoto } from "@/types/database";
import { bookAppointment, toggleWishlist } from "./actions";

function Badge({
  children,
  variant = "beige",
}: {
  children: React.ReactNode;
  variant?: "beige" | "rose" | "dark" | "brown";
}) {
  const styles = {
    beige: { background: "#d6c8ad", color: "#65584f" },
    rose: { background: "#cd8188", color: "white" },
    dark: { background: "#65584f", color: "white" },
    brown: { background: "rgba(101,88,79,0.12)", color: "#65584f" },
  };
  return (
    <span
      className="inline-block text-[12px] font-medium px-[10px] py-[4px] rounded-full"
      style={{ fontFamily: "Montserrat, sans-serif", ...styles[variant] }}
    >
      {children}
    </span>
  );
}

function StarRating({ value }: { value: number | null }) {
  if (!value) return <span className="text-[#65584f]/40 text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>No rating</span>;
  return (
    <span className="text-sm text-[#65584f]" style={{ fontFamily: "Montserrat, sans-serif" }}>
      {"★".repeat(value)}{"☆".repeat(5 - value)}
      <span className="ml-1 text-[#65584f]/50">({value}/5)</span>
    </span>
  );
}

function ageLabel(months: number | null): string {
  if (months === null) return "Unknown";
  if (months < 12) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} yr ${m} mo` : `${y} year${y > 1 ? "s" : ""}`;
}

export default async function DogProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: dog } = await supabase.from("dogs").select("*").eq("id", id).single();
  if (!dog) notFound();

  const [{ data: photosData }, { data: shelter }] = await Promise.all([
    supabase.from("dog_photos").select("*").eq("dog_id", id).order("sort_order"),
    supabase
      .from("shelters")
      .select("name, hygiene_rating, professionalism_rating, province, district, phone_number, facebook_url")
      .eq("id", dog.shelter_id)
      .single(),
  ]);

  const photos: DogPhoto[] = photosData ?? [];
  const cover = photos.find((p) => p.is_cover) ?? photos[0] ?? null;

  let adopterId: string | null = null;
  let saved = false;

  if (user) {
    const { data: adopter } = await supabase.from("adopters").select("id").eq("profile_id", user.id).maybeSingle();
    adopterId = adopter?.id ?? null;
    if (adopterId) {
      const { data: wishlist } = await supabase
        .from("wishlists")
        .select("dog_id")
        .eq("adopter_id", adopterId)
        .eq("dog_id", id)
        .maybeSingle();
      saved = Boolean(wishlist);
    }
  }

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="bg-white relative overflow-y-auto overflow-x-hidden"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", scrollbarWidth: "none" }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Cover photo */}
      <div className="relative h-[300px] md:h-[360px]" style={{ background: "#d6c8ad" }}>
        <ImageWithFallback
          src={cover?.public_url}
          alt={dog.name}
          fill
          className="object-cover"
          priority
        />
        {/* Back button overlay */}
        <Link
          href="/dogs"
          className="absolute top-[12px] left-[12px] z-10 flex items-center gap-[6px] rounded-full px-[12px] py-[6px] text-[13px] font-semibold"
          style={{ background: "rgba(255,255,255,0.85)", color: "#65584f", fontFamily: "Montserrat, sans-serif" }}
        >
          ← Back
        </Link>
        {/* Wishlist button overlay */}
        {user && (
          <form action={toggleWishlist} className="absolute top-[12px] right-[12px] z-10">
            <input type="hidden" name="dogId" value={dog.id} />
            <input type="hidden" name="isSaved" value={String(saved)} />
            <button
              className="flex items-center justify-center w-[38px] h-[38px] rounded-full text-[18px]"
              style={{ background: "rgba(255,255,255,0.85)" }}
            >
              {saved ? "❤️" : "🤍"}
            </button>
          </form>
        )}
      </div>

      {/* Photo strip */}
      {photos.length > 1 && (
        <div className="flex gap-[8px] mt-[10px] px-[16px] overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <style>{`.photo-strip::-webkit-scrollbar{display:none}`}</style>
          {photos.map((p) => (
            <div key={p.id} className="shrink-0 w-[72px] h-[72px] rounded-[10px] overflow-hidden" style={{ background: "#d6c8ad" }}>
              <ImageWithFallback src={p.public_url} alt={dog.name} width={72} height={72} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Main info */}
      <div className="px-[16px] mt-[16px]">
        <div className="flex items-start justify-between gap-3">
          <h1
            className="text-[28px] font-bold text-[#65584f]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {dog.name}
          </h1>
          <Badge variant={dog.adoption_status === "available" ? "dark" : "brown"}>
            {dog.adoption_status.charAt(0).toUpperCase() + dog.adoption_status.slice(1)}
          </Badge>
        </div>
        <p className="text-[14px] text-[#65584f]/60 mt-[2px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {dog.breed ?? "Mixed breed"}
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-[8px] mt-[16px]">
          {[
            { label: "Age", value: ageLabel(dog.age_months) },
            { label: "Gender", value: dog.gender === "unknown" ? "Unknown" : dog.gender === "male" ? "Male" : "Female" },
            { label: "Size", value: dog.size ? dog.size.replace("_", " ") : "Unknown" },
            { label: "Weight", value: dog.weight_kg ? `${dog.weight_kg} kg` : "Unknown" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[14px] p-[12px]" style={{ background: "#d6c8ad" }}>
              <p className="text-[11px] text-[#65584f]/60 uppercase tracking-wide" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {label}
              </p>
              <p className="font-semibold text-[#65584f] mt-[2px] capitalize text-[15px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Trait badges */}
        <div className="mt-[16px] flex flex-wrap gap-[6px]">
          {dog.sterilized && <Badge variant="dark">Sterilized</Badge>}
          {dog.energy_level && (
            <Badge variant={dog.energy_level === "high" ? "rose" : "beige"}>
              {dog.energy_level.charAt(0).toUpperCase() + dog.energy_level.slice(1)} energy
            </Badge>
          )}
          {dog.good_with_kids && <Badge variant="dark">Good with kids</Badge>}
          {dog.good_with_dogs && <Badge variant="dark">Good with dogs</Badge>}
          {dog.good_with_cats && <Badge variant="dark">Good with cats</Badge>}
          {dog.house_trained && <Badge variant="beige">House trained</Badge>}
          {dog.leash_trained && <Badge variant="beige">Leash trained</Badge>}
          {dog.human_friendly && <Badge variant="beige">Human friendly</Badge>}
          {dog.special_needs && <Badge variant="rose">Special needs</Badge>}
        </div>

        {/* Background */}
        {dog.background && (
          <div className="mt-[20px]">
            <h2 className="text-[16px] font-semibold text-[#65584f] mb-[8px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              About {dog.name}
            </h2>
            <p className="text-[14px] text-[#65584f]/80 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {dog.background}
            </p>
          </div>
        )}

        {/* Special needs */}
        {dog.special_needs && (
          <div className="mt-[12px] rounded-[14px] p-[14px] border border-[#cd8188]/40" style={{ background: "rgba(205,129,136,0.08)" }}>
            <p className="text-[13px] font-semibold text-[#cd8188] mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Special needs
            </p>
            <p className="text-[13px] text-[#65584f]/80" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {dog.special_needs}
            </p>
          </div>
        )}

        {/* Shelter */}
        {shelter && (
          <div className="mt-[20px] rounded-[16px] p-[16px] border border-[#d6c8ad]" style={{ background: "white" }}>
            <h2 className="text-[16px] font-semibold text-[#65584f] mb-[10px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Shelter
            </h2>
            <p className="font-semibold text-[#65584f] text-[15px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {shelter.name}
            </p>
            {(shelter.district || shelter.province) && (
              <p className="text-[13px] text-[#65584f]/60 mt-[2px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {[shelter.district, shelter.province].filter(Boolean).join(", ")}
              </p>
            )}
            <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
              <div>
                <p className="text-[11px] text-[#65584f]/50 uppercase tracking-wide mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Hygiene
                </p>
                <StarRating value={shelter.hygiene_rating} />
              </div>
              <div>
                <p className="text-[11px] text-[#65584f]/50 uppercase tracking-wide mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Professionalism
                </p>
                <StarRating value={shelter.professionalism_rating} />
              </div>
            </div>
            {shelter.phone_number && (
              <p className="text-[13px] text-[#65584f]/60 mt-[10px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                📞 {shelter.phone_number}
              </p>
            )}
            {shelter.facebook_url && (
              <a
                href={shelter.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] mt-[4px] block"
                style={{ color: "#cd8188", fontFamily: "Montserrat, sans-serif" }}
              >
                Facebook page →
              </a>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="mt-[24px] space-y-[12px]">
          {message && (
            <div className="rounded-[12px] px-[16px] py-[12px] text-[14px] text-[#65584f]" style={{ background: "#d6c8ad" }}>
              {message}
            </div>
          )}

          {user ? (
            <>
              <form action={bookAppointment} className="rounded-[16px] p-[16px] border border-[#d6c8ad] space-y-[12px]">
                <input type="hidden" name="dogId" value={dog.id} />
                <h2 className="text-[16px] font-semibold text-[#65584f]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Book a visit
                </h2>
                <p className="text-[13px] text-[#65584f]/60" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Request a shelter appointment. Your email is saved for follow-up.
                </p>
                <div className="grid grid-cols-2 gap-[10px]">
                  <div>
                    <label className="block text-[12px] text-[#65584f]/70 mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Date
                    </label>
                    <input
                      name="appointmentDate"
                      type="date"
                      min={minDate}
                      required
                      className="w-full rounded-[12px] px-[12px] py-[12px] text-[14px] text-[#65584f] outline-none border-none"
                      style={{ background: "#d6c8ad", fontFamily: "Montserrat, sans-serif" }}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#65584f]/70 mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Time
                    </label>
                    <input
                      name="appointmentTime"
                      type="time"
                      required
                      className="w-full rounded-[12px] px-[12px] py-[12px] text-[14px] text-[#65584f] outline-none border-none"
                      style={{ background: "#d6c8ad", fontFamily: "Montserrat, sans-serif" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-[#65584f]/70 mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Note
                  </label>
                  <textarea
                    name="visitorNote"
                    rows={3}
                    placeholder="Anything the shelter should know?"
                    className="w-full rounded-[12px] px-[12px] py-[12px] text-[14px] text-[#65584f] outline-none border-none resize-none placeholder:text-[#65584f]/40"
                    style={{ background: "#d6c8ad", fontFamily: "Montserrat, sans-serif" }}
                  />
                </div>
                <button
                  className="w-full rounded-full py-[14px] text-white font-semibold text-[15px] border-0 transition-all active:opacity-80"
                  style={{ background: "#cd8188", fontFamily: "Montserrat, sans-serif" }}
                >
                  Request appointment
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/auth"
              className="block w-full text-center rounded-full py-[14px] text-white font-semibold text-[15px]"
              style={{ background: "#cd8188", fontFamily: "Montserrat, sans-serif" }}
            >
              Sign in to save and book
            </Link>
          )}
        </div>
      </div>

      {/* Sticky gradient header */}
      <div
        className="fixed top-0 z-20 pointer-events-none h-[94px]"
        style={{
          width: "402px",
          maxWidth: "100vw",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)",
        }}
      >
        <div className="pointer-events-auto absolute left-[8px] top-[39px]">
          <a href="/swipe" className="block h-[55px] w-[110px] relative">
            <Image
              src="/pawjai-logo.png"
              alt="PawJai"
              fill
              className="object-contain object-left"
              priority
            />
          </a>
        </div>
      </div>
    </div>
  );
}
