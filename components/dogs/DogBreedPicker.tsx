"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  buildBreedPickerOptions,
  normalizeBreedLabel,
  recordRecentBreedSelection,
} from "@/utils/dog-breeds";

const RECENT_BREEDS_KEY = "pawjai.admin.recentDogBreeds.v1";

function readRecentBreeds() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_BREEDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function saveRecentBreeds(values: string[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(RECENT_BREEDS_KEY, JSON.stringify(values));
  } catch {
    // Storage can be disabled or full; the picker still works without recents.
  }
}

export default function DogBreedPicker({
  buttonClassName,
  defaultValue,
  name = "breed",
  placeholder = "Choose breed",
}: {
  buttonClassName: string;
  defaultValue?: string | null;
  name?: string;
  placeholder?: string;
}) {
  const { t } = useLanguage();
  const [selectedBreed, setSelectedBreed] = useState(() => normalizeBreedLabel(defaultValue ?? ""));
  const [recentBreeds, setRecentBreeds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const selected = selectedBreed.split(" / ").filter(Boolean);

  useEffect(() => {
    setRecentBreeds(readRecentBreeds());
  }, []);

  useEffect(() => {
    setSelectedBreed(normalizeBreedLabel(defaultValue ?? ""));
  }, [defaultValue]);

  const options = useMemo(
    () => buildBreedPickerOptions({ recentBreeds }),
    [recentBreeds],
  );

  const chooseBreed = (breed: string) => {
    const label = normalizeBreedLabel(breed);
    setSelectedBreed((current) => {
      const values = current.split(" / ").filter(Boolean);
      return (values.includes(label) ? values.filter((value) => value !== label) : [...values, label]).join(" / ");
    });
    if (!label) return;

    const nextRecentBreeds = recordRecentBreedSelection(label, recentBreeds);
    setRecentBreeds(nextRecentBreeds);
    saveRecentBreeds(nextRecentBreeds);
  };

  return (
    <details className="relative">
      <input type="hidden" name={name} value={selectedBreed} />
      <summary className={`${buttonClassName} flex cursor-pointer list-none items-center justify-between gap-2`}>
        <span className="min-w-0 break-words">{selected.length ? selected.map((breed) => t(breed)).join(" / ") : t(placeholder)}</span>
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
      </summary>
      <div className="mt-2 rounded-lg border border-[#d6c8ad] bg-white p-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4" aria-hidden="true" />
          <input aria-label={t("Search breeds")} placeholder={t("Search breeds")} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} className="w-full rounded-lg border border-[#d6c8ad] py-2 pl-9 pr-3 text-sm" />
        </div>
        <div className="mt-2 max-h-60 overflow-y-auto">
          {options.filter((breed) => `${breed} ${t(breed)}`.toLowerCase().includes(search.toLowerCase())).map((breed) => (
            <label key={breed} className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-2 py-2 text-sm hover:bg-[#f8e8ea]">
              <input type="checkbox" checked={selected.includes(breed)} onChange={() => chooseBreed(breed)} className="h-4 w-4 accent-[#cd8188]" />
              {t(breed)}
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}
