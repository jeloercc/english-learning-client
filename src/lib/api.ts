/**
 * api.ts — Secure API service layer
 *
 * ALL fetch calls target our Node.js proxy (VITE_API_URL, defaults to
 * localhost:3001 in dev). The frontend never contacts external APIs directly.
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
  User,
  AuthResponse,
  ApiErrorBody,
} from "@/types";
import { authStore } from "@/lib/authStore";

export const PROXY_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3001") + "/api";
const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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

// ─── Auth API ─────────────────────────────────────────────────────────────────

async function jsonRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${PROXY_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = body as ApiErrorBody;
      throw new ApiError(
        response.status,
        err.error ?? err.message ?? `Request failed (${response.status})`
      );
    }
    return body as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(0, "Request timed out. Check your connection.");
    }
    throw err;
  }
}

export const registerUser = (
  email: string,
  password: string,
  inviteCode: string
): Promise<AuthResponse> =>
  jsonRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, inviteCode }),
  });

export const loginUser = (email: string, password: string): Promise<AuthResponse> =>
  jsonRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const fetchMe = (token: string): Promise<User> =>
  jsonRequest<User>("/auth/me", { method: "GET" }, token);

// ─── Progress API (authenticated) ──────────────────────────────────────────────
//
// Every /api/progress route requires a Bearer token. This is the only place
// in the app that attaches Authorization headers to non-auth requests. A 401
// here always means the session is no longer valid, so it clears the store —
// callers (progress.ts) don't need to special-case auth failures themselves.

export async function progressRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { token } = authStore.getState();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${PROXY_BASE}/progress${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 401) {
      authStore.clearSession();
      throw new ApiError(401, "Session expired. Please log in again.");
    }

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = body as ApiErrorBody;
      throw new ApiError(
        response.status,
        err.error ?? err.message ?? `Request failed (${response.status})`
      );
    }
    return body as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(0, "Request timed out. Check your connection.");
    }
    throw err;
  }
}
