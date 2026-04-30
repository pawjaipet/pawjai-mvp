"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
    id: 6,
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
    id: 7,
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
    id: 8,
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
    id: 9,
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
    id: 10,
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

export default function FilterPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string[]>>({});
  const [ageRange, setAgeRange] = useState<[number, number]>([2, 4]);
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

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

  const handleOptionClick = (option: string) => {
    const current = selectedAnswers[currentQuestion] ?? [];
    if (currentQ.multiSelect) {
      setSelectedAnswers({
        ...selectedAnswers,
        [currentQuestion]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      });
    } else {
      setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: [option] });
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
        else router.push("/swipe");
      }, 350);
    }
  };

  const handleContinue = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    else router.push("/swipe");
  };

  const handleBack = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
    else router.push("/swipe");
  };

  const getAgeLabel = (min: number, max: number) => {
    const fmt = (v: number) => (v === 0 ? "0 Year" : v >= 7 ? "7+ Years" : `${v} Year${v === 1 ? "" : "s"}`);
    return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  };

  const minPercent = (ageRange[0] / 7) * 100;
  const maxPercent = (ageRange[1] / 7) * 100;

  if (!currentQ) return null;

  return (
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

      {/* Back button */}
      <div className="px-[24px] pt-[20px]">
        <button
          onClick={handleBack}
          className="flex items-center gap-[8px] bg-transparent border-0 p-0 cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="#65584f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Question header */}
      <div className="px-[24px] pt-[20px]">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-[8px]" style={{ color: "#cd8188" }}>
          {currentQuestion + 1} of {questions.length}
        </p>
        <h1 className="font-bold text-[22px] leading-[28px] mb-[6px]" style={{ color: "#65584f" }}>
          {currentQ.question}
        </h1>
        <p className="text-[13px]" style={{ color: "rgba(101,88,79,0.6)" }}>
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
                className="absolute top-1/2 -translate-y-1/2 w-[26px] h-[26px] rounded-full cursor-grab shadow-lg border-[3px] border-white transition-transform hover:scale-110"
                style={{ left: `calc(${minPercent}% - 13px)`, background: "#cd8188" }}
                onMouseDown={(e) => { e.preventDefault(); setIsDragging("min"); }}
                onTouchStart={() => setIsDragging("min")}
              />
              {/* Max handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-[26px] h-[26px] rounded-full cursor-grab shadow-lg border-[3px] border-white transition-transform hover:scale-110"
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

      {/* Continue button — fixed above bottom nav, only for multi-select & slider */}
      {(currentQ.multiSelect || currentQ.type === "slider") && (
        <div
          className="fixed max-w-[402px] w-full mx-auto px-[24px] pb-[100px] pt-[20px]"
          style={{
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(to top, #F5F1E8 70%, rgba(245,241,232,0) 100%)",
            pointerEvents: "none",
          }}
        >
          <button
            onClick={handleContinue}
            disabled={currentQ.multiSelect && currentSelections.length === 0}
            className="w-full rounded-[16px] py-[15px] font-semibold text-[16px] border-0 cursor-pointer transition-all"
            style={{
              background:
                !currentQ.multiSelect || currentSelections.length > 0
                  ? "#65584f"
                  : "rgba(101,88,79,0.25)",
              color:
                !currentQ.multiSelect || currentSelections.length > 0
                  ? "white"
                  : "rgba(101,88,79,0.4)",
              pointerEvents: "auto",
            }}
          >
            {currentQuestion === questions.length - 1 ? "Save & Finish" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
