"use client";

import { ChevronDown } from "lucide-react";
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

  useEffect(() => {
    setRecentBreeds(readRecentBreeds());
  }, []);

  useEffect(() => {
    setSelectedBreed(normalizeBreedLabel(defaultValue ?? ""));
  }, [defaultValue]);

  const options = useMemo(
    () => buildBreedPickerOptions({ currentBreed: selectedBreed, recentBreeds }),
    [recentBreeds, selectedBreed],
  );

  const chooseBreed = (breed: string) => {
    const label = normalizeBreedLabel(breed);
    setSelectedBreed(label);
    if (!label) return;

    const nextRecentBreeds = recordRecentBreedSelection(label, recentBreeds);
    setRecentBreeds(nextRecentBreeds);
    saveRecentBreeds(nextRecentBreeds);
  };

  return (
    <div className="relative">
      <select
        name={name}
        className={`${buttonClassName} appearance-none pr-11`}
        value={selectedBreed}
        onChange={(event) => chooseBreed(event.target.value)}
      >
        <option value="" disabled>
          {t(placeholder)}
        </option>
        {options.map((breed) => (
          <option key={breed} value={breed}>
            {t(breed)}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8b7d]"
        aria-hidden="true"
      />
    </div>
  );
}
