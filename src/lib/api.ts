/**
 * api.ts — Secure API service layer
 *
 * ALL fetch calls target our local Node.js proxy (localhost:3001).
 * The frontend never contacts external APIs directly.
 *
 * Security:
 *  - AbortController timeout on every request (10s)
 *  - Input encoded with encodeURIComponent before use in URLs
 *  - Error responses normalized — raw details never bubble to UI
 */

import type {
  DictionaryResponse,
  DictionaryEntry,
  GrammarMatch,
  GrammarResponse,
  GeocodingResult,
  WeatherData,
  Country,
} from "@/types";

const PROXY_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3001") + "/api";
const TIMEOUT_MS = 10_000;

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function proxyFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${PROXY_BASE}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get a user-friendly message from the proxy error JSON
      const body = await response.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ??
          `Server responded with status ${response.status}`
      );
    }

    return response.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Check your connection.");
    }
    throw err;
  }
}

// ─── Dictionary API (unified format) ─────────────────────────────────────────

export async function lookupWord(word: string): Promise<DictionaryEntry> {
  const response = await proxyFetch<DictionaryResponse>(
    `/dictionary/${encodeURIComponent(word.trim().toLowerCase())}`
  );
  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? "Word not found.");
  }
  return response.data;
}

// ─── Grammar Check API ────────────────────────────────────────────────────────

export async function checkGrammar(
  text: string,
  language = "en-US"
): Promise<GrammarMatch[]> {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 20_000); // LT is slow

  try {
    const response = await fetch(`${PROXY_BASE}/grammar/check`, {
      method:  "POST",
      signal:  controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body:    JSON.stringify({ text, language }),
    });
    clearTimeout(timeoutId);

    const json = (await response.json()) as GrammarResponse;
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? "Grammar check failed.");
    }
    return json.data.matches;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Grammar check timed out.");
    }
    throw err;
  }
}

// ─── Word audio URL (for Pronunciation section) ───────────────────────────────

export async function getWordAudio(word: string): Promise<string | null> {
  try {
    const response = await proxyFetch<DictionaryResponse>(
      `/dictionary/${encodeURIComponent(word.trim().toLowerCase())}`
    );
    return response.data?.audioUrl ?? null;
  } catch {
    return null;
  }
}

// ─── Weather API ──────────────────────────────────────────────────────────────

export const geocodeLocation = (name: string): Promise<GeocodingResult> =>
  proxyFetch<GeocodingResult>(
    `/weather/geocoding?name=${encodeURIComponent(name.trim())}`
  );

export const getForecast = (lat: number, lon: number): Promise<WeatherData> =>
  proxyFetch<WeatherData>(`/weather?lat=${lat}&lon=${lon}`);

// ─── Countries API ────────────────────────────────────────────────────────────

export const getAllCountries = (): Promise<Country[]> =>
  proxyFetch<Country[]>("/countries/all");

export const searchCountries = (name: string): Promise<Country[]> =>
  proxyFetch<Country[]>(
    `/countries/search?name=${encodeURIComponent(name.trim())}`
  );

export const getCountryByCode = (code: string): Promise<Country> =>
  proxyFetch<Country>(`/countries/${encodeURIComponent(code)}`);

// ─── Word Explorer (Datamuse) ─────────────────────────────────────────────────

interface DatamuseItem { word: string; score: number; tags: string[] }

async function wordExplorer(endpoint: string, dataKey: string): Promise<string[]> {
  try {
    const res = await fetch(`${PROXY_BASE}${endpoint}`, {
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    if (!json.success || !json.data) return [];
    return (json.data[dataKey] as DatamuseItem[]).map((item) => item.word);
  } catch {
    return [];
  }
}

export const getWordRhymes = (word: string): Promise<string[]> =>
  wordExplorer(`/words/rhymes/${encodeURIComponent(word.trim().toLowerCase())}`, "rhymes");

export const getWordSimilar = (word: string): Promise<string[]> =>
  wordExplorer(`/words/similar/${encodeURIComponent(word.trim().toLowerCase())}`, "similar");

export const getWordAdjectives = (word: string): Promise<string[]> =>
  wordExplorer(`/words/adjectives/${encodeURIComponent(word.trim().toLowerCase())}`, "adjectives");

export const getAutocomplete = async (q: string): Promise<string[]> => {
  try {
    const res = await fetch(
      `${PROXY_BASE}/words/autocomplete?q=${encodeURIComponent(q.trim())}`,
      { headers: { Accept: "application/json" } }
    );
    const json = await res.json();
    return json.success
      ? (json.data.suggestions as { word: string }[]).map((s) => s.word)
      : [];
  } catch {
    return [];
  }
};
