import { useState, useEffect } from "react";
import { CheckCircle, Circle } from "lucide-react";
import { PHRASES, type CEFRLevel, type Phrase } from "@/data/phrases";
import { progress } from "@/lib/progress";
import { Separator } from "@/components/ui/separator";

interface PhraseRowProps {
  phrase: Phrase;
  learned: boolean;
  onToggle: () => void;
}

function PhraseRow({ phrase, learned, onToggle }: PhraseRowProps) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <div
      className={`border-b border-zinc-100 last:border-0 py-3 px-1 flex gap-3 items-start transition-colors ${
        learned ? "bg-green-50" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className="shrink-0 mt-0.5 text-zinc-300 hover:text-green-500 transition-colors"
      >
        {learned ? (
          <CheckCircle size={15} className="text-green-500" />
        ) : (
          <Circle size={15} />
        )}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-mono font-semibold text-zinc-800 leading-snug">
          {phrase.phrase}
        </p>
        <p className="text-xs text-zinc-400 italic">{phrase.context}</p>

        <button
          onClick={() => setShowTranslation((s) => !s)}
          className="text-xs font-mono text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          {showTranslation ? "▲ hide" : "▼ translation"}
        </button>

        {showTranslation && (
          <p className="text-sm text-zinc-600 font-mono border-l-2 border-zinc-200 pl-2">
            {phrase.translation}
          </p>
        )}

        {phrase.example && showTranslation && (
          <p className="text-xs text-zinc-400 italic pl-3">e.g. {phrase.example}</p>
        )}
      </div>
    </div>
  );
}

interface PhrasesProps {
  level: CEFRLevel;
}

export default function Phrases({ level }: PhrasesProps) {
  const topics = PHRASES[level];
  const [learnedPhrases, setLearnedPhrases] = useState<string[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>(topics[0]?.topic ?? "");

  useEffect(() => {
    const data = progress.load();
    setLearnedPhrases(data[level].phrasesLearned);
    setActiveTopic(PHRASES[level][0]?.topic ?? "");
  }, [level]);

  const toggle = (phrase: string) => {
    progress.togglePhraseLearned(level, phrase);
    setLearnedPhrases((prev) =>
      prev.includes(phrase) ? prev.filter((p) => p !== phrase) : [...prev, phrase]
    );
  };

  const allPhrases = topics.flatMap((t) => t.phrases);
  const learnedCount = allPhrases.filter((p) => learnedPhrases.includes(p.phrase)).length;
  const pct = Math.round((learnedCount / allPhrases.length) * 100);

  const currentTopic = topics.find((t) => t.topic === activeTopic);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-zinc-700">
            {allPhrases.length} phrases
          </span>
          <span className="font-mono text-xs text-zinc-400">
            · {learnedCount} learned ({pct}%)
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full max-w-48 bg-zinc-200">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <Separator />

      {/* Topic tabs */}
      <div className="flex flex-wrap gap-1.5">
        {topics.map((t) => {
          const tLearned = t.phrases.filter((p) => learnedPhrases.includes(p.phrase)).length;
          const isActive = activeTopic === t.topic;
          return (
            <button
              key={t.topic}
              onClick={() => setActiveTopic(t.topic)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.topic}</span>
              {tLearned > 0 && (
                <span
                  className={`text-xs ${isActive ? "text-green-400" : "text-green-500"}`}
                >
                  ✓{tLearned}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Phrase list */}
      {currentTopic && (
        <div className="bg-white border border-zinc-200">
          <div className="px-4 py-2 border-b border-zinc-100 flex items-center gap-2">
            <span className="text-base">{currentTopic.icon}</span>
            <span className="font-mono text-sm font-semibold text-zinc-700">
              {currentTopic.topic}
            </span>
            <span className="font-mono text-xs text-zinc-400 ml-auto">
              {currentTopic.phrases.length} phrases
            </span>
          </div>
          <div className="px-4 divide-y divide-zinc-50">
            {currentTopic.phrases.map((phrase) => (
              <PhraseRow
                key={phrase.phrase}
                phrase={phrase}
                learned={learnedPhrases.includes(phrase.phrase)}
                onToggle={() => toggle(phrase.phrase)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
