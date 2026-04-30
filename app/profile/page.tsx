import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { savePreferences, saveProfile } from "./actions";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createClient } from "@/utils/supabase/server";
import type { DogWithCover } from "@/types/database";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?message=Sign in to manage your profile.");

  const adopter = await ensureAdopterForUser(supabase, user);

  const [{ data: profile }, { data: preferences }, { data: wishlist }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("adopter_preferences").select("*").eq("adopter_id", adopter.id).maybeSingle(),
    supabase.from("wishlists").select("dog_id").eq("adopter_id", adopter.id),
  ]);

  const dogIds = (wishlist ?? []).map((item) => item.dog_id);
  const { data: dogs } = dogIds.length
    ? await supabase.from("dogs").select("*").in("id", dogIds)
    : { data: [] };
  const { data: photos } = dogIds.length
    ? await supabase.from("dog_photos").select("dog_id, public_url").in("dog_id", dogIds).eq("is_cover", true)
    : { data: [] };

  const coverMap = new Map((photos ?? []).map((p) => [p.dog_id, p.public_url]));
  const savedDogs: DogWithCover[] = (dogs ?? []).map((dog) => ({
    ...dog,
    cover_photo: coverMap.get(dog.id) ?? null,
  }));

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "User";

  return (
    <div
      className="bg-white relative overflow-y-auto overflow-x-hidden"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", scrollbarWidth: "none" }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Cover photo header */}
      <div className="relative h-[220px] w-full bg-gradient-to-br from-[#d6c8ad] to-[#c4b49a]">
        {/* Sign out in top-right */}
        <form action={signOut} className="absolute top-[14px] right-[12px] z-10">
          <button
            className="rounded-full px-[14px] py-[6px] text-[12px] font-semibold text-[#65584f] border border-[#65584f]/30 bg-white/70 backdrop-blur-sm"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Sign out
          </button>
        </form>

        {/* Profile photo - overlapping cover */}
        <div className="absolute -bottom-[50px] left-[16px] size-[100px] rounded-full overflow-hidden border-4 border-white bg-[#d6c8ad]">
          <div className="flex items-center justify-center size-full">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12ZM12 14C8.66667 14 2 15.675 2 19V21H22V19C22 15.675 15.3333 14 12 14Z" fill="#65584f" fillOpacity="0.4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Name section */}
      <div className="bg-[rgba(214,200,173,0.5)] pt-[60px] pb-[16px] px-[16px] relative">
        <p
          className="text-[28px] text-[#65584f] leading-tight"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {displayName}
        </p>
        <p className="text-[12px] text-[#65584f]/60 mt-[2px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {user.email}
        </p>

        {/* Badges */}
        <div className="flex gap-[8px] mt-[10px] flex-wrap">
          {["Member", adopter.id ? "Adopter" : null].filter(Boolean).map((badge) => (
            <span
              key={badge}
              className="border border-[#65584f] rounded-[20px] px-[10px] py-[4px] text-[10px] text-[#65584f] bg-white"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Edit Profile / appointments link */}
        <Link
          href="/appointments"
          className="absolute right-[12px] bottom-[16px] bg-[#cd8188] rounded-[10px] px-[14px] py-[6px]"
        >
          <span className="text-[12px] text-white font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
            View appointments
          </span>
        </Link>
      </div>

      {message && (
        <div className="mx-[16px] mt-[16px] rounded-[12px] bg-[#d6c8ad]/30 px-4 py-3 text-sm text-[#65584f]">
          {message}
        </div>
      )}

      {/* Contact + preferences forms */}
      <div className="px-[16px] mt-[20px] space-y-[16px]">
        {/* Contact */}
        <form action={saveProfile} className="bg-white rounded-[16px] border border-[#d6c8ad]/50 p-[16px] space-y-[12px] shadow-sm">
          <h2 className="text-[16px] font-semibold text-[#65584f]" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Contact details
          </h2>
          <div>
            <label className="block text-[12px] text-[#65584f]/70 mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Full name
            </label>
            <input
              name="fullName"
              defaultValue={profile?.full_name ?? ""}
              className="w-full rounded-[12px] px-[14px] py-[12px] text-[14px] text-[#65584f] outline-none border-none"
              style={{ background: "#d6c8ad", fontFamily: "Montserrat, sans-serif" }}
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#65584f]/70 mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Phone
            </label>
            <input
              name="phoneNumber"
              defaultValue={profile?.phone_number ?? adopter.phone_number ?? ""}
              className="w-full rounded-[12px] px-[14px] py-[12px] text-[14px] text-[#65584f] outline-none border-none"
              style={{ background: "#d6c8ad", fontFamily: "Montserrat, sans-serif" }}
            />
          </div>
          <button
            className="w-full rounded-[16px] py-[12px] text-white font-semibold text-[15px] border-0 transition-all active:opacity-80"
            style={{ background: "#cd8188", fontFamily: "Montserrat, sans-serif" }}
          >
            Save profile
          </button>
        </form>

        {/* Preferences */}
        <form action={savePreferences} className="bg-white rounded-[16px] border border-[#d6c8ad]/50 p-[16px] space-y-[12px] shadow-sm">
          <h2 className="text-[16px] font-semibold text-[#65584f]" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Matching preferences
          </h2>
          <div className="grid grid-cols-2 gap-[10px]">
            {[
              { id: "preferredSize", label: "Size", name: "preferredSize", current: preferences?.preferred_size, opts: ["small", "medium", "large", "extra_large"] },
              { id: "preferredEnergy", label: "Energy", name: "preferredEnergy", current: preferences?.preferred_energy_level, opts: ["low", "medium", "high"] },
            ].map(({ id, label, name, current, opts }) => (
              <div key={id}>
                <label className="block text-[12px] text-[#65584f]/70 mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {label}
                </label>
                <select
                  id={id}
                  name={name}
                  defaultValue={current ?? ""}
                  className="w-full rounded-[12px] px-[12px] py-[12px] text-[14px] text-[#65584f] outline-none border-none capitalize"
                  style={{ background: "#d6c8ad", fontFamily: "Montserrat, sans-serif" }}
                >
                  <option value="">Any</option>
                  {opts.map((o) => (
                    <option key={o} value={o}>{o.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {[
            ["goodWithKids", "Good with kids", preferences?.good_with_kids],
            ["goodWithDogs", "Good with dogs", preferences?.good_with_dogs],
            ["goodWithCats", "Good with cats", preferences?.good_with_cats],
          ].map(([name, label, value]) => (
            <label
              key={String(name)}
              className="flex items-center justify-between rounded-[12px] px-[14px] py-[12px]"
              style={{ background: "#d6c8ad" }}
            >
              <span className="text-[14px] text-[#65584f]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {label}
              </span>
              <select
                name={String(name)}
                defaultValue={value == null ? "" : String(value)}
                className="text-[13px] text-[#65584f] outline-none border-none bg-transparent"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          ))}
          <div>
            <label className="block text-[12px] text-[#65584f]/70 mb-[4px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={preferences?.notes ?? ""}
              placeholder="Lifestyle, home setup, or traits you care about"
              className="w-full rounded-[12px] px-[14px] py-[12px] text-[14px] text-[#65584f] outline-none border-none resize-none placeholder:text-[#65584f]/50"
              style={{ background: "#d6c8ad", fontFamily: "Montserrat, sans-serif" }}
            />
          </div>
          <button
            className="w-full rounded-[16px] py-[12px] text-white font-semibold text-[15px] border-0 transition-all active:opacity-80"
            style={{ background: "#65584f", fontFamily: "Montserrat, sans-serif" }}
          >
            Save preferences
          </button>
        </form>
      </div>

      {/* Wishlist section */}
      <div className="px-[16px] mt-[24px]">
        <p
          className="text-[20px] font-semibold text-[#65584f] text-center mb-[16px]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Wishlist
        </p>

        {savedDogs.length ? (
          <div className="flex flex-wrap gap-[7px]">
            {savedDogs.map((dog) => (
              <Link
                key={dog.id}
                href={`/dogs/${dog.id}`}
                className="h-[110px] w-[110px] rounded-[10px] overflow-hidden shrink-0 relative bg-[#d6c8ad] block active:scale-95 transition-transform"
              >
                {dog.cover_photo ? (
                  <img
                    src={dog.cover_photo}
                    alt={dog.name}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center size-full">
                    <span className="text-2xl">🐾</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-[40px] text-center">
            <p
              className="text-[16px] text-[#65584f]/50"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Your wishlist is empty. Start adding dogs you love!
            </p>
            <Link
              href="/swipe"
              className="mt-[16px] inline-block rounded-[22px] px-[28px] py-[10px] text-white text-[14px] font-semibold"
              style={{ background: "#cd8188", fontFamily: "Montserrat, sans-serif" }}
            >
              Browse Dogs
            </Link>
          </div>
        )}
      </div>

      {/* Sticky gradient header — rendered last so it's on top */}
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
