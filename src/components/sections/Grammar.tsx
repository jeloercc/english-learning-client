import { useState, useEffect } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { CONTENT, type CEFRLevel } from "@/data";
import { useLanguage } from "@/contexts/LanguageContext";
import { progress } from "@/lib/progress";
import { Separator } from "@/components/ui/separator";

interface RuleCardProps {
  rule: { title: string; explanation: string; structure: string; examples: string[]; notes?: string };
  index: number;
  completed: boolean;
  onToggle: () => void;
}

function RuleCard({ rule, index, completed, onToggle }: RuleCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border transition-colors ${
        completed ? "border-green-300 bg-green-50" : "border-zinc-200 bg-white"
      }`}
    >
      {/* Header row */}
      <div
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((o) => !o); }}
      >
        <span className="font-mono text-xs text-zinc-400 w-5 shrink-0">{index + 1}.</span>
        <span className="flex-1 font-mono text-sm font-semibold text-zinc-800">
          {rule.title}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="shrink-0 text-zinc-300 hover:text-green-500 transition-colors"
          title={completed ? "Mark as not done" : "Mark as done"}
        >
          {completed ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <Circle size={16} />
          )}
        </button>
        {open ? (
          <ChevronDown size={14} className="text-zinc-400 shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-zinc-400 shrink-0" />
        )}
      </div>

      {/* Expandable content */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-100">
          {/* Explanation */}
          <p className="text-sm text-zinc-700 leading-relaxed pt-3">
            {rule.explanation}
          </p>

          {/* Structure */}
          <div className="bg-zinc-900 text-white px-3 py-2">
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide mb-1">
              Structure
            </p>
            <p className="font-mono text-sm text-green-400">{rule.structure}</p>
          </div>

          {/* Examples */}
          <div className="space-y-2">
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wide">
              Examples
            </p>
            <ul className="space-y-1">
              {rule.examples.map((ex, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-700">
                  <span className="text-zinc-300 font-mono shrink-0">▸</span>
                  <span className="italic">{ex}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Notes */}
          {rule.notes && (
            <div className="border-l-2 border-amber-300 pl-3">
              <p className="text-xs font-mono text-amber-600 uppercase tracking-wide mb-0.5">
                Note
              </p>
              <p className="text-xs text-zinc-600">{rule.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GrammarProps {
  level: CEFRLevel;
}

export default function Grammar({ level }: GrammarProps) {
  const { language } = useLanguage();
  const rules = CONTENT[language].grammar[level];
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    const data = progress.load();
    setCompleted(data[level].grammarCompleted);
  }, [level, language]);

  const toggle = (index: number) => {
    progress.toggleGrammarCompleted(level, index);
    setCompleted((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const pct = rules.length > 0 ? Math.round((completed.length / rules.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-zinc-700">
            {rules.length} grammar rules
          </span>
          <span className="font-mono text-xs text-zinc-400">
            · {completed.length} completed ({pct}%)
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full max-w-48 bg-zinc-200">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <Separator />

      <p className="text-xs font-mono text-zinc-400">
        Click a rule to expand it. Check it off when you feel confident.
      </p>

      {rules.length === 0 ? (
        <p className="text-sm font-mono text-zinc-400 py-8 text-center">
          Content for this level is coming soon.
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <RuleCard
              key={i}
              rule={rule}
              index={i}
              completed={completed.includes(i)}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
