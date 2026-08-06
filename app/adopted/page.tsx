import Link from "next/link";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { ensureAdopterForUser } from "@/utils/adopter";
import { normalizeDogMediaUrl } from "@/utils/dog-media";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const M = "Montserrat, sans-serif";

async function getAdoptedDogs(adopterId: string) {
  const admin = createAdminClient();
  const { data: appts } = await admin
    .from("appointments")
    .select("dog_id, appointment_date, status")
    .eq("adopter_id", adopterId)
    .eq("status", "completed")
    .not("dog_id", "is", null);

  const dogIds = [...new Set((appts ?? []).map((a) => a.dog_id))] as string[];
  if (dogIds.length === 0) return [];

  const [{ data: dogs }, { data: photos }] = await Promise.all([
    admin.from("dogs").select("id, name, breed, gender").in("id", dogIds).eq("adoption_status", "adopted"),
    admin.from("dog_photos").select("dog_id, public_url, storage_path").in("dog_id", dogIds).eq("is_cover", true),
  ]);

  const coverMap = new Map((photos ?? []).map((p) => [p.dog_id, normalizeDogMediaUrl(p.public_url, p.storage_path)]));
  return (dogs ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    breed: d.breed,
    gender: d.gender,
    coverUrl: coverMap.get(d.id) ?? null,
  }));
}

export default async function AdoptedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath="/adopted"
        reason="Sign in to view your adopted pets."
      />
    );
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const pets = await getAdoptedDogs(adopter.id);

  return (
    <div
      className="relative overflow-y-auto"
      style={{
        width: "402px",
        maxWidth: "100vw",
        margin: "0 auto",
        minHeight: "100dvh",
        paddingBottom: "90px",
        background: "#F5F1E8",
        fontFamily: M,
        scrollbarWidth: "none",
      }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Beige header with logo + title */}
      <div className="px-[16px] pt-[14px] pb-[24px]" style={{ background: "#d6c8ad" }}>
        <div className="mb-[18px] flex items-start justify-between">
          <Link href="/" className="block h-[60px] w-[60px] active:scale-95 transition-transform">
            <img src="/pawjai-logo.png" alt="PawJai" className="h-full w-full object-contain object-left" />
          </Link>
          <LanguageSwitcher className="mt-[4px]" />
        </div>
        <h1 className="font-bold text-[34px] text-[#65584f] leading-[1.1]" style={{ fontFamily: M }}>My Adopted Pets</h1>
        <p className="text-[14px] text-[#65584f]/75 mt-[4px]" style={{ fontFamily: M }}>Chat with your adopted companions</p>
      </div>

      {pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-[24px] py-[60px] text-center">
          <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center mb-[20px]" style={{ background: "rgba(205,129,136,0.14)" }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="#cd8188">
              <path d="M12 21s-7-4.35-9.5-9.5C.5 7 4 3 8 3c2 0 3.5 1 4 2 .5-1 2-2 4-2 4 0 7.5 4 5.5 8.5C19 16.65 12 21 12 21z" />
            </svg>
          </div>
          <p className="text-[20px] font-bold text-[#65584f] mb-[8px]" style={{ fontFamily: M }}>
            No adopted pets yet
          </p>
          <p className="text-[14px] text-[#65584f]/60 mb-[24px] max-w-[300px]" style={{ fontFamily: M }}>
            Pets you complete an adoption with will show up here, where you can chat with shelters and keep updates flowing.
          </p>
          <Link
            href="/"
            className="rounded-full px-[32px] py-[14px] text-white text-[15px] font-bold active:scale-95 transition-transform"
            style={{ background: "#cd8188", fontFamily: M }}
          >
            Find a companion
          </Link>
        </div>
      ) : (
        <div className="px-[16px] pt-[20px] space-y-[14px]">
          {pets.map((pet) => (
            <Link
              key={pet.id}
              href={`/dogs/${pet.id}`}
              className="block rounded-[18px] overflow-hidden active:scale-[0.99] transition-transform"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(101,88,79,0.10)" }}
            >
              <div className="flex items-center gap-[14px] p-[14px]">
                <div className="w-[72px] h-[72px] rounded-[14px] overflow-hidden flex-shrink-0 bg-[#d6c8ad]">
                  {pet.coverUrl ? (
                    <img src={pet.coverUrl} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[20px] font-bold text-[#65584f] truncate" style={{ fontFamily: M }}>{pet.name}</p>
                  {pet.breed && (
                    <p className="text-[13px] text-[#65584f]/65 truncate" style={{ fontFamily: M }}>{pet.breed}</p>
                  )}
                </div>
                <span className="text-[#cd8188] text-[24px] font-bold">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
