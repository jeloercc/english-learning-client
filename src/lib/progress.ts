import type { CEFRLevel } from "@/data/vocabulary";

export interface LevelProgress {
  vocabularyLearned: string[];   // terms marked as learned
  grammarCompleted: number[];    // grammar rule indices completed
  phrasesLearned: string[];      // phrases marked as learned
  wordsSearched: string[];       // dictionary words searched
}

const STORAGE_KEY = "englishLearning_progress";
export const PROXY_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3001") + "/api";

// Bearer token for /api/progress endpoints. Set VITE_PROGRESS_TOKEN in .env
const PROGRESS_TOKEN = import.meta.env.VITE_PROGRESS_TOKEN as string | undefined;

function progressHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  if (PROGRESS_TOKEN) headers["Authorization"] = `Bearer ${PROGRESS_TOKEN}`;
  return headers;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function load(): Record<CEFRLevel, LevelProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

// ─── Backend sync helpers (fire-and-forget) ───────────────────────────────────

async function syncVocab(method: "POST" | "DELETE", level: CEFRLevel, term: string): Promise<void> {
  try {
    await fetch(`${PROXY_BASE}/progress/vocab`, {
      method,
      headers: progressHeaders(),
      body: JSON.stringify({ level, term }),
    });
  } catch {}
}

async function syncGrammar(method: "POST" | "DELETE", level: CEFRLevel, idx: number): Promise<void> {
  try {
    await fetch(`${PROXY_BASE}/progress/grammar`, {
      method,
      headers: progressHeaders(),
      body: JSON.stringify({ level, idx }),
    });
  } catch {}
}

async function syncPhrase(method: "POST" | "DELETE", level: CEFRLevel, phrase: string): Promise<void> {
  try {
    await fetch(`${PROXY_BASE}/progress/phrase`, {
      method,
      headers: progressHeaders(),
      body: JSON.stringify({ level, phrase }),
    });
  } catch {}
}

// ─── Server sync on app mount ─────────────────────────────────────────────────

/**
 * Fetch authoritative progress from SQLite backend and merge into localStorage.
 * Silent fail if backend is offline. Call once on app mount.
 */
export async function loadFromServer(): Promise<void> {
  try {
    const res = await fetch(`${PROXY_BASE}/progress`, {
      headers: progressHeaders(),
    });
    if (!res.ok) {
      console.warn(`[progress] Server sync failed: HTTP ${res.status}`);
      return;
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      console.warn("[progress] Server sync failed: unexpected response shape");
      return;
    }

    const { vocabulary, grammar, phrases } = json.data as {
      vocabulary: Partial<Record<CEFRLevel, string[]>>;
      grammar: Partial<Record<CEFRLevel, number[]>>;
      phrases: Partial<Record<CEFRLevel, string[]>>;
    };

    const data = load();
    const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

    for (const level of levels) {
      // Merge server state (authoritative) with local wordsSearched (local-only)
      const serverVocab = vocabulary[level] ?? [];
      const serverGrammar = grammar[level] ?? [];
      const serverPhrases = phrases[level] ?? [];

      data[level].vocabularyLearned = serverVocab;
      data[level].grammarCompleted  = serverGrammar;
      data[level].phrasesLearned    = serverPhrases;
      // wordsSearched stays local-only
    }

    save(data);
  } catch (err) {
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
    if (level) {
      const data = load();
      data[level] = { vocabularyLearned: [], grammarCompleted: [], phrasesLearned: [], wordsSearched: [] };
      save(data);
      // Fire-and-forget server reset
      fetch(`${PROXY_BASE}/progress/reset/${level}`, { method: "DELETE", headers: progressHeaders() }).catch(() => {});
    } else {
      localStorage.removeItem(STORAGE_KEY);
      fetch(`${PROXY_BASE}/progress/reset`, { method: "DELETE", headers: progressHeaders() }).catch(() => {});
    }
  },
};
