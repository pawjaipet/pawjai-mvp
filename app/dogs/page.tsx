"use client";

import { useState, useEffect, useCallback } from "react";
import DogCard from "@/components/DogCard";
import FilterPanel from "@/components/FilterPanel";
import { createClient } from "@/utils/supabase/client";
import type { DogWithCover, DogFilter } from "@/types/database";

const PAGE_SIZE = 12;

export default function DogsPage() {
  const [dogs, setDogs] = useState<DogWithCover[]>([]);
  const [filters, setFilters] = useState<DogFilter>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const supabase = createClient();

  const fetchDogs = useCallback(async (f: DogFilter, p: number, replace: boolean) => {
    setLoading(true);
    let q = supabase
      .from("dogs")
      .select("*")
      .eq("adoption_status", "available")
      .order("created_at", { ascending: false })
      .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1);

    if (f.gender) q = q.eq("gender", f.gender);
    if (f.size) q = q.eq("size", f.size);
    if (f.energy_level) q = q.eq("energy_level", f.energy_level);
    if (f.sterilized !== undefined) q = q.eq("sterilized", f.sterilized);
    if (f.good_with_kids !== undefined) q = q.eq("good_with_kids", f.good_with_kids);
    if (f.good_with_dogs !== undefined) q = q.eq("good_with_dogs", f.good_with_dogs);
    if (f.good_with_cats !== undefined) q = q.eq("good_with_cats", f.good_with_cats);

    const { data: dogRows } = await q;
    const dogs = dogRows ?? [];

    // Fetch cover photos for fetched dogs
    const ids = dogs.map((d) => d.id);
    const { data: photos } = ids.length
      ? await supabase.from("dog_photos").select("dog_id, public_url, is_cover").in("dog_id", ids).eq("is_cover", true)
      : { data: [] };

    const coverMap = new Map((photos ?? []).map((p) => [p.dog_id, p.public_url]));
    const rows: DogWithCover[] = dogs.map((d) => ({ ...d, cover_photo: coverMap.get(d.id) ?? null }));

    setHasMore(rows.length === PAGE_SIZE);
    setDogs((prev) => (replace ? rows : [...prev, ...rows]));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    setPage(0);
    fetchDogs(filters, 0, true);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchDogs(filters, next, false);
  }

  const activeCount = Object.values(filters).filter((v) => v !== undefined).length;

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Top bar */}
      <header className="flex items-center justify-between py-5">
        <h1 className="text-2xl font-bold text-gray-900">Find a dog</h1>
        <button
          onClick={() => setFilterOpen((o) => !o)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
            activeCount > 0
              ? "bg-amber-500 border-amber-500 text-white"
              : "bg-white border-gray-300 text-gray-700 hover:border-amber-400"
          }`}
        >
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="bg-white text-amber-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </header>

      <div className="flex gap-6">
        {/* Sidebar filter (desktop) */}
        <aside
          className={`hidden md:block shrink-0 w-64 bg-white rounded-2xl shadow-sm h-fit sticky top-6 transition-all ${
            filterOpen ? "block" : "hidden md:block"
          }`}
        >
          <FilterPanel filters={filters} onChange={(f) => setFilters(f)} />
        </aside>

        {/* Mobile filter sheet */}
        {filterOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
            <div className="relative bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
              <FilterPanel filters={filters} onChange={(f) => setFilters(f)} onClose={() => setFilterOpen(false)} />
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading && dogs.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : dogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-500">No dogs match your filters.</p>
              <button onClick={() => setFilters({})} className="mt-4 text-sm text-amber-600 font-medium hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {dogs.map((dog) => <DogCard key={dog.id} dog={dog} />)}
              </div>
              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-8 py-3 rounded-full bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-60 transition-colors"
                  >
                    {loading ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
