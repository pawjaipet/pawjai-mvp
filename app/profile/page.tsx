import Link from "next/link";
import { Settings } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import EditableProfileHeader from "@/components/profile/EditableProfileHeader";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { canBookAppointment, ensureAdopterForUser, getAdopterVerificationSnapshot } from "@/utils/adopter";
import { normalizeDogMediaUrl } from "@/utils/dog-media";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { DogWithCover } from "@/types/database";

const M = "Montserrat, sans-serif";
type ProfileBadgeId = "first_adopter" | "top_donater" | "premium_user";

function getNickname(fullName: string | null | undefined, email: string) {
  if (fullName?.trim()) return fullName.trim().split(" ")[0];
  return email.split("@")[0];
}

async function getProfileBadges(adopterId: string): Promise<ProfileBadgeId[]> {
  const admin = createAdminClient();
  const badges: ProfileBadgeId[] = [];
  const { data: completedAppointments } = await admin
    .from("appointments")
    .select("dog_id")
    .eq("adopter_id", adopterId)
    .eq("status", "completed")
    .not("dog_id", "is", null);

  const completedDogIds = [...new Set((completedAppointments ?? []).map((appointment) => appointment.dog_id))] as string[];

  if (completedDogIds.length > 0) {
    const { count: adoptedDogCount } = await admin
      .from("dogs")
      .select("id", { count: "exact", head: true })
      .in("id", completedDogIds)
      .eq("adoption_status", "adopted");

    if ((adoptedDogCount ?? 0) > 0) badges.push("first_adopter");
  }

  return badges;
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

  const verification = await getAdopterVerificationSnapshot(supabase, user);
  const adopter = verification.adopter;
  const admin = createAdminClient();

  const [{ data: profile }, { data: wishlist }, badges] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin.from("wishlists").select("dog_id").eq("adopter_id", adopter.id),
    getProfileBadges(adopter.id),
  ]);

  const dogIds = (wishlist ?? []).map((item) => item.dog_id);
  const { data: dogs } = dogIds.length
    ? await admin.from("dogs").select("*").in("id", dogIds)
    : { data: [] };
  const coverPhotoIds = (dogs ?? []).map((dog) => dog.cover_photo_id).filter(Boolean) as string[];
  const { data: photos } = coverPhotoIds.length
    ? await admin.from("dog_photos").select("id, public_url, storage_path").in("id", coverPhotoIds)
    : { data: [] };

  const coverMap = new Map((photos ?? []).map((p) => [p.id, normalizeDogMediaUrl(p.public_url, p.storage_path)]));
  const savedDogs: DogWithCover[] = (dogs ?? []).map((dog) => ({
    ...dog,
    cover_photo: dog.cover_photo_id ? (coverMap.get(dog.cover_photo_id) ?? null) : null,
  }));

  const nickname = getNickname(profile?.full_name, user.email ?? "");

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

      <div className="mt-[20px] px-[16px]">
        <Link
          href="/documents"
          className="block rounded-[20px] px-[18px] py-[16px]"
          style={{ background: "white", boxShadow: "0 2px 12px rgba(101,88,79,0.07)" }}
        >
          <p className="text-[12px] uppercase tracking-[0.16em] text-[#65584f]/45" style={{ fontFamily: M }}>
            Verification
          </p>
          <div className="mt-[8px] flex items-center justify-between gap-[16px]">
            <div>
              <p className="text-[16px] font-semibold text-[#65584f]" style={{ fontFamily: M }}>
                {canBookAppointment(verification) ? "Ready for shelter visits" : "Complete once to unlock booking"}
              </p>
              <p className="mt-[4px] text-[13px] text-[#65584f]/60" style={{ fontFamily: M }}>
                Status: {verification.status.replace("_", " ")}
              </p>
            </div>
            <span className="text-[13px] font-semibold text-[#cd8188]" style={{ fontFamily: M }}>
              Manage →
            </span>
          </div>
        </Link>
      </div>

      {/* ── Wishlist section — horizontal scroll, Figma style ── */}
      <div className="mt-[28px]">
        <div className="flex items-center justify-between mb-[14px] px-[16px]">
          <h2 className="text-[22px] font-bold" style={{ color: "#65584f", fontFamily: M }}>
            Wishlist
          </h2>
          {savedDogs.length > 0 && (
            <span
              className="rounded-full px-[14px] py-[5px] text-[13px] font-semibold"
              style={{ background: "rgba(214,200,173,0.45)", color: "#65584f", fontFamily: M }}
            >
              {savedDogs.length} {savedDogs.length === 1 ? "dog" : "dogs"}
            </span>
          )}
        </div>

        {savedDogs.length > 0 ? (
          <div
            className="flex gap-[12px] overflow-x-auto px-[16px] pb-[6px]"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {savedDogs.map((dog) => (
              <Link
                key={dog.id}
                href={`/dogs/${dog.id}`}
                className="block rounded-[18px] overflow-hidden active:scale-[0.97] transition-transform flex-shrink-0"
                style={{
                  width: 175,
                  height: 175,
                  background: "white",
                  boxShadow: "0 4px 14px rgba(101,88,79,0.10)",
                  position: "relative",
                }}
              >
                {dog.cover_photo ? (
                  <img
                    src={dog.cover_photo}
                    alt={dog.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl bg-[#d6c8ad]">🐾</div>
                )}
                {/* Heart badge top-right */}
                <div
                  className="absolute top-[10px] right-[10px] w-[34px] h-[34px] rounded-full flex items-center justify-center"
                  style={{ background: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#cd8188">
                    <path d="M12 21s-7-4.35-9.5-9.5C.5 7 4 3 8 3c2 0 3.5 1 4 2 .5-1 2-2 4-2 4 0 7.5 4 5.5 8.5C19 16.65 12 21 12 21z" />
                  </svg>
                </div>
                {/* Name strip at bottom — white card style */}
                <div
                  className="absolute bottom-0 left-0 right-0 px-[12px] py-[10px]"
                  style={{ background: "white" }}
                >
                  <p
                    className="text-[14px] font-bold truncate"
                    style={{ color: "#65584f", fontFamily: M }}
                  >
                    {dog.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="mx-[16px] rounded-[20px] flex flex-col items-center justify-center py-[48px] px-[24px] text-center"
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

      {/* ── My Adopted Pets tile ── */}
      <div className="mt-[28px] px-[16px]">
        <Link
          href="/adopted"
          className="block rounded-[18px] px-[18px] py-[18px] flex items-center gap-[14px] active:scale-[0.98] transition-transform"
          style={{ background: "white", boxShadow: "0 2px 12px rgba(101,88,79,0.08)" }}
        >
          <div
            className="w-[48px] h-[48px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(205,129,136,0.14)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#cd8188">
              <path d="M12 21s-7-4.35-9.5-9.5C.5 7 4 3 8 3c2 0 3.5 1 4 2 .5-1 2-2 4-2 4 0 7.5 4 5.5 8.5C19 16.65 12 21 12 21z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold" style={{ color: "#65584f", fontFamily: M }}>
              My Adopted Pets
            </p>
            <p className="text-[13px] mt-[2px]" style={{ color: "rgba(101,88,79,0.6)", fontFamily: M }}>
              Chat with your adopted companions
            </p>
          </div>
          <span className="text-[#65584f]/35 text-[20px]">›</span>
        </Link>
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
