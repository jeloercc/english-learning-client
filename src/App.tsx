/**
 * App.tsx — English Learning Dashboard
 *
 * Personal English learning app structured by CEFR levels (A1 → C2).
 * Sections: Vocabulary · Grammar · Dictionary · Phrases
 *
 * Design: Minimal editorial — monospace accents, flat/sharp, warm off-white.
 */

import { useState, useEffect } from "react";
import { BookOpen, Layers, Search, MessageSquare, ChevronRight, Headphones, PenLine } from "lucide-react";
import type { CEFRLevel } from "@/data/vocabulary";
import { VOCABULARY } from "@/data/vocabulary";
import { GRAMMAR } from "@/data/grammar";
import { PHRASES } from "@/data/phrases";
import { progress, loadFromServer } from "@/lib/progress";
import Vocabulary from "@/components/sections/Vocabulary";
import Grammar from "@/components/sections/Grammar";
import DictionarySearch from "@/components/sections/DictionarySearch";
import Phrases from "@/components/sections/Phrases";
import Pronunciation from "@/components/sections/Pronunciation";
import Writing from "@/components/sections/Writing";

type Section = "vocabulary" | "grammar" | "dictionary" | "phrases" | "pronunciation" | "writing";

const LEVELS: { id: CEFRLevel; label: string; color: string; bg: string; description: string }[] = [
  { id: "A1", label: "A1", color: "text-sky-700",    bg: "bg-sky-500",    description: "Beginner" },
  { id: "A2", label: "A2", color: "text-lime-700",   bg: "bg-lime-500",   description: "Elementary" },
  { id: "B1", label: "B1", color: "text-amber-700",  bg: "bg-amber-500",  description: "Intermediate" },
  { id: "B2", label: "B2", color: "text-orange-700", bg: "bg-orange-500", description: "Upper-Intermediate" },
  { id: "C1", label: "C1", color: "text-rose-700",   bg: "bg-rose-500",   description: "Advanced" },
  { id: "C2", label: "C2", color: "text-purple-700", bg: "bg-purple-500", description: "Mastery" },
];

const SECTIONS: { id: Section; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "vocabulary",    label: "Vocabulary",    icon: <BookOpen size={14} />,    description: "Word cards with flip & progress tracking" },
  { id: "grammar",       label: "Grammar",       icon: <Layers size={14} />,      description: "Grammar rules with examples" },
  { id: "pronunciation", label: "Pronunciation", icon: <Headphones size={14} />,  description: "IPA phonetics & audio per level" },
  { id: "writing",       label: "Writing",       icon: <PenLine size={14} />,     description: "Free editor with grammar check" },
  { id: "dictionary",    label: "Dictionary",    icon: <Search size={14} />,      description: "Live word lookup with audio" },
  { id: "phrases",       label: "Phrases",       icon: <MessageSquare size={14} />, description: "Essential phrases by situation" },
];

interface LevelStatsBarProps {
  level: CEFRLevel;
}

function LevelStatsBar({ level }: LevelStatsBarProps) {
  const [stats, setStats] = useState({ vocab: 0, grammar: 0, phrases: 0 });

  useEffect(() => {
    const data = progress.load();
    const lp = data[level];
    setStats({
      vocab:   lp.vocabularyLearned.length,
      grammar: lp.grammarCompleted.length,
      phrases: lp.phrasesLearned.length,
    });
  }, [level]);

  const totalVocab   = VOCABULARY[level].length;
  const totalGrammar = GRAMMAR[level].length;
  const totalPhrases = PHRASES[level].flatMap((t) => t.phrases).length;

  const items = [
    { label: "Vocab",   done: stats.vocab,   total: totalVocab,   color: "bg-green-500" },
    { label: "Grammar", done: stats.grammar, total: totalGrammar, color: "bg-blue-500" },
    { label: "Phrases", done: stats.phrases, total: totalPhrases, color: "bg-amber-500" },
  ];

  return (
    <div className="flex gap-4 flex-wrap">
      {items.map((item) => {
        const pct = item.total > 0 ? Math.round((item.done / item.total) * 100) : 0;
        return (
          <div key={item.label} className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-400 w-14">{item.label}</span>
            <div className="w-20 h-1.5 bg-zinc-200">
              <div className={`h-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="font-mono text-xs text-zinc-400">
              {item.done}/{item.total}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [activeLevel, setActiveLevel] = useState<CEFRLevel>("A1");
  const [activeSection, setActiveSection] = useState<Section>("vocabulary");

  useEffect(() => {
    loadFromServer().catch(() => {});
  }, []);

  const currentLevel = LEVELS.find((l) => l.id === activeLevel)!;
  const currentSection = SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-zinc-900" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Top bar */}
      <header className="border-b border-zinc-300 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-zinc-900">
            English
          </span>
          <span className="text-zinc-300">·</span>
          <span className="font-mono text-xs text-zinc-400">Personal Learning Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Level pill */}
          <div className="flex items-center gap-1.5 border border-zinc-200 bg-white px-3 py-1">
            <span className={`w-2 h-2 rounded-full ${currentLevel.bg}`} />
            <span className="font-mono text-xs font-semibold text-zinc-700">
              {currentLevel.id} — {currentLevel.description}
            </span>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-49px)]">
        {/* Left sidebar */}
        <nav className="w-56 shrink-0 bg-white border-r border-zinc-300 flex flex-col">
          {/* CEFR Level selector */}
          <div className="p-4 border-b border-zinc-200">
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">
              CEFR Level
            </p>
            <div className="grid grid-cols-3 gap-1">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setActiveLevel(lvl.id)}
                  className={`py-1.5 font-mono text-xs font-bold border transition-all ${
                    activeLevel === lvl.id
                      ? `${lvl.bg} text-white border-transparent`
                      : `bg-white ${lvl.color} border-zinc-200 hover:border-zinc-300`
                  }`}
                >
                  {lvl.id}
                </button>
              ))}
            </div>
            <p className="font-mono text-xs text-zinc-400 mt-2 text-center">
              {currentLevel.description}
            </p>
          </div>

          {/* Section navigation */}
          <div className="p-4 flex-1 space-y-1">
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">
              Section
            </p>
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-start gap-3 px-3 py-3 text-left transition-colors ${
                  activeSection === sec.id
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span className={`mt-0.5 ${activeSection === sec.id ? "text-white" : "text-zinc-400"}`}>
                  {sec.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold leading-none">{sec.label}</p>
                  <p className={`font-mono text-xs mt-1 leading-tight truncate ${
                    activeSection === sec.id ? "text-zinc-300" : "text-zinc-400"
                  }`}>
                    {sec.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-zinc-100">
            <p className="font-mono text-xs text-zinc-400 leading-relaxed">
              Dictionary uses a live API proxy at localhost:3001
            </p>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Content header */}
          <div className="border-b border-zinc-200 bg-white px-8 py-4">
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs mb-1">
              <span>{currentLevel.id}</span>
              <ChevronRight size={12} />
              <span>{currentSection.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-mono font-bold text-zinc-900 flex items-center gap-2">
                  {currentSection.icon}
                  {currentSection.label}
                </h1>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">{currentSection.description}</p>
              </div>
              {/* Only show stats for level-specific sections */}
              {activeSection !== "dictionary" && activeSection !== "writing" && (
                <LevelStatsBar level={activeLevel} />
              )}
            </div>
          </div>

          {/* Section content */}
          <div className="p-8">
            {activeSection === "vocabulary"    && <Vocabulary     level={activeLevel} />}
            {activeSection === "grammar"       && <Grammar        level={activeLevel} />}
            {activeSection === "pronunciation" && <Pronunciation  level={activeLevel} />}
            {activeSection === "writing"       && <Writing />}
            {activeSection === "dictionary"    && <DictionarySearch />}
            {activeSection === "phrases"       && <Phrases        level={activeLevel} />}
          </div>
        </main>
      </div>
    </div>
  );
}
