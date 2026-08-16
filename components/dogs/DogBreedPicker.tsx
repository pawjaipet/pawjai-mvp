"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

function includesSearch(label: string, searchTerm: string) {
  const query = searchTerm.trim().toLocaleLowerCase();
  if (!query) return true;
  return label.toLocaleLowerCase().includes(query);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBreed, setSelectedBreed] = useState(() => normalizeBreedLabel(defaultValue ?? ""));
  const [recentBreeds, setRecentBreeds] = useState<string[]>([]);

  useEffect(() => {
    setRecentBreeds(readRecentBreeds());
  }, []);

  useEffect(() => {
    setSelectedBreed(normalizeBreedLabel(defaultValue ?? ""));
  }, [defaultValue]);

  useEffect(() => {
    if (!isOpen) return;

    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const options = useMemo(
    () => buildBreedPickerOptions({ currentBreed: selectedBreed, recentBreeds }),
    [recentBreeds, selectedBreed],
  );

  const recentKeys = useMemo(
    () => new Set(recentBreeds.map((breed) => normalizeBreedLabel(breed).toLocaleLowerCase())),
    [recentBreeds],
  );
  const selectedKey = selectedBreed.toLocaleLowerCase();
  const filteredOptions = options.filter((option) => includesSearch(option, searchTerm));
  const recentOptions = filteredOptions.filter((option) => recentKeys.has(option.toLocaleLowerCase()));
  const remainingOptions = filteredOptions.filter((option) => !recentKeys.has(option.toLocaleLowerCase()));

  const chooseBreed = (breed: string) => {
    const label = normalizeBreedLabel(breed);
    setSelectedBreed(label);
    const nextRecentBreeds = recordRecentBreedSelection(label, recentBreeds);
    setRecentBreeds(nextRecentBreeds);
    saveRecentBreeds(nextRecentBreeds);
    setIsOpen(false);
    setSearchTerm("");
  };

  const optionButton = (breed: string) => {
    const isSelected = breed.toLocaleLowerCase() === selectedKey;

    return (
      <button
        key={breed}
        type="button"
        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
          isSelected
            ? "bg-[#f8e8ea] font-semibold text-[#65584f]"
            : "text-[#65584f] hover:bg-[#f5f1e8]"
        }`}
        onClick={() => chooseBreed(breed)}
      >
        <span>{breed}</span>
        {isSelected ? <Check className="h-4 w-4 shrink-0 text-[#cd8188]" aria-hidden="true" /> : null}
      </button>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name={name} value={selectedBreed} />
      <button
        type="button"
        className={`${buttonClassName} flex items-center justify-between gap-3 text-left`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className={selectedBreed ? "truncate" : "truncate text-[#a79a8e]"}>
          {selectedBreed || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#9a8b7d] transition ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-[#d6c8ad] bg-white shadow-[0_18px_48px_rgba(79,67,56,0.16)]">
          <div className="flex items-center gap-2 border-b border-[#efe4d5] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[#cd8188]" aria-hidden="true" />
            <input
              ref={searchInputRef}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#65584f] outline-none placeholder:text-[#b4a89e]"
              placeholder="Search breeds"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2" role="listbox">
            {recentOptions.length > 0 ? (
              <div className="mb-2">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cd8188]">
                  Recent
                </p>
                <div className="space-y-1">{recentOptions.map(optionButton)}</div>
              </div>
            ) : null}

            {remainingOptions.length > 0 ? (
              <div>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b8c7d]">
                  Breed list
                </p>
                <div className="space-y-1">{remainingOptions.map(optionButton)}</div>
              </div>
            ) : null}

            {filteredOptions.length === 0 ? (
              <p className="px-3 py-5 text-sm text-[#65584f]">
                No breed match yet. Choose the closest category, usually Mixed Breed or Thai Dog.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
