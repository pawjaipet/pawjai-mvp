import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { DogWithCover } from "@/types/database";

const M = "Montserrat, sans-serif";

// Derive display nickname from full_name or email
function getNickname(fullName: string | null | undefined, email: string) {
  if (fullName?.trim()) return fullName.trim().split(" ")[0];
  return email.split("@")[0];
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath="/profile"
        reason="Sign in to view your profile and wishlist."
      />
    );
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  const [{ data: profile }, { data: wishlist }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin.from("wishlists").select("dog_id").eq("adopter_id", adopter.id),
  ]);

  const dogIds = (wishlist ?? []).map((item) => item.dog_id);
  const { data: dogs } = dogIds.length
    ? await admin.from("dogs").select("*").in("id", dogIds)
    : { data: [] };
  const { data: photos } = dogIds.length
    ? await admin.from("dog_photos").select("dog_id, public_url").in("dog_id", dogIds).eq("is_cover", true)
    : { data: [] };

  const coverMap = new Map((photos ?? []).map((p) => [p.dog_id, p.public_url]));
  const savedDogs: DogWithCover[] = (dogs ?? []).map((dog) => ({
    ...dog,
    cover_photo: coverMap.get(dog.id) ?? null,
  }));

  const nickname = getNickname(profile?.full_name, user.email ?? "");

  // Future: derive from DB. For now empty — "if none just leave blank space"
  const badges: string[] = [];

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
        background: "#F5F1E8",
        fontFamily: M,
      }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* ── Banner ── */}
      <div
        className="w-full relative overflow-hidden"
        style={{ height: 260, background: "linear-gradient(135deg, #e8dfd0 0%, #d6c8ad 50%, #c9b99e 100%)" }}
      >
        {/* Subtle paw watermark */}
        <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.08]">
          <svg width="200" height="200" viewBox="0 0 100 100" fill="#65584f">
            <ellipse cx="50" cy="75" rx="22" ry="18" />
            <ellipse cx="20" cy="55" rx="10" ry="13" />
            <ellipse cx="80" cy="55" rx="10" ry="13" />
            <ellipse cx="35" cy="40" rx="9" ry="11" />
            <ellipse cx="65" cy="40" rx="9" ry="11" />
          </svg>
        </div>
        {/* Gradient fade at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[80px]"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(245,241,232,0.6))" }}
        />
      </div>

      {/* ── White card panel ── */}
      <div
        className="mx-[12px] rounded-[20px] px-[20px] pt-[16px] pb-[20px]"
        style={{
          marginTop: -20,
          background: "white",
          boxShadow: "0 4px 24px rgba(101,88,79,0.10)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Avatar circle — overlapping banner */}
        <div
          className="absolute rounded-full border-[4px] border-white overflow-hidden flex items-center justify-center"
          style={{
            top: -54,
            left: 20,
            width: 100,
            height: 100,
            background: "linear-gradient(135deg, #d6c8ad 0%, #c4b49a 100%)",
            boxShadow: "0 4px 16px rgba(101,88,79,0.18)",
          }}
        >
          {profile?.profile_picture_url ? (
            <img src={profile.profile_picture_url} alt={nickname} className="w-full h-full object-cover" />
          ) : (
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12ZM12 14C8.67 14 2 15.68 2 19V21H22V19C22 15.68 15.33 14 12 14Z"
                fill="rgba(101,88,79,0.4)"
              />
            </svg>
          )}
        </div>

        {/* Edit Profile — top right of card */}
        <div className="flex justify-end" style={{ minHeight: 40 }}>
          <button
            className="rounded-[10px] px-[18px] py-[9px] text-[13px] font-semibold text-white transition-all active:scale-95"
            style={{ background: "#cd8188", fontFamily: M }}
          >
            Edit Profile
          </button>
        </div>

        {/* Name */}
        <h1
          className="text-[32px] font-bold leading-tight"
          style={{ color: "#65584f", fontFamily: M, marginTop: 4 }}
        >
          {nickname}
        </h1>

        {/* Badges — blank space if none */}
        <div className="flex gap-[8px] flex-wrap mt-[10px]" style={{ minHeight: 30 }}>
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full px-[14px] py-[5px] text-[12px] font-medium"
              style={{
                border: "1.5px solid rgba(101,88,79,0.25)",
                color: "#65584f",
                fontFamily: M,
                background: "transparent",
              }}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* ── Wishlist section ── */}
      <div className="mt-[28px] px-[16px]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-[16px]">
          <h2
            className="text-[18px] font-bold"
            style={{ color: "#65584f", fontFamily: M }}
          >
            Wishlist
          </h2>
          {savedDogs.length > 0 && (
            <span
              className="rounded-full px-[12px] py-[4px] text-[12px] font-semibold"
              style={{ background: "rgba(205,129,136,0.12)", color: "#cd8188", fontFamily: M }}
            >
              {savedDogs.length} {savedDogs.length === 1 ? "dog" : "dogs"}
            </span>
          )}
        </div>

        {savedDogs.length > 0 ? (
          <div
            className="grid gap-[8px]"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            {savedDogs.map((dog) => (
              <Link
                key={dog.id}
                href={`/dogs/${dog.id}`}
                className="block rounded-[14px] overflow-hidden active:scale-[0.96] transition-transform"
                style={{ aspectRatio: "1", background: "#d6c8ad", position: "relative" }}
              >
                {dog.cover_photo ? (
                  <img
                    src={dog.cover_photo}
                    alt={dog.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-3xl">🐾</div>
                )}
                {/* Name overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 px-[8px] py-[6px]"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)" }}
                >
                  <p className="text-white text-[11px] font-semibold truncate" style={{ fontFamily: M }}>
                    {dog.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="rounded-[20px] flex flex-col items-center justify-center py-[48px] px-[24px] text-center"
            style={{ background: "white", boxShadow: "0 2px 12px rgba(101,88,79,0.07)" }}
          >
            <p className="text-[40px] mb-[12px]">🐾</p>
            <p className="text-[16px] font-semibold text-[#65584f] mb-[6px]" style={{ fontFamily: M }}>
              No dogs saved yet
            </p>
            <p className="text-[13px] text-[#65584f]/50 mb-[20px]" style={{ fontFamily: M }}>
              Swipe and save the ones that catch your heart
            </p>
            <Link
              href="/"
              className="rounded-full px-[28px] py-[12px] text-white text-[14px] font-semibold transition-all active:scale-95"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              Browse Dogs
            </Link>
          </div>
        )}
      </div>

      {/* ── Sign out ── */}
      <div className="mt-[36px] px-[16px]">
        <form action={signOut}>
          <button
            className="w-full rounded-[14px] py-[14px] text-[14px] font-semibold transition-all active:scale-[0.98]"
            style={{
              background: "white",
              border: "1.5px solid rgba(101,88,79,0.15)",
              color: "rgba(101,88,79,0.55)",
              fontFamily: M,
              boxShadow: "0 2px 8px rgba(101,88,79,0.05)",
            }}
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
