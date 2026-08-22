"use client";

import { createElement, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { translateText } from "@/components/i18n/translations";

type TagName = "span" | "p" | "h2";

type MachineTranslatedTextProps = {
  as?: TagName;
  className?: string;
  style?: CSSProperties;
  text: string | null | undefined;
};

const machineTranslationCache = new Map<string, string>();
const THAI_RE = /[\u0E00-\u0E7F]/;
const ENGLISH_RE = /[A-Za-z]/;

function shouldRequestMachineTranslation(text: string, targetLanguage: "en" | "th") {
  if (text.length < 2) return false;
  if (targetLanguage === "th") return ENGLISH_RE.test(text);
  return THAI_RE.test(text);
}

export default function MachineTranslatedText({
  as = "span",
  className,
  style,
  text,
}: MachineTranslatedTextProps) {
  const { language } = useLanguage();
  const sourceText = text?.trim() ?? "";
  const localTranslation = useMemo(() => translateText(sourceText, language), [language, sourceText]);
  const [machineTranslation, setMachineTranslation] = useState("");

  useEffect(() => {
    setMachineTranslation("");
    if (!sourceText || localTranslation !== sourceText || !shouldRequestMachineTranslation(sourceText, language)) return;

    const cacheKey = `${language}:${sourceText}`;
    const cached = machineTranslationCache.get(cacheKey);
    if (cached) {
      setMachineTranslation(cached);
      return;
    }

    const controller = new AbortController();
    fetch("/api/i18n/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetLanguage: language, texts: [sourceText] }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { translations?: { translatedText?: string }[] } | null) => {
        const translated = payload?.translations?.[0]?.translatedText?.trim();
        if (!translated || translated === sourceText) return;
        machineTranslationCache.set(cacheKey, translated);
        setMachineTranslation(translated);
      })
      .catch(() => {
        // Local dictionary text remains visible if machine translation is unavailable.
      });

    return () => controller.abort();
  }, [language, localTranslation, sourceText]);

  const displayText = machineTranslation || localTranslation || sourceText;

  return createElement(
    as,
    {
      className,
      "data-i18n-ignore": true,
      style,
      suppressHydrationWarning: true,
    },
    displayText,
  );
}
