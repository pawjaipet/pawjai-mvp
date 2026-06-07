"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSavedFilterPreferences, saveFilterPreferences } from "@/app/actions/preferences";
import ClientAuthGate from "@/components/auth/ClientAuthGate";
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
    options: [
      { label: "All Breeds" },
      { label: "Thai Bangkaew" },
      { label: "Golden Retriever" },
      { label: "Mixed Breed" },
      { label: "Thai Ridgeback" },
      { label: "German Shepherd" },
      { label: "Thai Dog" },
      { label: "Labrador Retriever" },
      { label: "French Bulldog" },
      { label: "Poodle" },
      { label: "Chihuahua" },
      { label: "Siberian Husky" },
      { label: "Shih Tzu" },
      { label: "Pug" },
      { label: "Rottweiler" },
      { label: "Beagle" },
      { label: "Dachshund" },
      { label: "Yorkshire Terrier" },
      { label: "Boxer" },
      { label: "Pomeranian" },
      { label: "Australian Shepherd" },
      { label: "Great Dane" },
      { label: "Doberman Pinscher" },
      { label: "Pembroke Welsh Corgi" },
      { label: "Miniature Schnauzer" },
      { label: "Shiba Inu" },
      { label: "Boston Terrier" },
      { label: "Border Collie" },
      { label: "Bulldog" },
      { label: "Akita" },
      { label: "Cavalier King Charles Spaniel" },
      { label: "Havanese" },
      { label: "Shetland Sheepdog" },
      { label: "Bernese Mountain Dog" },
      { label: "English Springer Spaniel" },
      { label: "Brittany" },
      { label: "Cocker Spaniel" },
      { label: "Mastiff" },
      { label: "Cane Corso" },
      { label: "West Highland White Terrier" },
      { label: "Basset Hound" },
      { label: "Vizsla" },
      { label: "Newfoundland" },
      { label: "Rhodesian Ridgeback" },
      { label: "Belgian Malinois" },
      { label: "Bloodhound" },
      { label: "Bull Terrier" },
      { label: "Chesapeake Bay Retriever" },
      { label: "Weimaraner" },
      { label: "Collie" },
      { label: "Saint Bernard" },
      { label: "Whippet" },
    ],
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
  // After first Show Dogs press, switch wizard to a single scrolling page so
  // repeat users can tune any field without re-walking the whole quiz.
  completed?: boolean;
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

function saveToLocal(
  answers: Record<number, string[]>,
  ageRange: [number, number],
  completed: boolean,
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify({ answers, ageRange, completed }));
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string[]>>({});
  const [ageRange, setAgeRange] = useState<[number, number]>([2, 4]);
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  // Render mode: "quiz" = one question at a time (first-time UX),
  // "scroll" = all questions on a single scrolling page (after completion).
  const [mode, setMode] = useState<"quiz" | "scroll">("quiz");

  // Load from localStorage immediately on mount so breed + special needs + age
  // (none of which the server persists yet) survive a revisit.
  useEffect(() => {
    const local = loadFromLocal();
    if (local) {
      setSelectedAnswers((current) => ({ ...current, ...local.answers }));
      if (Array.isArray(local.ageRange) && local.ageRange.length === 2) {
        setAgeRange(local.ageRange);
      }
      // If user completed quiz once before, drop them into the scrolling
      // all-on-one-page view immediately — less friction for tuning.
      if (local.completed) setMode("scroll");
    }
  }, []);

  // Persist to localStorage whenever selections change (no Save & Finish needed
  // for in-progress wizard state — covers tab close mid-flow).
  useEffect(() => {
    // Persist current draft. `completed` only flips true on Show Dogs press.
    const local = loadFromLocal();
    saveToLocal(selectedAnswers, ageRange, Boolean(local?.completed));
  }, [selectedAnswers, ageRange]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadSavedPreferences() {
      const saved = await getSavedFilterPreferences();
      if (!active || !saved) return;
      setSelectedAnswers((current) => ({ ...saved, ...current }));
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

  const currentQ = questions[currentQuestion];
  const currentSelections = selectedAnswers[currentQuestion] ?? [];
  const progressPercent = ((currentQuestion + 1) / questions.length) * 100;

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

  // Toggle an option for a given question index. Used by both quiz and scroll modes.
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

  const handleOptionClick = (option: string) => {
    toggleOptionFor(currentQuestion, option);
  };

  const resetFilter = () => {
    clearLocal();
    setSelectedAnswers({});
    setAgeRange([2, 4]);
    setCurrentQuestion(0);
    setMode("quiz");
  };

  const finishAndSave = () => {
    // Map question indices to backend-supported preference fields.
    const sizeQ = selectedAnswers[0] ?? [];         // Q0: size cards
    const energyQ = selectedAnswers[3] ?? [];        // Q3: activity cards
    const kidsQ = selectedAnswers[10] ?? [];         // Q10: kids
    const dogsQ = selectedAnswers[8] ?? [];          // Q8: other dogs
    const catsQ = selectedAnswers[9] ?? [];          // Q9: cats

    // Ensure all 12 answers are persisted locally before navigation.
    // Flip completed=true so next /filter visit lands in scroll-form mode.
    saveToLocal(selectedAnswers, ageRange, true);

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

  const handleContinue = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    else finishAndSave();
  };

  const handleBack = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
    else router.push("/");
  };

  const getAgeLabel = (min: number, max: number) => {
    const fmt = (v: number) => (v === 0 ? "0 Year" : v >= 7 ? "7+ Years" : `${v} Year${v === 1 ? "" : "s"}`);
    return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  };

  const minPercent = (ageRange[0] / 7) * 100;
  const maxPercent = (ageRange[1] / 7) * 100;

  if (!currentQ) return null;

  // ── Scroll mode: render all 12 questions on one page with sticky CTA ──
  if (mode === "scroll") {
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

  return (
    <ClientAuthGate
      nextPath="/filter"
      reason="Sign in to save your matching preferences."
    >
    <div
      className="flex flex-col"
      style={{
        width: "402px",
        maxWidth: "100vw",
        margin: "0 auto",
        minHeight: "100dvh",
        background: "#F5F1E8",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      {/* Progress bar */}
      <div className="w-full h-[4px] relative" style={{ background: "rgba(101,88,79,0.2)" }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progressPercent}%`, background: "#cd8188" }}
        />
      </div>

      {/* Progress % + reset header */}
      <div className="px-[24px] pt-[20px] pb-[16px] flex items-center justify-between">
        <button
          type="button"
          onClick={resetFilter}
          className="text-[11px] font-semibold text-[#65584f]/60 active:opacity-60"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Reset
        </button>
        <span className="text-[11px] text-[#cd8188] font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {Math.round(progressPercent)}%
        </span>
      </div>

      {/* Question header */}
      <div className="px-[24px] pb-[16px]">
        <h1 className="font-bold text-[20px] leading-[26px] mb-[6px] text-[#65584f]" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {currentQ.question}
        </h1>
        <p className="text-[12px] text-[rgba(101,88,79,0.6)]" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {currentQ.subtitle}
        </p>
      </div>

      {/* Options — scrollable */}
      <div
        className="flex-1 px-[24px] pt-[24px] overflow-y-auto"
        style={{ paddingBottom: "140px", scrollbarWidth: "none" }}
      >
        <style>{`.filter-scroll::-webkit-scrollbar{display:none}`}</style>

        {/* Large card options */}
        {currentQ.type === "cards" && (
          <div className="space-y-[12px]">
            {currentQ.options.map((option, i) => {
              const selected = currentSelections.includes(option.label);
              return (
                <button
                  key={i}
                  onClick={() => handleOptionClick(option.label)}
                  className="w-full rounded-[14px] px-[20px] py-[18px] text-left border-2 cursor-pointer transition-all active:scale-[0.98]"
                  style={{
                    background: selected ? "#cd8188" : "white",
                    borderColor: selected ? "#cd8188" : "rgba(101,88,79,0.15)",
                  }}
                >
                  <p
                    className="font-semibold text-[16px]"
                    style={{ color: selected ? "white" : "#65584f" }}
                  >
                    {option.label}
                  </p>
                  {"description" in option && option.description && (
                    <p
                      className="text-[13px] mt-[4px]"
                      style={{ color: selected ? "rgba(255,255,255,0.8)" : "rgba(101,88,79,0.55)" }}
                    >
                      {option.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Age slider */}
        {currentQ.type === "slider" && (
          <div className="pt-[24px]">
            <div className="text-center mb-[36px]">
              <p className="font-semibold text-[28px]" style={{ color: "#cd8188" }}>
                {getAgeLabel(ageRange[0], ageRange[1])}
              </p>
            </div>

            <div
              ref={sliderRef}
              className="relative w-full h-[12px] rounded-[10px] cursor-pointer"
              style={{ background: "rgba(214,200,173,0.6)" }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const val = Math.round(((e.clientX - rect.left) / rect.width) * 7);
                const dMin = Math.abs(val - ageRange[0]);
                const dMax = Math.abs(val - ageRange[1]);
                if (dMin <= dMax) setAgeRange([Math.min(val, ageRange[1]), ageRange[1]]);
                else setAgeRange([ageRange[0], Math.max(val, ageRange[0])]);
              }}
            >
              {/* Filled range */}
              <div
                className="absolute h-[12px] rounded-[10px] top-0"
                style={{
                  left: `${minPercent}%`,
                  width: `${maxPercent - minPercent}%`,
                  background: "#cd8188",
                }}
              />
              {/* Min handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-[24px] h-[24px] rounded-full cursor-grab active:cursor-grabbing shadow-lg border-[3px] border-white transition-transform hover:scale-110"
                style={{ left: `calc(${minPercent}% - 13px)`, background: "#cd8188" }}
                onMouseDown={(e) => { e.preventDefault(); setIsDragging("min"); }}
                onTouchStart={() => setIsDragging("min")}
              />
              {/* Max handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-[24px] h-[24px] rounded-full cursor-grab active:cursor-grabbing shadow-lg border-[3px] border-white transition-transform hover:scale-110"
                style={{ left: `calc(${maxPercent}% - 13px)`, background: "#cd8188" }}
                onMouseDown={(e) => { e.preventDefault(); setIsDragging("max"); }}
                onTouchStart={() => setIsDragging("max")}
              />
            </div>

            {/* Year labels */}
            <div className="flex justify-between mt-[16px]">
              {["0Y", "1", "2", "3", "4", "5", "6", "7+Y"].map((l) => (
                <p key={l} className="text-[11px]" style={{ color: "#65584f" }}>{l}</p>
              ))}
            </div>
          </div>
        )}

        {/* Bubble chips */}
        {currentQ.type === "bubbles" && (
          <div className="flex flex-wrap gap-[10px]">
            {currentQ.options.map((option, i) => {
              const selected = currentSelections.includes(option.label);
              return (
                <button
                  key={i}
                  onClick={() => handleOptionClick(option.label)}
                  className="rounded-full px-[18px] py-[9px] border cursor-pointer transition-all active:scale-95"
                  style={{
                    background: selected ? "#cd8188" : "white",
                    borderColor: selected ? "#cd8188" : "rgba(101,88,79,0.4)",
                    borderWidth: selected ? 2 : 1,
                  }}
                >
                  <p
                    className="text-[15px] whitespace-nowrap"
                    style={{ color: selected ? "white" : "#65584f" }}
                  >
                    {option.label}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Back + Continue — always visible above bottom nav */}
      <div
        className="fixed bottom-[70px] pt-[24px] pb-[16px] px-[24px] flex gap-[12px]"
        style={{
          width: "402px",
          maxWidth: "100vw",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(to top, #F5F1E8 0%, #F5F1E8 60%, rgba(245,241,232,0) 100%)",
          pointerEvents: "none",
        }}
      >
        {/* Back */}
        <button
          onClick={handleBack}
          className="shrink-0 w-[52px] h-[52px] rounded-[12px] flex items-center justify-center transition-all active:scale-95"
          style={{ border: "2px solid #cd8188", background: "transparent", pointerEvents: "auto" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#cd8188" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {/* Continue / Save */}
        <button
          onClick={handleContinue}
          className="flex-1 h-[52px] rounded-[12px] flex items-center justify-center gap-[8px] text-[15px] font-bold transition-all active:scale-[0.98]"
          style={{
            background: "#65584f",
            color: "white",
            pointerEvents: "auto",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          {currentQuestion === questions.length - 1 ? "Show Dogs" : "Continue"}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
    </ClientAuthGate>
  );
}

/* ── Scroll mode: all 12 questions on one page ─────────────────────────── */

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
        <h1 className="text-[18px] font-bold text-[#65584f]" style={{ fontFamily: M }}>Filter</h1>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full px-[14px] py-[6px] text-[12px] font-semibold border active:scale-95 transition-transform"
          style={{ borderColor: "rgba(101,88,79,0.25)", color: "#65584f", background: "white", fontFamily: M }}
        >
          Reset
        </button>
      </div>

      {/* Stacked questions */}
      <div className="px-[20px] pt-[18px]" style={{ paddingBottom: "150px" }}>
        {questions.map((q, qIdx) => {
          const selections = answers[qIdx] ?? [];
          return (
            <section key={q.id} className="mb-[28px]">
              <h2 className="text-[16px] font-bold text-[#65584f] mb-[4px]" style={{ fontFamily: M }}>
                {q.question}
              </h2>
              <p className="text-[11px] mb-[12px]" style={{ color: "rgba(101,88,79,0.6)", fontFamily: M }}>
                {q.subtitle}
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
                          {option.label}
                        </p>
                        {"description" in option && option.description && (
                          <p className="text-[12px] mt-[2px]" style={{ color: selected ? "rgba(255,255,255,0.8)" : "rgba(101,88,79,0.55)", fontFamily: M }}>
                            {option.description}
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
                    {getAgeLabel(ageRange[0], ageRange[1])}
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
                          {option.label}
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
          Show Dogs
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
