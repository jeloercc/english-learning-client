import { useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertCircle, RotateCcw, ChevronDown } from "lucide-react";
import { checkGrammar } from "@/lib/api";
import type { GrammarMatch } from "@/types";
import { Separator } from "@/components/ui/separator";

// ─── Error category helpers ───────────────────────────────────────────────────

const ISSUE_META: Record<string, { label: string; color: string; dot: string }> = {
  grammar:       { label: "Grammar",      color: "text-red-600",    dot: "bg-red-500" },
  spelling:      { label: "Spelling",     color: "text-amber-600",  dot: "bg-amber-500" },
  style:         { label: "Style",        color: "text-blue-600",   dot: "bg-blue-500" },
  punctuation:   { label: "Punctuation",  color: "text-purple-600", dot: "bg-purple-500" },
  typographical: { label: "Typo",         color: "text-purple-600", dot: "bg-purple-500" },
};

function issueMeta(type: string) {
  return ISSUE_META[type.toLowerCase()] ?? { label: type, color: "text-zinc-600", dot: "bg-zinc-400" };
}

function issueClass(type: string) {
  const t = type.toLowerCase();
  if (t === "grammar")                          return "grammar-error-grammar";
  if (t === "spelling")                         return "grammar-error-spelling";
  if (t === "style")                            return "grammar-error-style";
  if (t === "punctuation" || t === "typographical") return "grammar-error-punctuation";
  return "grammar-error-other";
}

// ─── Build annotated segments from matches ────────────────────────────────────
// Returns an array of { text, matchIndex? } — plain text chunks and error spans.

interface Segment {
  text: string;
  matchIndex?: number;
}

function buildSegments(text: string, matches: GrammarMatch[]): Segment[] {
  // Sort matches by offset, resolve overlaps (drop overlapping ones)
  const sorted = [...matches].sort((a, b) => a.offset - b.offset);
  const clean: GrammarMatch[] = [];
  let cursor = 0;
  for (const m of sorted) {
    if (m.offset >= cursor) {
      clean.push(m);
      cursor = m.offset + m.length;
    }
  }

  const segments: Segment[] = [];
  let pos = 0;
  for (let i = 0; i < clean.length; i++) {
    const m = clean[i];
    if (m.offset > pos) {
      segments.push({ text: text.slice(pos, m.offset) });
    }
    segments.push({ text: text.slice(m.offset, m.offset + m.length), matchIndex: i });
    pos = m.offset + m.length;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos) });
  }
  return segments;
}

// ─── Inline correction popover ────────────────────────────────────────────────

interface PopoverProps {
  match: GrammarMatch;
  onApply: (replacement: string) => void;
  onDismiss: () => void;
}

function ErrorPopover({ match, onApply, onDismiss }: PopoverProps) {
  const meta = issueMeta(match.rule.issueType);
  return (
    <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-white border border-zinc-200 shadow-md p-3 space-y-2"
         onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-xs font-mono font-semibold ${meta.color}`}>{meta.label}</span>
          <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{match.message}</p>
        </div>
        <button onClick={onDismiss} className="text-zinc-300 hover:text-zinc-600 shrink-0 text-xs">✕</button>
      </div>
      {match.replacements.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Suggestions</p>
          <div className="flex flex-wrap gap-1">
            {match.replacements.slice(0, 4).map((r, i) => (
              <button
                key={i}
                onClick={() => onApply(r)}
                className="px-2 py-0.5 text-xs font-mono bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Annotated results view ───────────────────────────────────────────────────

interface ResultsViewProps {
  text: string;
  matches: GrammarMatch[];
  activeIndex: number | null;
  onClickMatch: (i: number) => void;
  onApply: (matchIndex: number, replacement: string) => void;
  onDismiss: () => void;
}

function ResultsView({ text, matches, activeIndex, onClickMatch, onApply, onDismiss }: ResultsViewProps) {
  // Rebuild segments from current matches (after applying fixes, matches are updated)
  const segments = buildSegments(text, matches);

  return (
    <div className="relative">
      <div
        className="w-full min-h-48 p-4 text-sm font-mono leading-relaxed bg-white border border-zinc-200 whitespace-pre-wrap"
        onClick={onDismiss}
      >
        {segments.map((seg, i) => {
          if (seg.matchIndex === undefined) {
            return <span key={i}>{seg.text}</span>;
          }
          const mi = seg.matchIndex;
          const m  = matches[mi];
          const isActive = activeIndex === mi;
          return (
            <span key={i} className="relative inline">
              <mark
                className={`grammar-error ${issueClass(m.rule.issueType)} ${isActive ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); onClickMatch(mi); }}
              >
                {seg.text}
              </mark>
              {isActive && (
                <ErrorPopover
                  match={m}
                  onApply={(r) => onApply(mi, r)}
                  onDismiss={onDismiss}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Error summary bar ────────────────────────────────────────────────────────

function ErrorSummary({ matches }: { matches: GrammarMatch[] }) {
  if (matches.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 size={14} />
        <span className="text-sm font-mono">No errors found — great writing!</span>
      </div>
    );
  }

  const counts: Record<string, number> = {};
  for (const m of matches) {
    const t = m.rule.issueType.toLowerCase();
    counts[t] = (counts[t] ?? 0) + 1;
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-zinc-700">
        <AlertCircle size={14} className="text-zinc-400" />
        <span className="font-mono text-sm font-semibold">{matches.length} error{matches.length > 1 ? "s" : ""}</span>
      </div>
      <span className="text-zinc-300">·</span>
      {Object.entries(counts).map(([type, count]) => {
        const meta = issueMeta(type);
        return (
          <div key={type} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
            <span className={`text-xs font-mono ${meta.color}`}>{count} {meta.label.toLowerCase()}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Writing component ───────────────────────────────────────────────────

const LANG_OPTIONS = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "en-AU", label: "English (AU)" },
];

const WORD_LIMIT = 500;

export default function Writing() {
  const [text, setText]           = useState("");
  const [mode, setMode]           = useState<"editing" | "results">("editing");
  const [matches, setMatches]     = useState<GrammarMatch[]>([]);
  const [activeMatch, setActive]  = useState<number | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [language, setLanguage]   = useState("en-US");
  const [showLang, setShowLang]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleCheck = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setActive(null);

    try {
      const result = await checkGrammar(text, language);
      setMatches(result);
      setMode("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grammar check failed.");
    } finally {
      setLoading(false);
    }
  }, [text, language]);

  const handleApply = (matchIndex: number, replacement: string) => {
    // Apply the fix: find the match's position in the original text
    const m = matches[matchIndex];
    const newText = text.slice(0, m.offset) + replacement + text.slice(m.offset + m.length);
    setText(newText);
    setActive(null);
    // Re-run check on updated text so offsets stay in sync
    setMode("editing");
    setMatches([]);
  };

  const handleEditAgain = () => {
    setMode("editing");
    setMatches([]);
    setActive(null);
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleReset = () => {
    setText("");
    handleEditAgain();
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLang((s) => !s)}
              className="flex items-center gap-1.5 border border-zinc-200 bg-white px-3 py-1.5 text-xs font-mono text-zinc-600 hover:border-zinc-400 transition-colors"
            >
              {LANG_OPTIONS.find((l) => l.code === language)?.label ?? language}
              <ChevronDown size={11} />
            </button>
            {showLang && (
              <div className="absolute top-full mt-0.5 left-0 z-20 bg-white border border-zinc-200 shadow-sm min-w-36">
                {LANG_OPTIONS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); setShowLang(false); }}
                    className={`block w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-zinc-50 transition-colors ${language === l.code ? "text-zinc-900 font-semibold" : "text-zinc-600"}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Word / char count */}
          <span className="font-mono text-xs text-zinc-400">
            {wordCount} words · {charCount}/{WORD_LIMIT} chars
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mode === "results" && (
            <button
              onClick={handleEditAgain}
              className="px-3 py-1.5 text-xs font-mono border border-zinc-300 text-zinc-600 hover:border-zinc-500 transition-colors"
            >
              ← Edit again
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-red-500 transition-colors"
          >
            <RotateCcw size={11} /> Reset
          </button>
          {mode === "editing" && (
            <button
              onClick={handleCheck}
              disabled={loading || !text.trim() || charCount > WORD_LIMIT}
              className="px-4 py-1.5 text-sm font-mono bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            >
              {loading ? "Checking…" : "Check my writing"}
            </button>
          )}
        </div>
      </div>

      <Separator />

      {/* Editor or Results */}
      {mode === "editing" ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, WORD_LIMIT))}
          placeholder={`Write anything in English…\n\nFor example:\n  "Yesterday I go to the market and buyed many thing."\n  "She have a very nice house in the mountains."`}
          rows={12}
          className="w-full p-4 text-sm font-mono leading-relaxed bg-white border border-zinc-200
                     focus:outline-none focus:border-zinc-500 placeholder:text-zinc-300 resize-y"
          autoFocus
        />
      ) : (
        <ResultsView
          text={text}
          matches={matches}
          activeIndex={activeMatch}
          onClickMatch={setActive}
          onApply={handleApply}
          onDismiss={() => setActive(null)}
        />
      )}

      {/* Error summary */}
      {mode === "results" && (
        <>
          <Separator />
          <ErrorSummary matches={matches} />
        </>
      )}

      {/* API error */}
      {error && (
        <div className="p-3 border border-red-200 bg-red-50">
          <p className="text-sm font-mono text-red-700">{error}</p>
        </div>
      )}

      {/* Tips while editing */}
      {mode === "editing" && !text && (
        <div className="space-y-1.5 pt-2">
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Tips</p>
          <ul className="space-y-1">
            {[
              "Write a few sentences about your day",
              "Describe a place you visited",
              "Tell a short story about an experience",
              "Write your opinion on a topic",
            ].map((tip, i) => (
              <li key={i}
                onClick={() => { setText(tip + " "); textareaRef.current?.focus(); }}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-700 cursor-pointer flex items-center gap-1.5 transition-colors">
                <span className="text-zinc-300">▸</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
