// src/lib/languageStore.ts — framework-agnostic active-learning-language store.
//
// Mirrors authStore.ts's plain-module pattern so progress.ts/api.ts can read
// the current language synchronously without depending on React.

import type { LanguageCode } from "@/data/languages";
import { DEFAULT_LANGUAGE } from "@/data/languages";
import { authStore } from "@/lib/authStore";

function storageKey(): string {
  const userId = authStore.getState().user?.id ?? "anon";
  return `learning-lang:${userId}`;
}

function readInitialLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw === "en" || raw === "es") return raw;
  } catch {}
  return DEFAULT_LANGUAGE;
}

let language: LanguageCode = readInitialLanguage();
type Listener = (language: LanguageCode) => void;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener(language);
}

export const languageStore = {
  getState(): LanguageCode {
    return language;
  },

  setLanguage(next: LanguageCode) {
    language = next;
    try {
      localStorage.setItem(storageKey(), next);
    } catch {}
    notify();
  },

  // Re-reads the stored preference for whichever user is now logged in.
  // Must be called right after login/register/logout, since storageKey()
  // depends on authStore's current user and this module's `language`
  // variable is otherwise only set once, at initial page load.
  reload() {
    language = readInitialLanguage();
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
