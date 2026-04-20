import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import ImageWithFallback from "@/components/ImageWithFallback";
import type { DogPhoto } from "@/types/database";

function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: "gray" | "green" | "amber" | "blue" | "red" }) {
  const colors = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  };
  return <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${colors[color]}`}>{children}</span>;
}

function StarRating({ value }: { value: number | null }) {
  if (!value) return <span className="text-gray-400 text-sm">No rating</span>;
  return (
    <span className="text-sm text-gray-700">
      {"★".repeat(value)}{"☆".repeat(5 - value)}
      <span className="ml-1 text-gray-500">({value}/5)</span>
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

export default async function DogProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dog } = await supabase
    .from("dogs")
    .select("*")
    .eq("id", id)
    .single();

  if (!dog) notFound();

  const [{ data: photosData }, { data: shelter }] = await Promise.all([
    supabase
      .from("dog_photos")
      .select("*")
      .eq("dog_id", id)
      .order("sort_order"),
    supabase
      .from("shelters")
      .select("name, hygiene_rating, professionalism_rating, province, district, phone_number, facebook_url")
      .eq("id", dog.shelter_id)
      .single(),
  ]);

  const photos: DogPhoto[] = photosData ?? [];
  const cover = photos.find((p) => p.is_cover) ?? photos[0] ?? null;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10">
      {/* Back */}
      <div className="py-4">
        <Link href="/dogs" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Back to dogs
        </Link>
      </div>

      {/* Cover photo */}
      <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden bg-amber-50">
        <ImageWithFallback
          src={cover?.public_url}
          alt={dog.name}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Photo strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {photos.map((p) => (
            <div key={p.id} className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-amber-50">
              <ImageWithFallback src={p.public_url} alt={dog.name} width={80} height={80} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Main info */}
      <div className="mt-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{dog.name}</h1>
          <Badge color={dog.adoption_status === "available" ? "green" : "gray"}>
            {dog.adoption_status.charAt(0).toUpperCase() + dog.adoption_status.slice(1)}
          </Badge>
        </div>
        <p className="text-gray-500 mt-1">{dog.breed ?? "Mixed breed"}</p>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Age", value: ageLabel(dog.age_months) },
            { label: "Gender", value: dog.gender === "unknown" ? "Unknown" : dog.gender === "male" ? "Male" : "Female" },
            { label: "Size", value: dog.size ? dog.size.replace("_", " ") : "Unknown" },
            { label: "Weight", value: dog.weight_kg ? `${dog.weight_kg} kg` : "Unknown" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="font-semibold text-gray-900 mt-0.5 capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* Traits */}
        <div className="mt-6 flex flex-wrap gap-2">
          {dog.sterilized && <Badge color="green">Sterilized</Badge>}
          {dog.energy_level && (
            <Badge color={dog.energy_level === "low" ? "blue" : dog.energy_level === "high" ? "red" : "amber"}>
              {dog.energy_level.charAt(0).toUpperCase() + dog.energy_level.slice(1)} energy
            </Badge>
          )}
          {dog.good_with_kids && <Badge color="green">Good with kids</Badge>}
          {dog.good_with_dogs && <Badge color="green">Good with dogs</Badge>}
          {dog.good_with_cats && <Badge color="green">Good with cats</Badge>}
          {dog.house_trained && <Badge color="green">House trained</Badge>}
          {dog.leash_trained && <Badge color="green">Leash trained</Badge>}
          {dog.human_friendly && <Badge color="green">Human friendly</Badge>}
          {dog.special_needs && <Badge color="amber">Special needs</Badge>}
        </div>

        {/* Background */}
        {dog.background && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About {dog.name}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{dog.background}</p>
          </div>
        )}

        {/* Special needs detail */}
        {dog.special_needs && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">Special needs</p>
            <p className="text-sm text-amber-700">{dog.special_needs}</p>
          </div>
        )}

        {/* Shelter */}
        {shelter && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Shelter</h2>
            <p className="font-medium text-gray-800">{shelter.name}</p>
            {(shelter.district || shelter.province) && (
              <p className="text-sm text-gray-500 mt-0.5">
                {[shelter.district, shelter.province].filter(Boolean).join(", ")}
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hygiene</p>
                <StarRating value={shelter.hygiene_rating} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Professionalism</p>
                <StarRating value={shelter.professionalism_rating} />
              </div>
            </div>
            {shelter.phone_number && (
              <p className="text-sm text-gray-500 mt-3">📞 {shelter.phone_number}</p>
            )}
            {shelter.facebook_url && (
              <a href={shelter.facebook_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                Facebook page
              </a>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8">
          <button
            disabled
            className="w-full bg-amber-500 text-white font-semibold py-4 rounded-2xl opacity-60 cursor-not-allowed"
          >
            Apply to Adopt — Sign in to continue
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">Authentication coming soon</p>
        </div>
      </div>
    </div>
  );
}
