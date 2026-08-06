"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSavedFilterPreferences, saveFilterPreferences } from "@/app/actions/preferences";
import ClientAuthGate from "@/components/auth/ClientAuthGate";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { translateAgeLabel, translateDogValue } from "@/components/i18n/translations";
import { DOG_FILTER_BREED_OPTIONS } from "@/utils/dog-breeds";
import { createClient } from "@/utils/supabase/client";

// Questions matching Figma FilterPage.tsx exactly
const questions = [
  {
    id: 1,
    question: "What size of pet do you prefer?",
    subtitle: "You can choose more than one",
    type: "cards" as const,
    multiSelect: true,
    options: [
      { label: "Small", description: "eg. Chihuahua, Pug" },
      { label: "Medium", description: "eg. Beagle, Thai Bangkaew, Bull Terrier" },
      { label: "Large", description: "eg. Labrador, Husky, Golden Retriever" },
    ],
  },
  {
    id: 2,
    question: "What about their age?",
    subtitle: "Please state their range of age",
    type: "slider" as const,
    multiSelect: false,
    options: [],
  },
  {
    id: 3,
    question: "What about their breed?",
    subtitle: "You can choose more than one",
    type: "bubbles" as const,
    multiSelect: true,
    options: DOG_FILTER_BREED_OPTIONS.map((label) => ({ label })),
  },
  {
    id: 4,
    question: "How active do you want your dog to be?",
    subtitle: "You can choose multiple",
    type: "cards" as const,
    multiSelect: true,
    options: [
      { label: "Low", description: "Relaxed, calm companion" },
      { label: "Medium", description: "Daily walks and light play" },
      { label: "High", description: "Need a lot of activities" },
    ],
  },
  {
    id: 5,
    question: "What about their protectiveness?",
    subtitle: "You can choose multiple",
    type: "cards" as const,
    multiSelect: true,
    options: [
      { label: "Very chill - not reactive", description: "Rarely barks or reacts to disturbance" },
      { label: "Barks to alert, but not aggressive", description: "Will bark to alert you, but friendly" },
      { label: "Highly protective", description: "Very protective of home and family" },
    ],
  },
  {
    id: 6,
    question: "How would you like the dog to show affection?",
    subtitle: "You can choose multiple",
    type: "cards" as const,
    multiSelect: true,
    options: [
      { label: "Very cuddly and affectionate", description: "Loves to be close and seeks attention often" },
      { label: "Subtle", description: "Express love in gentle, quiet ways" },
      { label: "Independent", description: "Enjoys independence but loyal" },
    ],
  },
  {
    id: 7,
    question: "Do you want trained dogs?",
    subtitle: "Select one",
    type: "cards" as const,
    multiSelect: false,
    options: [
      { label: "Well-trained dogs only" },
      { label: "Dogs still in training" },
      { label: "Willing to train from scratch" },
    ],
  },
  {
    id: 8,
    question: "Friendliness to people?",
    subtitle: "Choose one",
    type: "cards" as const,
    multiSelect: false,
    options: [
      { label: "Comfortable being petted by strangers" },
      { label: "Takes time to get to know new people" },
      { label: "Only stick to their owner" },
    ],
  },
  {
    id: 9,
    question: "Friendliness to other dogs?",
    subtitle: "Choose one",
    type: "cards" as const,
    multiSelect: false,
    options: [
      { label: "Friendly and playful" },
      { label: "Okay with other dogs but not too social" },
      { label: "Prefer to be solo" },
    ],
  },
  {
    id: 10,
    question: "Friendliness to cats?",
    subtitle: "Choose one",
    type: "cards" as const,
    multiSelect: false,
    options: [
      { label: "Cat-friendly" },
      { label: "Not sure / No" },
    ],
  },
  {
    id: 11,
    question: "Friendliness to kids (under 4)?",
    subtitle: "Choose one",
    type: "cards" as const,
    multiSelect: false,
    options: [
      { label: "Kid-friendly" },
      { label: "Not sure / No" },
    ],
  },
  {
    id: 12,
    question: "Any special needs you're willing to accommodate?",
    subtitle: "You can choose multiple",
    type: "bubbles" as const,
    multiSelect: true,
    options: [
      { label: "Medical conditions" },
      { label: "Behavioral challenges" },
      { label: "Special diet requirements" },
      { label: "No special needs preferred" },
    ],
  },
];

// localStorage keeps in-progress wizard state responsive; signed-in saves are
// also persisted to adopter_preferences by the server action.
const LS_KEY = "pawjai.filter.v1";
type PersistedFilter = {
  answers: Record<number, string[]>;
  ageRange: [number, number];
};

function loadFromLocal(): PersistedFilter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedFilter;
    if (parsed && typeof parsed === "object" && parsed.answers) return parsed;
  } catch {
    // ignore corrupt JSON
  }
  return null;
}

function saveToLocal(answers: Record<number, string[]>, ageRange: [number, number]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify({ answers, ageRange }));
  } catch {
    // quota exceeded or storage disabled — ignore
  }
}

function parseAgeAnswer(label: string | undefined): [number, number] | null {
  if (!label) return null;
  const plusMatch = label.match(/^(\d+)\+\s+Years?$/);
  if (plusMatch) return [Number(plusMatch[1]), 7];
  const rangeMatch = label.match(/^(\d+)-(\d+)\s+Years?$/);
  if (rangeMatch) return [Number(rangeMatch[1]), Number(rangeMatch[2])];
  const singleMatch = label.match(/^(\d+)\s+Years?$/);
  if (singleMatch) {
    const year = Number(singleMatch[1]);
    return [year, year];
  }
  return null;
}

function clearLocal() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

export default function FilterPage() {
  const router = useRouter();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string[]>>({});
  const [ageRange, setAgeRange] = useState<[number, number]>([2, 4]);
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const [hasLoadedInitialPreferences, setHasLoadedInitialPreferences] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  // Load from localStorage immediately on mount so breed + special needs + age
  // (none of which the server persists yet) survive a revisit.
  useEffect(() => {
    const local = loadFromLocal();
    if (local) {
      setSelectedAnswers((current) => ({ ...current, ...local.answers }));
      if (Array.isArray(local.ageRange) && local.ageRange.length === 2) {
        setAgeRange(local.ageRange);
      }
    }
    setHasLoadedInitialPreferences(true);
  }, []);

  // Persist to localStorage whenever selections change (no Save & Finish needed
  // for in-progress wizard state — covers tab close mid-flow).
  useEffect(() => {
    if (!hasLoadedInitialPreferences) return;
    saveToLocal(selectedAnswers, ageRange);
  }, [hasLoadedInitialPreferences, selectedAnswers, ageRange]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadSavedPreferences() {
      const saved = await getSavedFilterPreferences();
      if (!active || !saved) return;
      setSelectedAnswers((current) => ({ ...current, ...saved }));
      const savedAgeRange = parseAgeAnswer(saved[1]?.[0]);
      if (savedAgeRange) setAgeRange(savedAgeRange);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) void loadSavedPreferences();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void loadSavedPreferences();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Drag events for age slider
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const value = Math.round(percent * 7);
      if (isDragging === "min") setAgeRange([Math.min(value, ageRange[1]), ageRange[1]]);
      else setAgeRange([ageRange[0], Math.max(value, ageRange[0])]);
    };
    const handleUp = () => setIsDragging(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, ageRange]);

  const toggleOptionFor = (qIdx: number, option: string) => {
    const q = questions[qIdx];
    if (!q) return;
    const current = selectedAnswers[qIdx] ?? [];
    if (q.multiSelect) {
      setSelectedAnswers({
        ...selectedAnswers,
        [qIdx]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      });
    } else {
      setSelectedAnswers({
        ...selectedAnswers,
        [qIdx]: current.includes(option) ? [] : [option],
      });
    }
  };

  const resetFilter = () => {
    clearLocal();
    setSelectedAnswers({});
    setAgeRange([2, 4]);
  };

  const finishAndSave = () => {
    // Map question indices to backend-supported preference fields.
    const sizeQ = selectedAnswers[0] ?? [];         // Q0: size cards
    const energyQ = selectedAnswers[3] ?? [];        // Q3: activity cards
    const kidsQ = selectedAnswers[10] ?? [];         // Q10: kids
    const dogsQ = selectedAnswers[8] ?? [];          // Q8: other dogs
    const catsQ = selectedAnswers[9] ?? [];          // Q9: cats

    // Ensure all 12 answers are persisted locally before navigation.
    saveToLocal(selectedAnswers, ageRange);

    startTransition(async () => {
      await saveFilterPreferences({
        ageRange,
        fullAnswers: selectedAnswers,
        sizes: sizeQ,
        energyLevels: energyQ,
        goodWithKids: kidsQ.includes("Kid-friendly") ? true : kidsQ.length > 0 ? false : null,
        goodWithDogs: dogsQ.includes("Friendly and playful") ? true : dogsQ.length > 0 ? false : null,
        goodWithCats: catsQ.includes("Cat-friendly") ? true : catsQ.length > 0 ? false : null,
        questionLabels: Object.fromEntries(questions.map((question, index) => [index, question.question])),
      });
      router.push("/");
    });
  };

  const getAgeLabel = (min: number, max: number) => {
    const fmt = (v: number) => (v === 0 ? "0 Year" : v >= 7 ? "7+ Years" : `${v} Year${v === 1 ? "" : "s"}`);
    return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  };

  return (
    <ClientAuthGate
      nextPath="/filter"
      reason="Sign in to save your matching preferences."
    >
      <ScrollFilter
        answers={selectedAnswers}
        ageRange={ageRange}
        onToggle={toggleOptionFor}
        onAgeChange={setAgeRange}
        sliderRef={sliderRef}
        setIsDragging={setIsDragging}
        onShowDogs={finishAndSave}
        onReset={resetFilter}
        getAgeLabel={getAgeLabel}
      />
    </ClientAuthGate>
  );
}

const M = "Montserrat, sans-serif";

interface ScrollFilterProps {
  answers: Record<number, string[]>;
  ageRange: [number, number];
  onToggle: (qIdx: number, option: string) => void;
  onAgeChange: (next: [number, number]) => void;
  sliderRef: React.RefObject<HTMLDivElement | null>;
  setIsDragging: (d: "min" | "max" | null) => void;
  onShowDogs: () => void;
  onReset: () => void;
  getAgeLabel: (min: number, max: number) => string;
}

function ScrollFilter({
  answers,
  ageRange,
  onToggle,
  onAgeChange,
  sliderRef,
  setIsDragging,
  onShowDogs,
  onReset,
  getAgeLabel,
}: ScrollFilterProps) {
  const minPercent = (ageRange[0] / 7) * 100;
  const maxPercent = (ageRange[1] / 7) * 100;
  const { language, t } = useLanguage();

  return (
    <div
      className="flex flex-col"
      style={{
        width: "402px",
        maxWidth: "100vw",
        margin: "0 auto",
        minHeight: "100dvh",
        background: "#F5F1E8",
        fontFamily: M,
      }}
    >
      {/* Sticky top bar — title + Reset */}
      <div
        className="sticky top-0 z-20 px-[20px] py-[14px] flex items-center justify-between"
        style={{ background: "rgba(245,241,232,0.96)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(101,88,79,0.08)" }}
      >
        <h1 className="text-[18px] font-bold text-[#65584f]" style={{ fontFamily: M }}>{t("Filter")}</h1>
        <div className="flex items-center gap-[8px]">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={onReset}
            className="rounded-full px-[14px] py-[6px] text-[12px] font-semibold border active:scale-95 transition-transform"
            style={{ borderColor: "rgba(101,88,79,0.25)", color: "#65584f", background: "white", fontFamily: M }}
          >
            {t("Reset")}
          </button>
        </div>
      </div>

      {/* Stacked questions */}
      <div className="px-[20px] pt-[18px]" style={{ paddingBottom: "150px" }}>
        {questions.map((q, qIdx) => {
          const selections = answers[qIdx] ?? [];
          return (
            <section key={q.id} className="mb-[28px]">
              <h2 className="text-[16px] font-bold text-[#65584f] mb-[4px]" style={{ fontFamily: M }}>
                {t(q.question)}
              </h2>
              <p className="text-[11px] mb-[12px]" style={{ color: "rgba(101,88,79,0.6)", fontFamily: M }}>
                {t(q.subtitle)}
              </p>

              {q.type === "cards" && (
                <div className="space-y-[8px]">
                  {q.options.map((option, i) => {
                    const selected = selections.includes(option.label);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onToggle(qIdx, option.label)}
                        className="w-full rounded-[12px] px-[16px] py-[12px] text-left border-2 transition-all active:scale-[0.98]"
                        style={{
                          background: selected ? "#cd8188" : "white",
                          borderColor: selected ? "#cd8188" : "rgba(101,88,79,0.15)",
                        }}
                      >
                        <p className="font-semibold text-[14px]" style={{ color: selected ? "white" : "#65584f", fontFamily: M }}>
                          {translateDogValue(option.label, language)}
                        </p>
                        {"description" in option && option.description && (
                          <p className="text-[12px] mt-[2px]" style={{ color: selected ? "rgba(255,255,255,0.8)" : "rgba(101,88,79,0.55)", fontFamily: M }}>
                            {t(option.description)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "slider" && (
                <div className="pt-[8px] pb-[4px]">
                  <p className="text-center font-semibold text-[20px] mb-[18px]" style={{ color: "#cd8188", fontFamily: M }}>
                    {translateAgeLabel(getAgeLabel(ageRange[0], ageRange[1]), language)}
                  </p>
                  <div
                    ref={sliderRef}
                    className="relative w-full h-[10px] rounded-[10px] cursor-pointer"
                    style={{ background: "rgba(214,200,173,0.6)" }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const val = Math.round(((e.clientX - rect.left) / rect.width) * 7);
                      const dMin = Math.abs(val - ageRange[0]);
                      const dMax = Math.abs(val - ageRange[1]);
                      if (dMin <= dMax) onAgeChange([Math.min(val, ageRange[1]), ageRange[1]]);
                      else onAgeChange([ageRange[0], Math.max(val, ageRange[0])]);
                    }}
                  >
                    <div className="absolute h-[10px] rounded-[10px] top-0" style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%`, background: "#cd8188" }} />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full shadow-lg border-[3px] border-white cursor-grab active:cursor-grabbing"
                      style={{ left: `calc(${minPercent}% - 12px)`, background: "#cd8188" }}
                      onMouseDown={(e) => { e.preventDefault(); setIsDragging("min"); }}
                      onTouchStart={() => setIsDragging("min")}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full shadow-lg border-[3px] border-white cursor-grab active:cursor-grabbing"
                      style={{ left: `calc(${maxPercent}% - 12px)`, background: "#cd8188" }}
                      onMouseDown={(e) => { e.preventDefault(); setIsDragging("max"); }}
                      onTouchStart={() => setIsDragging("max")}
                    />
                  </div>
                  <div className="flex justify-between mt-[12px]">
                    {["0Y", "1", "2", "3", "4", "5", "6", "7+Y"].map((l) => (
                      <p key={l} className="text-[10px]" style={{ color: "#65584f" }}>{l}</p>
                    ))}
                  </div>
                </div>
              )}

              {q.type === "bubbles" && (
                <div className="flex flex-wrap gap-[8px]">
                  {q.options.map((option, i) => {
                    const selected = selections.includes(option.label);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onToggle(qIdx, option.label)}
                        className="rounded-full px-[14px] py-[7px] border active:scale-95 transition-all"
                        style={{
                          background: selected ? "#cd8188" : "white",
                          borderColor: selected ? "#cd8188" : "rgba(101,88,79,0.4)",
                          borderWidth: selected ? 2 : 1,
                        }}
                      >
                        <p className="text-[13px] whitespace-nowrap" style={{ color: selected ? "white" : "#65584f", fontFamily: M }}>
                          {translateDogValue(option.label, language)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Sticky Show Dogs bottom (above bottom nav) */}
      <div
        className="fixed bottom-[70px] pt-[18px] pb-[16px] px-[20px]"
        style={{
          width: "402px",
          maxWidth: "100vw",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(to top, #F5F1E8 0%, #F5F1E8 65%, rgba(245,241,232,0) 100%)",
          pointerEvents: "none",
        }}
      >
        <button
          type="button"
          onClick={onShowDogs}
          className="w-full h-[52px] rounded-[12px] flex items-center justify-center gap-[8px] text-[15px] font-bold transition-all active:scale-[0.98]"
          style={{ background: "#65584f", color: "white", pointerEvents: "auto", fontFamily: M }}
        >
          {t("Show Dogs")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
