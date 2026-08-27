import { NextResponse } from "next/server";

type Language = "en" | "th";

const MAX_TEXTS = 20;
const MAX_TEXT_LENGTH = 1200;
const CACHE_LIMIT = 600;
const THAI_RE = /[\u0E00-\u0E7F]/;

const globalCache = globalThis as typeof globalThis & {
  __pawjaiMachineTranslationCache?: Map<string, string>;
};

const translationCache = globalCache.__pawjaiMachineTranslationCache ?? new Map<string, string>();
globalCache.__pawjaiMachineTranslationCache = translationCache;

function cacheSet(key: string, value: string) {
  if (translationCache.size >= CACHE_LIMIT) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
}

function normalizeInput(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
}

async function translateWithGoogle(text: string, targetLanguage: Language) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const params = new URLSearchParams({
      client: "gtx",
      dt: "t",
      q: text,
      sl: "auto",
      tl: targetLanguage,
    });
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, {
      headers: { "User-Agent": "PawJai/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as unknown;
    const segments = Array.isArray(payload) && Array.isArray(payload[0]) ? payload[0] : [];
    const translated = segments
      .map((segment) => (Array.isArray(segment) ? segment[0] : ""))
      .filter(Boolean)
      .join("")
      .trim();

    return translated && translated !== text ? translated : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function translateWithMyMemory(text: string, targetLanguage: Language) {
  const sourceLanguage = THAI_RE.test(text) ? "th" : "en";
  if (sourceLanguage === targetLanguage) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLanguage}|${targetLanguage}`,
    });
    const response = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
      headers: { "User-Agent": "PawJai/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      responseData?: { translatedText?: unknown };
      responseStatus?: unknown;
    };
    if (payload.responseStatus !== 200) return null;

    const translated = String(payload.responseData?.translatedText ?? "").trim();
    return translated && translated !== text ? translated : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function translateOne(text: string, targetLanguage: Language) {
  const cacheKey = `${targetLanguage}:${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  const translated =
    (await translateWithGoogle(text, targetLanguage)) ??
    (await translateWithMyMemory(text, targetLanguage)) ??
    text;

  cacheSet(cacheKey, translated);
  return translated;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    targetLanguage?: Language;
    texts?: unknown[];
  } | null;
  const targetLanguage = body?.targetLanguage === "en" || body?.targetLanguage === "th" ? body.targetLanguage : null;
  if (!targetLanguage || !Array.isArray(body?.texts)) {
    return NextResponse.json({ error: "Invalid translation request." }, { status: 400 });
  }

  const texts = body.texts.map(normalizeInput).filter(Boolean).slice(0, MAX_TEXTS);
  const translations = await Promise.all(
    texts.map(async (text) => ({
      text,
      translatedText: await translateOne(text, targetLanguage),
    })),
  );

  return NextResponse.json({ translations });
}
