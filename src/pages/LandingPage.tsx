import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Layers, Search, MessageSquare, Headphones, PenLine,
  Check, ArrowRight, Menu, X,
} from "lucide-react";

const LEVEL_BADGES = [
  { id: "A1", bg: "bg-sky-500" },
  { id: "A2", bg: "bg-lime-500" },
  { id: "B1", bg: "bg-amber-500" },
  { id: "B2", bg: "bg-orange-500" },
  { id: "C1", bg: "bg-rose-500" },
  { id: "C2", bg: "bg-purple-500" },
];

const FEATURES = [
  {
    icon: <Search size={16} />,
    title: "Dictionary",
    description: "Look up any word instantly. Definitions, phonetics, audio pronunciation, synonyms, and idioms from a live API.",
  },
  {
    icon: <BookOpen size={16} />,
    title: "Vocabulary",
    description: "480+ curated word cards across all CEFR levels. IPA phonetics, definitions, examples, and topic tags.",
  },
  {
    icon: <Layers size={16} />,
    title: "Grammar",
    description: "Structured grammar rules with clear explanations, sentence patterns, and real-world examples per level.",
  },
  {
    icon: <Headphones size={16} />,
    title: "Pronunciation",
    description: "Native audio for every word. IPA guides and a Play All mode to drill through your level hands-free.",
  },
  {
    icon: <PenLine size={16} />,
    title: "Writing",
    description: "Distraction-free editor with real-time grammar checking. Catches spelling, style, and punctuation issues.",
  },
  {
    icon: <MessageSquare size={16} />,
    title: "Phrases",
    description: "Essential phrases by situation — greetings, travel, emergencies, opinions. Each with Spanish translation.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Pick your level",
    description: "Choose your CEFR level from A1 (beginner) to C2 (mastery). All six levels are unlocked from day one.",
  },
  {
    number: "02",
    title: "Choose a tool",
    description: "Open any of the six learning tools. Study vocabulary, drill grammar, practice pronunciation, or write with live feedback.",
  },
  {
    number: "03",
    title: "Track your progress",
    description: "Mark words, rules, and phrases as learned. Progress saves locally for free — upgrade to Pro to sync across devices.",
  },
];

const FREE_FEATURES = [
  "All 480+ vocabulary cards",
  "All grammar guides",
  "Live dictionary lookups",
  "Pronunciation with audio",
  "Writing with grammar check",
  "All phrase collections",
  "All CEFR levels (A1–C2)",
  "Local progress saving",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Cloud progress syncing",
  "Cross-device access",
  "Learning analytics dashboard",
  "Priority support",
  "Early access to new tools",
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-zinc-900" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* ─── Nav ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-300 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-zinc-900">
            English
          </span>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6">
            <button onClick={() => scrollTo("features")} className="font-mono text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
              Tools
            </button>
            <button onClick={() => scrollTo("pricing")} className="font-mono text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
              Pricing
            </button>
            <Link
              to="/app"
              className="font-mono text-xs bg-zinc-900 text-white px-4 py-2 hover:bg-zinc-700 transition-colors"
            >
              Open Dashboard
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNav(!mobileNav)}
            className="sm:hidden p-1 text-zinc-600 hover:text-zinc-900 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNav && (
          <div className="sm:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-3">
            <button
              onClick={() => { scrollTo("features"); setMobileNav(false); }}
              className="block w-full text-left font-mono text-sm text-zinc-600 hover:text-zinc-900 transition-colors py-1"
            >
              Tools
            </button>
            <button
              onClick={() => { scrollTo("pricing"); setMobileNav(false); }}
              className="block w-full text-left font-mono text-sm text-zinc-600 hover:text-zinc-900 transition-colors py-1"
            >
              Pricing
            </button>
            <Link
              to="/app"
              className="block w-full font-mono text-sm text-center bg-zinc-900 text-white px-4 py-2 hover:bg-zinc-700 transition-colors"
            >
              Open Dashboard
            </Link>
          </div>
        )}
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left — copy */}
          <div>
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-4">
              Free English & Spanish Tools · A1 to C2
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 leading-[1.1] tracking-tight">
              Learn English and Spanish at your own pace.
              <span className="text-zinc-400"> Aprende inglés y español — todos los niveles (A1-C2), sin costo.</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-500 leading-relaxed max-w-lg mt-5 sm:mt-6">
              480+ vocabulary cards, grammar guides, pronunciation drills, a live dictionary,
              writing checker, and essential phrases — structured by CEFR levels from beginner to mastery, for both languages.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6 sm:mt-8">
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 font-mono text-sm bg-zinc-900 text-white px-6 py-3 hover:bg-zinc-700 transition-colors"
              >
                Start Learning <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => scrollTo("features")}
                className="font-mono text-sm border border-zinc-300 bg-white text-zinc-700 px-6 py-3 hover:bg-zinc-50 transition-colors"
              >
                See what's included
              </button>
            </div>
          </div>

          {/* Right — app preview */}
          <div className="border border-zinc-300 bg-white">
            {/* Mini header */}
            <div className="border-b border-zinc-200 px-5 py-3 flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-zinc-900">English</span>
              <span className="text-zinc-300">·</span>
              <span className="font-mono text-xs text-zinc-400">Dashboard Preview</span>
            </div>
            {/* Level badges */}
            <div className="px-5 pt-4 pb-3 border-b border-zinc-100">
              <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-2">CEFR Level</p>
              <div className="flex gap-1">
                {LEVEL_BADGES.map((lvl) => (
                  <span
                    key={lvl.id}
                    className={`${lvl.bg} text-white font-mono text-xs font-bold px-3 py-1`}
                  >
                    {lvl.id}
                  </span>
                ))}
              </div>
            </div>
            {/* Sample vocab cards */}
            <div className="divide-y divide-zinc-100">
              {[
                { term: "serendipity", ipa: "/ˌsɛr.ənˈdɪp.ɪ.ti/", def: "the occurrence of happy events by chance" },
                { term: "eloquent", ipa: "/ˈɛl.ə.kwənt/", def: "fluent or persuasive in speaking or writing" },
                { term: "resilience", ipa: "/rɪˈzɪl.i.əns/", def: "the capacity to recover quickly from difficulties" },
              ].map((w) => (
                <div key={w.term} className="px-5 py-3 flex items-start gap-4">
                  <div className="w-7 h-7 border border-zinc-200 flex items-center justify-center shrink-0">
                    <Headphones size={12} className="text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-sm font-bold text-zinc-900">{w.term}</span>
                      <span className="font-mono text-xs text-zinc-400">{w.ipa}</span>
                    </div>
                    <p className="font-mono text-xs text-zinc-400 mt-0.5">{w.def}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-2 bg-zinc-50 border-t border-zinc-100">
              <p className="font-mono text-xs text-zinc-400">80 words per level · 480+ total</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="border-t border-zinc-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-2">Tools</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-zinc-900 mb-12">
            Six tools to cover every angle of English.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-zinc-300">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="border-b border-r border-zinc-300 bg-white p-6 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-zinc-400">{f.icon}</span>
                  <h3 className="font-mono text-sm font-semibold text-zinc-900">{f.title}</h3>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────── */}
      <section className="border-t border-zinc-300 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-2">How it works</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-zinc-900 mb-12">
            From zero to fluent in three steps.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {STEPS.map((s) => (
              <div key={s.number}>
                <span className="font-mono text-5xl font-bold text-zinc-200">{s.number}</span>
                <h3 className="font-mono text-sm font-semibold text-zinc-900 mt-3">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mt-2">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-zinc-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-2">Pricing</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-zinc-900 mb-12">
            All content is free. Save your progress for $3/month.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl">
            {/* Free */}
            <div className="border border-zinc-300 bg-white p-8">
              <p className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest">Free</p>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-4xl font-bold text-zinc-900">$0</span>
                <span className="text-sm text-zinc-400">forever</span>
              </div>
              <div className="border-t border-zinc-200 mt-6 pt-6 space-y-3">
                {FREE_FEATURES.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={14} className="text-zinc-400 mt-0.5 shrink-0" />
                    <span className="font-mono text-sm text-zinc-600">{f}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/app"
                className="block w-full mt-8 font-mono text-sm text-center border border-zinc-300 bg-white text-zinc-700 py-3 hover:bg-zinc-50 transition-colors"
              >
                Start for Free
              </Link>
            </div>
            {/* Pro */}
            <div className="border border-zinc-900 bg-zinc-900 p-8 text-white">
              <p className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest">Pro</p>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-4xl font-bold text-white">$3</span>
                <span className="text-sm text-zinc-400">/month</span>
              </div>
              <div className="border-t border-zinc-700 mt-6 pt-6 space-y-3">
                {PRO_FEATURES.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                    <span className="font-mono text-sm text-zinc-300">{f}</span>
                  </div>
                ))}
              </div>
              <button
                className="block w-full mt-8 font-mono text-sm text-center bg-white text-zinc-900 py-3 hover:bg-zinc-100 transition-colors cursor-not-allowed opacity-80"
                title="Coming soon"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-300 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-zinc-900">
                English + Español
              </span>
              <p className="font-mono text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
                A free English and Spanish learning platform structured by CEFR levels.
                Built for self-learners who want real tools, not gamification.
              </p>
            </div>
            {/* Tools */}
            <div>
              <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">Tools</p>
              <div className="space-y-2">
                {["Dictionary", "Vocabulary", "Grammar", "Pronunciation", "Writing", "Phrases"].map((t) => (
                  <Link key={t} to="/app" className="block font-mono text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
                    {t}
                  </Link>
                ))}
              </div>
            </div>
            {/* Links */}
            <div>
              <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">Project</p>
              <div className="space-y-2">
                <a href="https://github.com/jeloercc" target="_blank" rel="noopener noreferrer" className="block font-mono text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
                  GitHub
                </a>
                <button onClick={() => scrollTo("pricing")} className="block font-mono text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
                  Pricing
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-200 mt-8 pt-6">
            <p className="font-mono text-xs text-zinc-400">
              &copy; 2026 English & Spanish Learning. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
