import { useState, useEffect, useRef } from "react";
import { CheckCircle, Circle, RotateCcw, BookOpen, Volume2, Loader2 } from "lucide-react";
import { CONTENT, type CEFRLevel, type VocabWord } from "@/data";
import { useLanguage } from "@/contexts/LanguageContext";
import { progress } from "@/lib/progress";
import { lookupWord } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import type { DictionaryEntry } from "@/types";

const TOPIC_COLORS: Record<string, string> = {
  greetings: "bg-sky-50 text-sky-700 border-sky-200",
  basics: "bg-lime-50 text-lime-700 border-lime-200",
  home: "bg-amber-50 text-amber-700 border-amber-200",
  food: "bg-orange-50 text-orange-700 border-orange-200",
  family: "bg-pink-50 text-pink-700 border-pink-200",
  education: "bg-violet-50 text-violet-700 border-violet-200",
  travel: "bg-teal-50 text-teal-700 border-teal-200",
  work: "bg-blue-50 text-blue-700 border-blue-200",
  emotions: "bg-rose-50 text-rose-700 border-rose-200",
  nature: "bg-green-50 text-green-700 border-green-200",
  society: "bg-zinc-100 text-zinc-700 border-zinc-300",
  language: "bg-purple-50 text-purple-700 border-purple-200",
  advanced: "bg-indigo-50 text-indigo-700 border-indigo-200",
  rhetoric: "bg-red-50 text-red-700 border-red-200",
};

const topicColor = (topic: string) =>
  TOPIC_COLORS[topic.toLowerCase()] ?? "bg-zinc-50 text-zinc-600 border-zinc-200";

// ─── Live-data fetch (cached per word) ───────────────────────────────────────

const liveCache: Record<string, DictionaryEntry | null> = {};

async function fetchLiveEntry(term: string): Promise<DictionaryEntry | null> {
  if (term in liveCache) return liveCache[term];
  try {
    const result = await lookupWord(term);
    liveCache[term] = result;
    return result;
  } catch {
    liveCache[term] = null;
    return null;
  }
}

// ─── Word card ────────────────────────────────────────────────────────────────

interface WordCardProps {
  word: VocabWord;
  learned: boolean;
  onToggle: () => void;
}

function WordCard({ word, learned, onToggle }: WordCardProps) {
  const [flipped, setFlipped]     = useState(false);
  const [liveData, setLiveData]   = useState<DictionaryEntry | null>(null);
  const [fetching, setFetching]   = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFlip = async () => {
    const next = !flipped;
    setFlipped(next);
    if (next && !liveData && !fetching) {
      setFetching(true);
      const entry = await fetchLiveEntry(word.term);
      setLiveData(entry);
      setFetching(false);
    }
  };

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = liveData?.audioUrl;
    if (!url) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  return (
    <div
      className={`border transition-all cursor-pointer select-none ${
        learned ? "border-green-300 bg-green-50" : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
      onClick={handleFlip}
    >
      <div className="p-4 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-lg font-bold text-zinc-900">{word.term}</p>
            <p className="font-mono text-xs text-zinc-400">{word.phonetic}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Audio button — only when flipped and live data available */}
            {flipped && liveData?.audioUrl && (
              <button
                onClick={playAudio}
                className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
                title="Play pronunciation"
              >
                <Volume2 size={15} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="shrink-0 mt-0.5 text-zinc-300 hover:text-green-500 transition-colors"
              title={learned ? "Mark as not learned" : "Mark as learned"}
            >
              {learned ? (
                <CheckCircle size={18} className="text-green-500" />
              ) : (
                <Circle size={18} />
              )}
            </button>
          </div>
        </div>

        <span className={`inline-block px-2 py-0.5 text-xs font-mono border ${topicColor(word.topic)}`}>
          {word.topic}
        </span>

        {/* Collapsed state */}
        {!flipped && (
          <p className="text-xs font-mono text-zinc-400 pt-1">Tap to reveal definition</p>
        )}

        {/* Expanded state */}
        {flipped && (
          <div className="space-y-3 pt-2 border-t border-zinc-100" onClick={(e) => e.stopPropagation()}>
            {/* Loading spinner */}
            {fetching && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 size={13} className="animate-spin" />
                <span className="text-xs font-mono">Loading…</span>
              </div>
            )}

            {/* Static definition (always shown) */}
            <div className="space-y-1">
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Definition</p>
              <p className="text-sm text-zinc-700 leading-relaxed">
                {liveData?.definitions?.[0]?.definition ?? word.definition}
              </p>
              {/* Show up to 3 extra definitions from API */}
              {liveData?.definitions?.slice(1, 4).map((d, i) => (
                <p key={i} className="text-sm text-zinc-500 leading-relaxed border-l-2 border-zinc-100 pl-2 mt-1">
                  {d.definition}
                </p>
              ))}
            </div>

            {/* Example */}
            {(liveData?.definitions?.[0]?.example ?? word.example) && (
              <p className="text-xs text-zinc-400 italic border-l-2 border-zinc-200 pl-2">
                "{liveData?.definitions?.[0]?.example ?? word.example}"
              </p>
            )}

            {/* Part of speech */}
            <p className="text-xs font-mono text-zinc-400">
              {liveData?.partOfSpeech ?? word.partOfSpeech}
            </p>

            {/* Synonyms from API */}
            {liveData && liveData.synonyms.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Synonyms</p>
                <div className="flex flex-wrap gap-1">
                  {liveData.synonyms.slice(0, 8).map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-xs font-mono bg-white border border-zinc-200 text-zinc-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Antonyms from API */}
            {liveData && liveData.antonyms.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Antonyms</p>
                <div className="flex flex-wrap gap-1">
                  {liveData.antonyms.slice(0, 6).map((a) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 text-xs font-mono bg-zinc-900 text-white"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Idioms from API */}
            {liveData && liveData.idioms?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Idioms</p>
                <ul className="space-y-1">
                  {liveData.idioms.slice(0, 3).map((idiom, i) => (
                    <li key={i} className="pl-2 border-l-2 border-zinc-100">
                      <p className="text-xs font-mono font-semibold text-zinc-600">{idiom.phrase}</p>
                      {idiom.definition && (
                        <p className="text-xs text-zinc-400 leading-snug">{idiom.definition}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface VocabularyProps {
  level: CEFRLevel;
}

export default function Vocabulary({ level }: VocabularyProps) {
  const { language } = useLanguage();
  const words = CONTENT[language].vocabulary[level];
  const [learned, setLearned] = useState<string[]>([]);
  const [filter, setFilter]   = useState<"all" | "learned" | "new">("all");

  useEffect(() => {
    const data = progress.load();
    setLearned(data[level].vocabularyLearned);
  }, [level, language]);

  const toggle = (term: string) => {
    const isLearned = learned.includes(term);
    if (isLearned) {
      progress.unmarkVocabLearned(level, term);
      setLearned((prev) => prev.filter((t) => t !== term));
    } else {
      progress.markVocabLearned(level, term);
      setLearned((prev) => [...prev, term]);
    }
  };

  const filtered = words.filter((w) => {
    if (filter === "learned") return learned.includes(w.term);
    if (filter === "new") return !learned.includes(w.term);
    return true;
  });

  const learnedCount = words.filter((w) => learned.includes(w.term)).length;
  const pct = Math.round((learnedCount / words.length) * 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <BookOpen size={15} className="text-zinc-400" />
            <span className="font-mono text-sm font-semibold text-zinc-700">
              {words.length} words
            </span>
            <span className="font-mono text-xs text-zinc-400">
              · {learnedCount} learned ({pct}%)
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full max-w-48 bg-zinc-200">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs font-mono text-zinc-400 mt-1.5">
            Tap any card to see full definition, synonyms & antonyms from the API
          </p>
        </div>
        <button
          onClick={() => { progress.reset(level); setLearned([]); }}
          className="flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-red-500 transition-colors shrink-0"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      <Separator />

      {/* Filter tabs */}
      <div className="flex gap-1">
        {(["all", "new", "learned"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs font-mono transition-colors ${
              filter === f
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"
            }`}
          >
            {f === "all"
              ? `All (${words.length})`
              : f === "learned"
              ? `Learned (${learnedCount})`
              : `New (${words.length - learnedCount})`}
          </button>
        ))}
      </div>

      {/* Word grid */}
      {words.length === 0 ? (
        <p className="text-sm font-mono text-zinc-400 py-8 text-center">
          Content for this level is coming soon.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm font-mono text-zinc-400 py-8 text-center">No words in this filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((word) => (
            <WordCard
              key={word.term}
              word={word}
              learned={learned.includes(word.term)}
              onToggle={() => toggle(word.term)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
