import type { CEFRLevel } from "@/data";
import { authStore } from "@/lib/authStore";
import { languageStore } from "@/lib/languageStore";
import { progressRequest, ApiError } from "@/lib/api";

export interface LevelProgress {
  vocabularyLearned: string[];   // terms marked as learned
  grammarCompleted: number[];    // grammar rule indices completed
  phrasesLearned: string[];      // phrases marked as learned
  wordsSearched: string[];       // dictionary words searched
}

// Namespaced per user and per active learning language so two accounts on
// the same browser never mix local progress, and switching languages never
// mixes English/Spanish progress either — falls back to an "anon" bucket,
// which is unreachable in practice since the dashboard is gated behind auth.
function storageKey(): string {
  const userId = authStore.getState().user?.id ?? "anon";
  const language = languageStore.getState();
  return `progress:${userId}:${language}`;
}

// One-time migration: before language support existed, progress was stored
// under the un-namespaced `progress:<userId>` key. If that legacy key is
// still around and the new `progress:<userId>:en` key hasn't been written
// yet, copy the legacy data over so it isn't silently orphaned (this matters
// most for wordsSearched, which is local-only and never synced from the
// backend — vocab/grammar/phrases would at least be re-fetched via
// loadFromServer()). English is the only language the legacy format could
// have held. The legacy key is left in place — cheap to keep, safer than
// risking data loss by deleting it if this logic ever misfires.
function migrateLegacyProgress(userId: string): void {
  try {
    const newKey = `progress:${userId}:en`;
    if (localStorage.getItem(newKey) !== null) return; // already migrated or already has fresh data
    const oldKey = `progress:${userId}`;
    const legacyRaw = localStorage.getItem(oldKey);
    if (!legacyRaw) return;
    localStorage.setItem(newKey, legacyRaw);
  } catch {}
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function load(): Record<CEFRLevel, LevelProgress> {
  migrateLegacyProgress(authStore.getState().user?.id ?? "anon");
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultProgress();
}

function defaultProgress(): Record<CEFRLevel, LevelProgress> {
  const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const entries = levels.map((l) => [
    l,
    { vocabularyLearned: [] as string[], grammarCompleted: [] as number[], phrasesLearned: [] as string[], wordsSearched: [] as string[] },
  ]);
  return Object.fromEntries(entries) as Record<CEFRLevel, LevelProgress>;
}

function save(data: Record<CEFRLevel, LevelProgress>) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(data));
  } catch {}
}

// ─── Backend sync helpers (fire-and-forget) ───────────────────────────────────

async function syncVocab(method: "POST" | "DELETE", level: CEFRLevel, term: string): Promise<void> {
  try {
    await progressRequest("/vocab", { method, body: JSON.stringify({ level, term, language: languageStore.getState() }) });
  } catch {}
}

async function syncGrammar(method: "POST" | "DELETE", level: CEFRLevel, idx: number): Promise<void> {
  try {
    await progressRequest("/grammar", { method, body: JSON.stringify({ level, idx, language: languageStore.getState() }) });
  } catch {}
}

async function syncPhrase(method: "POST" | "DELETE", level: CEFRLevel, phrase: string): Promise<void> {
  try {
    await progressRequest("/phrase", { method, body: JSON.stringify({ level, phrase, language: languageStore.getState() }) });
  } catch {}
}

// ─── Server sync on app mount / login ─────────────────────────────────────────

/**
 * Fetch authoritative progress from the backend and merge into localStorage.
 * Silent fail if backend is offline or session expired. Call on app mount
 * and right after login, once a token is available.
 */
export async function loadFromServer(): Promise<void> {
  if (!authStore.getState().token) return;

  // Capture the active language *before* the request goes out. Both the
  // request URL and (further down) the localStorage write key are derived
  // from languageStore.getState() — if we re-read it after the await instead
  // of using this captured value, a language switch that happens while this
  // request is in flight (e.g. Dashboard's effect firing loadFromServer()
  // again after login hydrates a different stored language) would cause this
  // response to be written under the NEW language's storage bucket even
  // though the data came back for the OLD language.
  const requestLanguage = languageStore.getState();

  try {
    const json = await progressRequest<{
      success: boolean;
      data?: {
        vocabulary: Partial<Record<CEFRLevel, string[]>>;
        grammar: Partial<Record<CEFRLevel, number[]>>;
        phrases: Partial<Record<CEFRLevel, string[]>>;
      };
    }>(`?language=${requestLanguage}`);

    if (!json.success || !json.data) {
      console.warn("[progress] Server sync failed: unexpected response shape");
      return;
    }

    // The active language may have changed while the request was in flight.
    // Discard a now-stale response instead of writing it into the current
    // (different) language's storage bucket.
    if (languageStore.getState() !== requestLanguage) return;

    const { vocabulary, grammar, phrases } = json.data;
    const data = load();
    const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

    for (const level of levels) {
      // Merge server state (authoritative) with local wordsSearched (local-only)
      data[level].vocabularyLearned = vocabulary[level] ?? [];
      data[level].grammarCompleted  = grammar[level] ?? [];
      data[level].phrasesLearned    = phrases[level] ?? [];
      // wordsSearched stays local-only
    }

    save(data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return; // session already cleared
    console.warn("[progress] Server sync error:", err instanceof Error ? err.message : err);
  }
}

// ─── Progress API (same public signatures as before) ─────────────────────────

export const progress = {
  load,

  markVocabLearned(level: CEFRLevel, term: string) {
    const data = load();
    if (!data[level].vocabularyLearned.includes(term)) {
      data[level].vocabularyLearned.push(term);
      save(data);
    }
    syncVocab("POST", level, term);
  },

  unmarkVocabLearned(level: CEFRLevel, term: string) {
    const data = load();
    data[level].vocabularyLearned = data[level].vocabularyLearned.filter(
      (t) => t !== term
    );
    save(data);
    syncVocab("DELETE", level, term);
  },

  markGrammarCompleted(level: CEFRLevel, index: number) {
    const data = load();
    if (!data[level].grammarCompleted.includes(index)) {
      data[level].grammarCompleted.push(index);
      save(data);
    }
    syncGrammar("POST", level, index);
  },

  toggleGrammarCompleted(level: CEFRLevel, index: number) {
    const data = load();
    const arr = data[level].grammarCompleted;
    const idx = arr.indexOf(index);
    if (idx === -1) {
      arr.push(index);
      syncGrammar("POST", level, index);
    } else {
      arr.splice(idx, 1);
      syncGrammar("DELETE", level, index);
    }
    save(data);
  },

  markPhraseLearned(level: CEFRLevel, phrase: string) {
    const data = load();
    if (!data[level].phrasesLearned.includes(phrase)) {
      data[level].phrasesLearned.push(phrase);
      save(data);
    }
    syncPhrase("POST", level, phrase);
  },

  togglePhraseLearned(level: CEFRLevel, phrase: string) {
    const data = load();
    const arr = data[level].phrasesLearned;
    const idx = arr.indexOf(phrase);
    if (idx === -1) {
      arr.push(phrase);
      syncPhrase("POST", level, phrase);
    } else {
      arr.splice(idx, 1);
      syncPhrase("DELETE", level, phrase);
    }
    save(data);
  },

  addWordSearched(level: CEFRLevel, word: string) {
    const data = load();
    const arr = data[level].wordsSearched;
    if (!arr.includes(word)) {
      arr.unshift(word);
      data[level].wordsSearched = arr.slice(0, 20);
      save(data);
    }
  },

  getLevelStats(level: CEFRLevel, totalVocab: number, totalGrammar: number, totalPhrases: number) {
    const data = load();
    const lp = data[level];
    return {
      vocab: { done: lp.vocabularyLearned.length, total: totalVocab },
      grammar: { done: lp.grammarCompleted.length, total: totalGrammar },
      phrases: { done: lp.phrasesLearned.length, total: totalPhrases },
    };
  },

  reset(level?: CEFRLevel) {
    const language = languageStore.getState();
    if (level) {
      const data = load();
      data[level] = { vocabularyLearned: [], grammarCompleted: [], phrasesLearned: [], wordsSearched: [] };
      save(data);
      progressRequest(`/reset/${level}?language=${language}`, { method: "DELETE" }).catch(() => {});
    } else {
      localStorage.removeItem(storageKey());
      progressRequest(`/reset?language=${language}`, { method: "DELETE" }).catch(() => {});
    }
  },
};
