import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { savePreferences, saveProfile } from "./actions";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createClient } from "@/utils/supabase/server";
import type { DogWithCover } from "@/types/database";

const M = "Montserrat, sans-serif";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath="/profile"
        reason="Sign in to view your profile, preferences, and wishlist."
      />
    );
  }

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
      className="relative overflow-y-auto overflow-x-hidden"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", scrollbarWidth: "none", background: "white" }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* ── Banner (285px) — placeholder gradient where cover photo goes ── */}
      <div
        className="absolute left-0 top-0 w-full h-[285px]"
        style={{ background: "linear-gradient(135deg, #d6c8ad 0%, #c4b49a 60%, #b8a48a 100%)" }}
      >
        {/* placeholder label */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-[#65584f]" style={{ fontFamily: M }}>
            Cover photo
          </p>
        </div>
      </div>

      {/* ── Name section bg (101px, sits at y=285) ── */}
      <div
        className="absolute left-0 w-full h-[101px]"
        style={{ top: 285, background: "rgba(214,200,173,0.5)" }}
      />

      {/* ── Circular avatar (145×145, overlaps banner→name at y=154) ── */}
      <div
        className="absolute left-[8px] size-[145px] rounded-full border-[4px] border-white flex items-center justify-center overflow-hidden"
        style={{ top: 154, background: "#c4b49a" }}
      >
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12ZM12 14C8.66667 14 2 15.675 2 19V21H22V19C22 15.675 15.3333 14 12 14Z"
            fill="rgba(101,88,79,0.35)"
          />
        </svg>
      </div>

      {/* ── Name (y=299) ── */}
      <p
        className="absolute left-[16px] w-[375px]"
        style={{ top: 299, fontFamily: M, fontSize: 36, color: "#65584f", lineHeight: "normal" }}
      >
        {displayName}
      </p>

      {/* ── Edit Profile button (y=308, right) ── */}
      <div className="absolute right-[16px]" style={{ top: 308 }}>
        <div className="rounded-[10px] px-[16px] py-[8px]" style={{ background: "#cd8188" }}>
          <p className="text-[12px] text-white text-center font-semibold" style={{ fontFamily: M }}>Edit Profile</p>
        </div>
      </div>

      {/* ── Badge pills (y=349) ── */}
      <div className="absolute left-[16px] flex gap-[8px] flex-wrap" style={{ top: 349 }}>
        {["First Adopter", "Member"].map((badge) => (
          <div key={badge} className="bg-white rounded-[20px] px-[8px] py-[6px] h-[25px] flex items-center justify-center">
            <p className="text-[10px] text-[#65584f] whitespace-nowrap text-center" style={{ fontFamily: M }}>{badge}</p>
          </div>
        ))}
      </div>

      {/* ── Spacer so content starts below the absolute-positioned header area ── */}
      <div style={{ height: 406 }} />

      {/* ── Wishlist title (Figma: y=406, centered, w=375) ── */}
      <p
        className="font-semibold text-center text-[#65584f] text-[20px]"
        style={{ fontFamily: M }}
      >
        Wishlist
      </p>

      {/* ── Wishlist grid (y=443) ── */}
      <div className="px-[16px] mt-[16px]">
        {savedDogs.length ? (
          <div className="flex flex-wrap gap-[7px]">
            {savedDogs.map((dog) => (
              <Link
                key={dog.id}
                href={`/dogs/${dog.id}`}
                className="block rounded-[10px] overflow-hidden active:scale-95 transition-transform"
                style={{ width: 110, height: 110, background: "#d6c8ad", position: "relative", flexShrink: 0 }}
              >
                {dog.cover_photo ? (
                  <img src={dog.cover_photo} alt={dog.name} className="absolute inset-0 size-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center size-full text-2xl">🐾</div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-[40px] text-center">
            <p className="text-[16px] text-[#65584f]/50" style={{ fontFamily: M }}>
              Your wishlist is empty. Start adding dogs you love!
            </p>
            <Link
              href="/swipe"
              className="mt-[16px] inline-block rounded-full px-[28px] py-[10px] text-white text-[14px] font-semibold"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              Browse Dogs
            </Link>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-[16px] mt-[32px] h-[1px]" style={{ background: "rgba(214,200,173,0.6)" }} />

      {/* ── Edit profile form ── */}
      <div className="px-[16px] mt-[24px] space-y-[16px]">
        {message && (
          <div className="rounded-[12px] bg-[#d6c8ad]/30 px-4 py-3 text-[13px] text-[#65584f]">
            {message}
          </div>
        )}

        <form action={saveProfile} className="space-y-[12px]">
          <p className="text-[14px] font-semibold text-[#65584f]/60 uppercase tracking-widest" style={{ fontFamily: M }}>Contact</p>
          {[
            { name: "fullName", label: "Full name", value: profile?.full_name ?? "", type: "text" },
            { name: "phoneNumber", label: "Phone", value: profile?.phone_number ?? adopter.phone_number ?? "", type: "tel" },
          ].map(({ name, label, value, type }) => (
            <div key={name}>
              <label className="block text-[12px] text-[#65584f]/60 mb-[4px]" style={{ fontFamily: M }}>{label}</label>
              <input
                name={name}
                type={type}
                defaultValue={value}
                className="w-full rounded-[12px] px-[14px] py-[13px] text-[14px] text-[#65584f] outline-none border-none"
                style={{ background: "#d6c8ad", fontFamily: M }}
              />
            </div>
          ))}
          <button
            className="w-full rounded-full py-[13px] text-white font-semibold text-[15px] border-0"
            style={{ background: "#cd8188", fontFamily: M }}
          >
            Save profile
          </button>
        </form>

        <form action={savePreferences} className="space-y-[12px] pb-[8px]">
          <p className="text-[14px] font-semibold text-[#65584f]/60 uppercase tracking-widest mt-[8px]" style={{ fontFamily: M }}>Preferences</p>
          <div className="grid grid-cols-2 gap-[10px]">
            <div>
              <label className="block text-[12px] text-[#65584f]/60 mb-[4px]" style={{ fontFamily: M }}>Size</label>
              <select
                name="preferredSize"
                defaultValue={preferences?.preferred_size ?? ""}
                className="w-full rounded-[12px] px-[12px] py-[13px] text-[14px] text-[#65584f] outline-none border-none capitalize"
                style={{ background: "#d6c8ad", fontFamily: M }}
              >
                <option value="">Any</option>
                {["small", "medium", "large", "extra_large"].map((o) => (
                  <option key={o} value={o}>{o.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-[#65584f]/60 mb-[4px]" style={{ fontFamily: M }}>Energy</label>
              <select
                name="preferredEnergy"
                defaultValue={preferences?.preferred_energy_level ?? ""}
                className="w-full rounded-[12px] px-[12px] py-[13px] text-[14px] text-[#65584f] outline-none border-none"
                style={{ background: "#d6c8ad", fontFamily: M }}
              >
                <option value="">Any</option>
                {["low", "medium", "high"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
          {[
            ["goodWithKids", "Good with kids", preferences?.good_with_kids],
            ["goodWithDogs", "Good with dogs", preferences?.good_with_dogs],
            ["goodWithCats", "Good with cats", preferences?.good_with_cats],
          ].map(([name, label, value]) => (
            <div
              key={String(name)}
              className="flex items-center justify-between rounded-[12px] px-[14px] py-[12px]"
              style={{ background: "#d6c8ad" }}
            >
              <span className="text-[14px] text-[#65584f]" style={{ fontFamily: M }}>{label}</span>
              <select
                name={String(name)}
                defaultValue={value == null ? "" : String(value)}
                className="text-[13px] text-[#65584f] outline-none border-none bg-transparent"
                style={{ fontFamily: M }}
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          ))}
          <button
            className="w-full rounded-full py-[13px] text-white font-semibold text-[15px] border-0"
            style={{ background: "#65584f", fontFamily: M }}
          >
            Save preferences
          </button>
        </form>

        {/* Sign out */}
        <form action={signOut}>
          <button
            className="w-full rounded-full py-[13px] text-[15px] font-semibold border-2"
            style={{ background: "white", borderColor: "rgba(101,88,79,0.2)", color: "#65584f", fontFamily: M }}
          >
            Sign out
          </button>
        </form>
      </div>

      {/* ── Sticky gradient header with logo ── */}
      <div
        className="fixed top-0 z-20 pointer-events-none h-[94px]"
        style={{
          width: "402px", maxWidth: "100vw", left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)",
        }}
      >
        <div className="pointer-events-auto absolute left-[8px] top-[39px]">
          <a href="/swipe" className="block h-[55px] w-[110px] relative">
            <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain object-left" priority />
          </a>
        </div>
      </div>
    </div>
  );
}
