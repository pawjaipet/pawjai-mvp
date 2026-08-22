"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  type Language,
  translateText,
} from "@/components/i18n/translations";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (value: string | null | undefined) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const textNodeOriginals = new WeakMap<Text, string>();
const ATTRIBUTE_NAMES = ["aria-label", "title", "placeholder", "alt"] as const;
const TEXT_SKIP_SELECTOR = "script, style, textarea, input, [data-i18n-ignore]";
const ATTRIBUTE_SKIP_SELECTOR = "script, style, [data-i18n-ignore]";

function shouldSkipPath(pathname: string | null) {
  if (!pathname) return false;
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/admindraft") ||
    pathname.startsWith("/ads") ||
    pathname.startsWith("/booking") ||
    pathname.startsWith("/doglistings") ||
    pathname.startsWith("/onboarding")
  );
}

function restoreTextNode(node: Text) {
  const original = textNodeOriginals.get(node);
  if (original !== undefined && node.nodeValue !== original) {
    node.nodeValue = original;
  }
}

function translateTextNode(node: Text, language: Language) {
  const parent = node.parentElement;
  if (!parent || parent.closest(TEXT_SKIP_SELECTOR)) return;

  if (language === "en") {
    restoreTextNode(node);
    return;
  }

  const current = node.nodeValue ?? "";
  const stored = textNodeOriginals.get(node);
  if (stored === undefined) {
    const translatedCurrent = translateText(current, language);
    if (translatedCurrent === current) return;
    textNodeOriginals.set(node, current);
  } else if (current !== translateText(stored, language)) {
    const translatedCurrent = translateText(current, language);
    if (translatedCurrent === current) return;
    textNodeOriginals.set(node, current);
  }

  const original = textNodeOriginals.get(node) ?? "";
  const translated = translateText(original, language);
  if (translated !== original && node.nodeValue !== translated) {
    node.nodeValue = translated;
  }
}

function translateAttributes(element: Element, language: Language) {
  for (const attribute of ATTRIBUTE_NAMES) {
    const originalKey = `i18nOriginal${attribute.replace(/[^a-z]/gi, "")}`;
    const htmlElement = element as HTMLElement;
    const current = element.getAttribute(attribute);
    const original = htmlElement.dataset[originalKey] ?? current;
    if (!original) continue;

    if (language === "en") {
      if (htmlElement.dataset[originalKey]) {
        element.setAttribute(attribute, original);
        delete htmlElement.dataset[originalKey];
      }
      continue;
    }

    if (!htmlElement.dataset[originalKey]) {
      const translated = translateText(original, language);
      if (translated === original) continue;
      htmlElement.dataset[originalKey] = original;
      element.setAttribute(attribute, translated);
      continue;
    }
    const translated = translateText(original, language);
    if (translated !== original) element.setAttribute(attribute, translated);
  }
}

function applyDomTranslations(root: ParentNode, language: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();
  while (textNode) {
    translateTextNode(textNode as Text, language);
    textNode = walker.nextNode();
  }

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from(root.querySelectorAll("*"));
  for (const element of elements) {
    if (element.closest(ATTRIBUTE_SKIP_SELECTOR)) continue;
    translateAttributes(element, language);
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const skipTranslation = shouldSkipPath(pathname);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === "en" || saved === "th") setLanguageState(saved);
    } catch {
      // Storage can be unavailable in strict privacy modes.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "th" ? "th" : "en";
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Non-persistent language still works for the current page session.
    }
  }, [language]);

  useEffect(() => {
    if (skipTranslation) {
      applyDomTranslations(document.body, "en");
      return;
    }

    applyDomTranslations(document.body, language);
    const animationFrame = window.requestAnimationFrame(() => {
      applyDomTranslations(document.body, language);
    });
    const settledRenderTimer = window.setTimeout(() => {
      applyDomTranslations(document.body, language);
    }, 120);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node as Text, language);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            applyDomTranslations(node as Element, language);
          }
        }

        if (mutation.type === "characterData" && mutation.target.nodeType === Node.TEXT_NODE) {
          if (language === "en") {
            restoreTextNode(mutation.target as Text);
          } else {
            translateTextNode(mutation.target as Text, language);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settledRenderTimer);
      observer.disconnect();
    };
  }, [language, skipTranslation, pathname]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (text) => translateText(text, language),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
