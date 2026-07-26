import { useState, useRef, useCallback, useEffect } from "react";
import { Search, Volume2, BookOpen, ChevronRight, Clock, X, Lightbulb, Music2, Sparkles, Layers } from "lucide-react";
import type { DictionaryEntry, SpanishDictionaryEntry, SpanishDictionaryResponse } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  getWordRhymes,
  getWordSimilar,
  getWordAdjectives,
  getAutocomplete,
  PROXY_BASE,
} from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

const POS_COLORS: Record<string, string> = {
  noun:         "bg-blue-50 text-blue-700 border-blue-200",
  verb:         "bg-green-50 text-green-700 border-green-200",
  adjective:    "bg-amber-50 text-amber-700 border-amber-200",
  adverb:       "bg-purple-50 text-purple-700 border-purple-200",
  pronoun:      "bg-pink-50 text-pink-700 border-pink-200",
  preposition:  "bg-orange-50 text-orange-700 border-orange-200",
  conjunction:  "bg-teal-50 text-teal-700 border-teal-200",
  interjection: "bg-red-50 text-red-700 border-red-200",
};

const posColor = (pos: string) =>
  POS_COLORS[pos.toLowerCase()] ?? "bg-zinc-50 text-zinc-700 border-zinc-200";

function WordChip({ word, onSearch, variant = "synonym" }: {
  word: string;
  onSearch: (w: string) => void;
  variant?: "synonym" | "antonym" | "neutral";
}) {
  const cls =
    variant === "synonym"  ? "bg-white text-zinc-700 border-zinc-300" :
    variant === "antonym"  ? "bg-zinc-900 text-white border-zinc-700" :
                             "bg-zinc-50 text-zinc-600 border-zinc-200";
  return (
    <button
      onClick={() => onSearch(word)}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono border
        transition-colors hover:opacity-70 cursor-pointer ${cls}`}
    >
      {word}
      <ChevronRight size={10} />
    </button>
  );
}

function DictionarySkeletons() {
  return (
    <div className="space-y-6 mt-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-px w-full" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function SourceBadge({ source, cached }: { source: string | null; cached: boolean }) {
  if (!source) return null;
  const label =
    source === "merriam-webster-learners" ? "MW Learner's" :
    source === "datamuse" ? "Datamuse" :
    "Free Dictionary";
  return (
    <span className="font-mono text-xs text-zinc-400 flex items-center gap-1">
      {label} {cached && <span className="text-zinc-300">(cached)</span>}
    </span>
  );
}

// ─── Chip section helper ──────────────────────────────────────────────────────
function ChipSection({
  title,
  icon,
  words,
  onSearch,
  variant = "neutral",
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  words: string[];
  onSearch: (w: string) => void;
  variant?: "synonym" | "antonym" | "neutral";
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide flex items-center gap-1">
          {icon} {title}
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-6 w-16" />)}
        </div>
      </div>
    );
  }
  if (words.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide flex items-center gap-1">
        {icon} {title} <span className="text-zinc-300">({words.length})</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {words.slice(0, 20).map((w) => (
          <WordChip key={w} word={w} onSearch={onSearch} variant={variant} />
        ))}
      </div>
    </div>
  );
}

// ─── Autocomplete input ───────────────────────────────────────────────────────
function AutocompleteInput({
  value,
  onChange,
  onSelect,
  onSubmit,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSug, setShowSug] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSuggestions([]); setShowSug(false); return; }
    debounceRef.current = setTimeout(async () => {
      const sug = await getAutocomplete(value);
      setSuggestions(sug);
      setShowSug(sug.length > 0);
    }, 220);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSug(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { setShowSug(false); onSubmit(); }
          if (e.key === "Escape") setShowSug(false);
        }}
        onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
        placeholder="Search a word…"
        maxLength={60}
        className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-white border border-zinc-300
                   focus:outline-none focus:border-zinc-600 placeholder:text-zinc-400"
        disabled={loading}
      />
      {showSug && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 bg-white border border-zinc-200 shadow-sm max-h-48 overflow-y-auto">
          {suggestions.map((sug) => (
            <button
              key={sug}
              onMouseDown={() => { onSelect(sug); setShowSug(false); }}
              className="block w-full text-left px-3 py-1.5 text-sm font-mono text-zinc-700
                         hover:bg-zinc-50 transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SpanishResult({ entry, onPlayAudio }: { entry: SpanishDictionaryEntry; onPlayAudio: (url: string) => void }) {
  return (
    <article className="space-y-5">
      <header className="space-y-2">
        <div className="flex items-end justify-between">
          <h2 className="text-4xl font-mono font-bold text-zinc-900 tracking-tight">{entry.word}</h2>
          <span className="font-mono text-xs text-zinc-400">MW Spanish</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {entry.gender && (
            <span className="px-2 py-0.5 text-xs font-mono font-semibold border bg-pink-50 text-pink-700 border-pink-200">
              {entry.gender === "masculine" ? "masculino (m)" : "femenino (f)"}
            </span>
          )}
          {entry.partOfSpeech && (
            <span className="px-2 py-0.5 text-xs font-mono font-semibold border bg-zinc-50 text-zinc-700 border-zinc-200">
              {entry.partOfSpeech}
            </span>
          )}
          {entry.audioUrl && (
            <button
              onClick={() => onPlayAudio(entry.audioUrl!)}
              className="flex items-center gap-1 px-2 py-0.5 border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-colors text-xs font-mono"
            >
              <Volume2 size={13} /> Listen
            </button>
          )}
        </div>
      </header>

      <Separator />

      <div className="space-y-3">
        <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">
          Translations <span className="text-zinc-300">({entry.translations.length})</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {entry.translations.map((t) => (
            <span key={t} className="px-2 py-0.5 text-xs font-mono bg-white border border-zinc-200 text-zinc-700">{t}</span>
          ))}
        </div>
      </div>

      {entry.examples.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Examples</p>
            <ul className="space-y-2">
              {entry.examples.map((ex, i) => (
                <li key={i} className="pl-3 border-l-2 border-zinc-100 space-y-0.5">
                  <p className="text-sm text-zinc-800">{ex.es}</p>
                  <p className="text-xs text-zinc-400 italic">{ex.en}</p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WordExtraData {
  rhymes: string[];
  similar: string[];
  adjectives: string[];
}

export default function DictionarySearch() {
  const { language, config } = useLanguage();
  const [query, setQuery]     = useState("");
  const [entry, setEntry]     = useState<DictionaryEntry | null>(null);
  const [spanishEntry, setSpanishEntry] = useState<SpanishDictionaryEntry | null>(null);
  const [source, setSource]   = useState<string | null>(null);
  const [cached, setCached]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [extra, setExtra]     = useState<WordExtraData | null>(null);
  const [extraLoading, setExtraLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clear stale search results when the language changes so the pane falls
  // back to the empty state instead of showing a leftover result rendered
  // under the wrong language branch (or nothing at all). History persists.
  useEffect(() => {
    setEntry(null);
    setSpanishEntry(null);
    setExtra(null);
    setError(null);
  }, [language]);

  const searchWithMeta = useCallback(async (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setLoading(true);
    setError(null);
    setEntry(null);
    setSpanishEntry(null);
    setExtra(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(
        `${PROXY_BASE}${config.dictionaryPath(trimmed)}`,
        { signal: controller.signal, headers: { Accept: "application/json" } }
      );
      clearTimeout(timeout);
      const json = await resp.json();

      if (!json.success || !json.data) {
        setError(json.error?.message ?? "Word not found.");
      } else {
        setSource(json.source);
        setCached(json.cached);
        setHistory((prev) => [trimmed, ...prev.filter((w) => w !== trimmed)].slice(0, 10));

        if (language === "es") {
          setEntry(null);
          setSpanishEntry((json as SpanishDictionaryResponse).data);
        } else {
          setSpanishEntry(null);
          setEntry(json.data);
        }

        if (config.hasRhymes) {
          // Fetch Datamuse extras in background
          setExtraLoading(true);
          const [rhymes, similar, adjectives] = await Promise.all([
            getWordRhymes(trimmed),
            getWordSimilar(trimmed),
            getWordAdjectives(trimmed),
          ]);
          setExtra({ rhymes, similar, adjectives });
          setExtraLoading(false);
        } else {
          setExtra(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }, [language, config]);

  const handleSubmit = () => searchWithMeta(query);
  const handleChipSearch = (word: string) => searchWithMeta(word);

  const playAudio = (url: string) => {
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = new Audio(url);
    audioRef.current.play().catch(() => {});
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      {/* Left: Search + History */}
      <aside className="w-full md:w-52 shrink-0 space-y-4">
        <div className="space-y-2">
          <AutocompleteInput
            value={query}
            onChange={setQuery}
            onSelect={(w) => { setQuery(w); searchWithMeta(w); }}
            onSubmit={handleSubmit}
            loading={loading}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
            className="w-full py-1.5 text-sm font-mono bg-zinc-900 text-white
                       hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "Looking up…" : "Look up"}
          </button>
        </div>

        {history.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide flex items-center gap-1">
              <Clock size={10} /> Recent
            </p>
            <ul className="space-y-0.5">
              {history.map((w) => (
                <li key={w}>
                  <button
                    onClick={() => searchWithMeta(w)}
                    className="w-full text-left px-2 py-1 text-sm font-mono text-zinc-600
                               hover:bg-zinc-100 transition-colors flex items-center justify-between group"
                  >
                    {w}
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setHistory([])}
              className="text-xs font-mono text-zinc-400 hover:text-red-500 flex items-center gap-1 mt-1"
            >
              <X size={10} /> Clear
            </button>
          </div>
        )}

        {history.length === 0 && !entry && (
          <div className="space-y-1">
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Try these</p>
            <div className="flex flex-wrap md:flex-col gap-1">
              {["eloquent", "resilient", "nuance", "pragmatic", "ephemeral"].map((w) => (
                <button
                  key={w}
                  onClick={() => searchWithMeta(w)}
                  className="px-2 py-1 text-sm font-mono text-zinc-500
                             hover:bg-zinc-100 hover:text-zinc-800 transition-colors text-left"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <Separator className="md:hidden" />
      <Separator orientation="vertical" className="hidden md:block" />

      {/* Right: Results */}
      <main className="flex-1 overflow-y-auto md:pr-2">
        {!loading && !error && !entry && !spanishEntry && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-300">
            <BookOpen size={40} strokeWidth={1} />
            <p className="text-sm font-mono">Search a word to begin</p>
          </div>
        )}

        {loading && <DictionarySkeletons />}

        {error && !loading && (
          <div className="mt-6 p-4 border border-red-200 bg-red-50">
            <p className="text-sm font-mono text-red-700">{error}</p>
          </div>
        )}

        {language === "es" && spanishEntry && !loading && (
          <SpanishResult entry={spanishEntry} onPlayAudio={playAudio} />
        )}

        {language === "en" && entry && !loading && (
          <article className="space-y-5">
            {/* Word header */}
            <header className="space-y-2">
              <div className="flex items-end justify-between">
                <h2 className="text-4xl font-mono font-bold text-zinc-900 tracking-tight">
                  {entry.word}
                </h2>
                <SourceBadge source={source} cached={cached} />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {entry.phonetic && (
                  <span className="font-mono text-sm text-zinc-500">{entry.phonetic}</span>
                )}
                {entry.audioUrl && (
                  <button
                    onClick={() => playAudio(entry.audioUrl!)}
                    title="Play pronunciation"
                    className="flex items-center gap-1 px-2 py-0.5 border border-zinc-200
                               text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-colors text-xs font-mono"
                  >
                    <Volume2 size={13} /> Listen
                  </button>
                )}
                {entry.partOfSpeech && (
                  <span className={`px-2 py-0.5 text-xs font-mono font-semibold border ${posColor(entry.partOfSpeech)}`}>
                    {entry.partOfSpeech}
                  </span>
                )}
              </div>
            </header>

            <Separator />

            {/* Definitions */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">
                Definitions <span className="text-zinc-300">({entry.definitions.length})</span>
              </p>
              <ol className="space-y-3 list-none">
                {entry.definitions.map((def, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-xs text-zinc-400 mt-0.5 select-none w-5 shrink-0">{i + 1}.</span>
                    <div className="space-y-1">
                      {def.partOfSpeech && def.partOfSpeech !== entry.partOfSpeech && (
                        <span className={`inline-block px-1.5 py-0.5 text-xs font-mono border ${posColor(def.partOfSpeech)} mb-1`}>
                          {def.partOfSpeech}
                        </span>
                      )}
                      <p className="text-sm text-zinc-800 leading-relaxed">{def.definition}</p>
                      {def.example && (
                        <p className="text-xs text-zinc-500 italic border-l-2 border-zinc-200 pl-2">
                          "{def.example}"
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Synonyms from MW/FreeDictionary */}
            {entry.synonyms.length > 0 && (
              <>
                <Separator />
                <ChipSection
                  title="Synonyms"
                  icon={<ChevronRight size={11} />}
                  words={entry.synonyms}
                  onSearch={handleChipSearch}
                  variant="synonym"
                />
              </>
            )}

            {/* Antonyms from MW/FreeDictionary */}
            {entry.antonyms.length > 0 && (
              <ChipSection
                title="Antonyms"
                icon={<ChevronRight size={11} />}
                words={entry.antonyms}
                onSearch={handleChipSearch}
                variant="antonym"
              />
            )}

            {/* Idioms (MW only) */}
            {entry.idioms && entry.idioms.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                    <Lightbulb size={11} /> Idioms & Phrases <span className="text-zinc-300">({entry.idioms.length})</span>
                  </p>
                  <ul className="space-y-3">
                    {entry.idioms.map((idiom, i) => (
                      <li key={i} className="space-y-0.5 pl-3 border-l-2 border-zinc-100">
                        <p className="text-sm font-mono font-semibold text-zinc-700">{idiom.phrase}</p>
                        {idiom.definition && (
                          <p className="text-sm text-zinc-600 leading-relaxed">{idiom.definition}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* ── Datamuse extras ── */}
            <Separator />
            <p className="text-xs font-mono text-zinc-300 uppercase tracking-widest">
              Word Explorer · Datamuse
            </p>

            <ChipSection
              title="Similar meaning"
              icon={<Sparkles size={11} />}
              words={extra?.similar ?? []}
              onSearch={handleChipSearch}
              variant="neutral"
              loading={extraLoading && !extra}
            />

            <ChipSection
              title="Rhymes with"
              icon={<Music2 size={11} />}
              words={extra?.rhymes ?? []}
              onSearch={handleChipSearch}
              variant="neutral"
              loading={extraLoading && !extra}
            />

            <ChipSection
              title="Common adjectives"
              icon={<Layers size={11} />}
              words={extra?.adjectives ?? []}
              onSearch={handleChipSearch}
              variant="neutral"
              loading={extraLoading && !extra}
            />
          </article>
        )}
      </main>
    </div>
  );
}
