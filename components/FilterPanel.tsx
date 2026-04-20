"use client";

import type { DogFilter } from "@/types/database";

interface Props {
  filters: DogFilter;
  onChange: (f: DogFilter) => void;
  onClose?: () => void;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
        active
          ? "bg-amber-500 border-amber-500 text-white"
          : "bg-white border-gray-300 text-gray-700 hover:border-amber-400"
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterPanel({ filters, onChange, onClose }: Props) {
  function toggle<K extends keyof DogFilter>(key: K, val: DogFilter[K]) {
    onChange({ ...filters, [key]: filters[key] === val ? undefined : val });
  }

  function reset() {
    onChange({});
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-lg">Filters</h2>
        <div className="flex gap-3">
          <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700">Reset</button>
          {onClose && (
            <button onClick={onClose} className="text-sm text-amber-600 font-medium">Done</button>
          )}
        </div>
      </div>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gender</h3>
        <div className="flex flex-wrap gap-2">
          {(["male", "female", "unknown"] as const).map((g) => (
            <Toggle key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} active={filters.gender === g} onClick={() => toggle("gender", g)} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Size</h3>
        <div className="flex flex-wrap gap-2">
          {(["small", "medium", "large", "extra_large"] as const).map((s) => (
            <Toggle key={s} label={s === "extra_large" ? "Extra Large" : s.charAt(0).toUpperCase() + s.slice(1)} active={filters.size === s} onClick={() => toggle("size", s)} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Energy Level</h3>
        <div className="flex flex-wrap gap-2">
          {(["low", "medium", "high"] as const).map((e) => (
            <Toggle key={e} label={e.charAt(0).toUpperCase() + e.slice(1)} active={filters.energy_level === e} onClick={() => toggle("energy_level", e)} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Good With</h3>
        <div className="flex flex-wrap gap-2">
          <Toggle label="Kids" active={filters.good_with_kids === true} onClick={() => toggle("good_with_kids", true)} />
          <Toggle label="Dogs" active={filters.good_with_dogs === true} onClick={() => toggle("good_with_dogs", true)} />
          <Toggle label="Cats" active={filters.good_with_cats === true} onClick={() => toggle("good_with_cats", true)} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Other</h3>
        <div className="flex flex-wrap gap-2">
          <Toggle label="Sterilized" active={filters.sterilized === true} onClick={() => toggle("sterilized", true)} />
        </div>
      </section>
    </div>
  );
}
