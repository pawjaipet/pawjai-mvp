import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DogCard from "@/components/DogCard";
import type { DogWithCover } from "@/types/database";

async function getFeaturedDogs(): Promise<DogWithCover[]> {
  const supabase = await createClient();
  const { data: dogRows } = await supabase
    .from("dogs")
    .select("*")
    .eq("adoption_status", "available")
    .order("created_at", { ascending: false })
    .limit(4);

  if (!dogRows || dogRows.length === 0) return [];

  const ids = dogRows.map((d) => d.id);
  const { data: photos } = await supabase
    .from("dog_photos")
    .select("dog_id, public_url")
    .in("dog_id", ids)
    .eq("is_cover", true);

  const coverMap = new Map((photos ?? []).map((p) => [p.dog_id, p.public_url]));
  return dogRows.map((d) => ({ ...d, cover_photo: coverMap.get(d.id) ?? null }));
}

export default async function HomePage() {
  const featured = await getFeaturedDogs();

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Header */}
      <header className="flex items-center justify-between py-5">
        <span className="text-2xl font-bold text-amber-600">PawJai</span>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
          <Link href="/dogs" className="hover:text-amber-600 transition-colors">Browse Dogs</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white px-8 py-14 mt-2 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase opacity-80 mb-3">Find your perfect companion</p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
          Every dog deserves<br />a loving home
        </h1>
        <p className="text-base md:text-lg opacity-90 mb-8 max-w-lg mx-auto">
          Browse hundreds of dogs across Thailand's shelters and find the one that matches your lifestyle.
        </p>
        <Link
          href="/dogs"
          className="inline-block bg-white text-amber-600 font-semibold px-8 py-3 rounded-full shadow hover:shadow-md transition-shadow"
        >
          Browse dogs
        </Link>
      </section>

      {/* Featured dogs */}
      {featured.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Recently added</h2>
            <Link href="/dogs" className="text-sm text-amber-600 font-medium hover:underline">See all</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((dog) => <DogCard key={dog.id} dog={dog} />)}
          </div>
        </section>
      )}

      {featured.length === 0 && (
        <section className="mt-12 text-center py-16">
          <p className="text-5xl mb-4">🐾</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No dogs listed yet</h2>
          <p className="text-gray-500 text-sm">Shelters are getting ready — check back soon!</p>
        </section>
      )}

      {/* Stats strip */}
      <section className="mt-12 mb-8 grid grid-cols-3 gap-4 text-center">
        {[
          { value: "100+", label: "Dogs waiting" },
          { value: "20+", label: "Partner shelters" },
          { value: "Free", label: "Always free" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
