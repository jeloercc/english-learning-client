// src/lib/cefrLevelStore.ts — framework-agnostic active-CEFR-level store.
// Mirrors languageStore.ts so Dashboard.tsx can persist the level choice
// per-user in localStorage, the same way the learning language already is.

import type { CEFRLevel } from "@/data/types";
import { authStore } from "@/lib/authStore";

const DEFAULT_LEVEL: CEFRLevel = "A1";
const VALID_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function storageKey(): string {
  const userId = authStore.getState().user?.id ?? "anon";
  return `cefr-level:${userId}`;
}

function readInitialLevel(): CEFRLevel {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw && (VALID_LEVELS as string[]).includes(raw)) return raw as CEFRLevel;
  } catch {}
  return DEFAULT_LEVEL;
}

let level: CEFRLevel = readInitialLevel();
type Listener = (level: CEFRLevel) => void;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener(level);
}

export const cefrLevelStore = {
  getState(): CEFRLevel {
    return level;
  },

  setLevel(next: CEFRLevel) {
    level = next;
    try {
      localStorage.setItem(storageKey(), next);
    } catch {}
    notify();
  },

  // Re-reads the stored level for whichever user is now logged in — call
  // right after login/register/logout, mirroring languageStore.reload().
  reload() {
    level = readInitialLevel();
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
