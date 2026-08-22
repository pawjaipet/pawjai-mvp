"use client";

import { Check, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  dedupePersonalityTags,
  mergePersonalityTags,
  normalizePersonalityTag,
  personalityTagKey,
} from "@/utils/personality-tags";

export default function PersonalityTagPicker({
  name = "personality_tag",
  options,
  selected = [],
}: {
  name?: string;
  options: string[];
  selected?: string[];
}) {
  const initialOptions = useMemo(() => mergePersonalityTags([...options, ...selected]), [options, selected]);
  const [addedTags, setAddedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState(() => dedupePersonalityTags(selected));
  const [query, setQuery] = useState("");
  const allOptions = useMemo(() => mergePersonalityTags([...initialOptions, ...addedTags]), [addedTags, initialOptions]);
  const selectedKeys = useMemo(() => new Set(selectedTags.map(personalityTagKey)), [selectedTags]);
  const normalizedQuery = normalizePersonalityTag(query);
  const queryKey = personalityTagKey(normalizedQuery);
  const exactMatch = allOptions.find((tag) => personalityTagKey(tag) === queryKey);
  const visibleOptions = allOptions.filter((tag) => (
    !normalizedQuery || personalityTagKey(tag).includes(queryKey)
  ));

  function toggleTag(tag: string) {
    const key = personalityTagKey(tag);
    setSelectedTags((current) => (
      current.some((item) => personalityTagKey(item) === key)
        ? current.filter((item) => personalityTagKey(item) !== key)
        : [...current, tag]
    ));
  }

  function addOrSelectQuery() {
    if (!normalizedQuery) return;

    const canonicalTag = exactMatch ?? normalizedQuery;
    if (!exactMatch) {
      setAddedTags((current) => dedupePersonalityTags([...current, canonicalTag]));
    }
    setSelectedTags((current) => dedupePersonalityTags([...current, canonicalTag]));
    setQuery("");
  }

  return (
    <div className="space-y-4">
      {selectedTags.map((tag) => (
        <input key={personalityTagKey(tag)} name={name} type="hidden" value={tag} />
      ))}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search or add a personality tag</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7d70]" />
          <input
            className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] py-3 pl-11 pr-4 text-sm text-[#65584f] outline-none transition placeholder:text-[#9b8d80] focus:border-[#cd8188] focus:ring-4 focus:ring-[#f3cbd0]/60"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              addOrSelectQuery();
            }}
            placeholder="Search tags or type a new one"
            type="search"
            value={query}
          />
        </label>
        {normalizedQuery ? (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#cd8188] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b87179]"
            onClick={addOrSelectQuery}
            type="button"
          >
            {exactMatch && selectedKeys.has(personalityTagKey(exactMatch)) ? <Check size={16} /> : <Plus size={16} />}
            {exactMatch
              ? selectedKeys.has(personalityTagKey(exactMatch)) ? `${exactMatch} selected` : `Select ${exactMatch}`
              : `Add ${normalizedQuery}`}
          </button>
        ) : null}
      </div>

      {normalizedQuery && exactMatch ? (
        <p className="text-xs font-medium text-[#8c6a45]">
          {`“${normalizedQuery}” already exists as “${exactMatch}”. Selecting it will reuse the existing tag.`}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((option) => {
          const active = selectedKeys.has(personalityTagKey(option));
          return (
            <button
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f3cbd0] ${
                active
                  ? "border-[#cd8188] bg-[#d6c8ad] text-[#65584f]"
                  : "border-[#d6c8ad] bg-white text-[#65584f] hover:border-[#cd8188] hover:bg-[#f8e8ea]"
              }`}
              key={personalityTagKey(option)}
              onClick={() => toggleTag(option)}
              type="button"
            >
              {active ? <Check size={14} /> : null}
              {option}
            </button>
          );
        })}
      </div>

      {normalizedQuery && visibleOptions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f]">
          {`No existing tag matches. Press Enter or Add to create “${normalizedQuery}”.`}
        </p>
      ) : null}
    </div>
  );
}
