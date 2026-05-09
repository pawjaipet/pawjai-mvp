import Link from "next/link";
import { Settings } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import EditableProfileHeader from "@/components/profile/EditableProfileHeader";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { DogWithCover } from "@/types/database";

const M = "Montserrat, sans-serif";

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
  // TODO: derive from DB once badge tracking exists. Empty = blank space.
  const badges: ("first_adopter" | "top_donater" | "premium_user")[] = [
    "first_adopter",
    "top_donater",
    "premium_user",
  ];

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

      <EditableProfileHeader
        initialNickname={nickname}
        initialFullName={profile?.full_name ?? ""}
        initialAvatarUrl={profile?.profile_picture_url ?? null}
        initialCoverUrl={profile?.cover_photo_url ?? null}
        badges={badges}
      />

      {/* ── Wishlist section ── */}
      <div className="mt-[28px] px-[16px]">
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

      {/* ── Settings + Sign out ── */}
      <div className="mt-[36px] px-[16px] space-y-[10px]">
        <Link
          href="/settings"
          className="w-full rounded-[14px] py-[14px] text-[14px] font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-[8px]"
          style={{
            background: "white",
            border: "1.5px solid rgba(101,88,79,0.15)",
            color: "#65584f",
            fontFamily: M,
            boxShadow: "0 2px 8px rgba(101,88,79,0.05)",
          }}
        >
          <Settings size={16} stroke="#65584f" strokeWidth={2} />
          Settings
        </Link>
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
