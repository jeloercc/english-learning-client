import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Volume2, Loader2, CheckCircle, Circle } from "lucide-react";
import { VOCABULARY, type CEFRLevel, type VocabWord } from "@/data/vocabulary";
import { getWordAudio } from "@/lib/api";
import { progress } from "@/lib/progress";
import { Separator } from "@/components/ui/separator";

// ─── Pace options ─────────────────────────────────────────────────────────────
const PACE_OPTIONS: { label: string; delay: number }[] = [
  { label: "Slow",   delay: 3500 },
  { label: "Normal", delay: 1800 },
  { label: "Fast",   delay: 800  },
];

// ─── Single word row ──────────────────────────────────────────────────────────

interface WordRowProps {
  word: VocabWord;
  isPlaying: boolean;
  learned: boolean;
  onPlay: () => void;
  onToggleLearned: () => void;
  audioState: "idle" | "loading" | "ready" | "error";
}

function WordRow({ word, isPlaying, learned, onPlay, onToggleLearned, audioState }: WordRowProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0 transition-colors ${
      isPlaying ? "bg-amber-50" : learned ? "bg-green-50/50" : "hover:bg-zinc-50/80"
    }`}>
      {/* Play button */}
      <button
        onClick={onPlay}
        disabled={audioState === "loading"}
        className={`shrink-0 w-8 h-8 flex items-center justify-center border transition-all ${
          isPlaying
            ? "bg-amber-500 border-amber-500 text-white"
            : "border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"
        }`}
        title={`Play pronunciation of "${word.term}"`}
      >
        {audioState === "loading" ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Volume2 size={13} />
        )}
      </button>

      {/* Word */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <span className={`font-mono text-sm font-bold ${isPlaying ? "text-amber-700" : "text-zinc-900"}`}>
            {word.term}
          </span>
          {word.phonetic && (
            <span className="font-mono text-xs text-zinc-400 shrink-0">{word.phonetic}</span>
          )}
        </div>
        <p className="text-xs text-zinc-400 truncate mt-0.5">{word.definition}</p>
      </div>

      {/* Topic tag */}
      <span className="hidden sm:inline font-mono text-xs text-zinc-300 shrink-0">{word.topic}</span>

      {/* Learned toggle */}
      <button
        onClick={onToggleLearned}
        className={`shrink-0 transition-colors ${learned ? "text-green-500" : "text-zinc-300 hover:text-green-400"}`}
        title={learned ? "Mark as not learned" : "Mark as learned"}
      >
        {learned ? <CheckCircle size={15} /> : <Circle size={15} />}
      </button>

      {audioState === "error" && (
        <span className="font-mono text-xs text-red-300 shrink-0">no audio</span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PronunciationProps {
  level: CEFRLevel;
}

export default function Pronunciation({ level }: PronunciationProps) {
  const words = VOCABULARY[level];

  const [audioCache, setAudioCache]     = useState<Record<string, string | null>>({});
  const [audioStates, setAudioStates]   = useState<Record<string, "idle" | "loading" | "ready" | "error">>({});
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [paceIndex, setPaceIndex]       = useState(1); // Normal by default
  const [learned, setLearned]           = useState<string[]>([]);

  const stopRef    = useRef(false);
  const audioRef   = useRef<HTMLAudioElement | null>(null);

  // Load progress on level change
  useEffect(() => {
    const data = progress.load();
    setLearned(data[level].vocabularyLearned);
    setPlayingIndex(null);
    setIsPlayingAll(false);
    stopRef.current = true; // stop any ongoing playAll
  }, [level]);

  // Fetch audio URL for a word (lazy, cached)
  const fetchAudio = useCallback(async (term: string): Promise<string | null> => {
    if (term in audioCache) return audioCache[term];

    setAudioStates((s) => ({ ...s, [term]: "loading" }));
    const url = await getWordAudio(term);
    setAudioCache((c) => ({ ...c, [term]: url }));
    setAudioStates((s) => ({ ...s, [term]: url ? "ready" : "error" }));
    return url;
  }, [audioCache]);

  // Play a single word
  const playWord = useCallback(async (term: string, index: number) => {
    setPlayingIndex(index);
    const url = await fetchAudio(term);

    if (!url) {
      setPlayingIndex(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    return new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPlayingIndex(null); resolve(); };
      audio.onerror = () => { setPlayingIndex(null); resolve(); };
      audio.play().catch(() => { setPlayingIndex(null); resolve(); });
    });
  }, [fetchAudio]);

  // Play all sequentially
  const playAll = useCallback(async () => {
    setIsPlayingAll(true);
    stopRef.current = false;
    const delay = PACE_OPTIONS[paceIndex].delay;

    for (let i = 0; i < words.length; i++) {
      if (stopRef.current) break;
      await playWord(words[i].term, i);
      if (stopRef.current) break;
      if (i < words.length - 1) {
        await new Promise<void>((res) => {
          const t = setTimeout(res, delay);
          // Allow stop to interrupt the delay
          const check = setInterval(() => { if (stopRef.current) { clearTimeout(t); clearInterval(check); res(); } }, 100);
        });
      }
    }

    setIsPlayingAll(false);
    setPlayingIndex(null);
  }, [words, paceIndex, playWord]);

  const stopAll = () => {
    stopRef.current = true;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsPlayingAll(false);
    setPlayingIndex(null);
  };

  const toggleLearned = (term: string) => {
    const isLearned = learned.includes(term);
    if (isLearned) {
      progress.unmarkVocabLearned(level, term);
      setLearned((p) => p.filter((t) => t !== term));
    } else {
      progress.markVocabLearned(level, term);
      setLearned((p) => [...p, term]);
    }
  };

  const learnedCount = words.filter((w) => learned.includes(w.term)).length;

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-zinc-700">
              {words.length} words
            </span>
            <span className="font-mono text-xs text-zinc-400">· {learnedCount} learned</span>
          </div>
          <p className="text-xs font-mono text-zinc-400">
            Click ▶ to hear a word · Check ✓ to mark as learned
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pace selector */}
          <div className="flex items-center gap-1 border border-zinc-200">
            {PACE_OPTIONS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setPaceIndex(i)}
                className={`px-2.5 py-1 text-xs font-mono transition-colors ${
                  paceIndex === i ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Play all / Stop */}
          {isPlayingAll ? (
            <button
              onClick={stopAll}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-mono bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <Square size={12} fill="white" /> Stop
            </button>
          ) : (
            <button
              onClick={playAll}
              disabled={isPlayingAll}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-mono bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            >
              <Play size={12} fill="white" /> Play All
            </button>
          )}
        </div>
      </div>

      <Separator />

      {/* Word list */}
      <div className="border border-zinc-200 bg-white divide-y divide-zinc-50">
        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 border-b border-zinc-100">
          <div className="w-8 shrink-0" />
          <span className="flex-1 font-mono text-xs text-zinc-400 uppercase tracking-wide">Word / IPA</span>
          <span className="hidden sm:block font-mono text-xs text-zinc-400 uppercase tracking-wide shrink-0">Topic</span>
          <div className="w-4 shrink-0" />
        </div>

        {words.map((word, i) => (
          <WordRow
            key={word.term}
            word={word}
            isPlaying={playingIndex === i}
            learned={learned.includes(word.term)}
            audioState={audioStates[word.term] ?? "idle"}
            onPlay={() => playWord(word.term, i)}
            onToggleLearned={() => toggleLearned(word.term)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-amber-100 border border-amber-300 inline-block" /> Currently playing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-green-50 border border-green-200 inline-block" /> Learned
        </span>
      </div>
    </div>
  );
}
