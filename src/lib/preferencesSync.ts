// src/lib/preferencesSync.ts — best-effort backend sync for language/level
// preferences. localStorage (languageStore/cefrLevelStore) remains the
// source of truth for instant UI state; this is a fire-and-forget mirror
// to the backend so preferences follow the user across devices.

import { authStore } from "@/lib/authStore";
import { updatePreferences } from "@/lib/api";
import type { LanguageCode } from "@/data/languages";
import type { CEFRLevel } from "@/data/types";

export function syncPreferences(patch: { learningLanguage?: LanguageCode; cefrLevel?: CEFRLevel }): void {
  const token = authStore.getState().token;
  if (!token) return; // not logged in — localStorage-only, nothing to sync
  updatePreferences(patch, token).catch(() => {}); // same swallow-errors pattern as progress.ts
}
