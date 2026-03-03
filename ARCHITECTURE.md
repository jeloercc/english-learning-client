# Architecture — english-learning-client

React + TypeScript SPA. A personal English learning dashboard organized around CEFR levels
(A1 → C2). All API calls go through the backend proxy — the frontend never contacts
external APIs directly.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [File Map](#2-file-map)
3. [State Architecture](#3-state-architecture)
4. [Progress System](#4-progress-system)
5. [API Client Layer](#5-api-client-layer)
6. [Component Reference](#6-component-reference)
7. [Data Layer](#7-data-layer)
8. [Type Definitions](#8-type-definitions)
9. [Styling System](#9-styling-system)
10. [Environment Variables](#10-environment-variables)
11. [Build System](#11-build-system)
12. [Data Flow Examples](#12-data-flow-examples)

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    React SPA  :5173                          │
│                                                              │
│  App.tsx                                                     │
│  ├─ State: { level: CEFRLevel, section: Section }            │
│  ├─ LevelStatsBar (progress bars)                            │
│  └─ <Section level={level} />                                │
│      │                                                       │
│      ├─ Vocabulary.tsx    (flip cards, live data)            │
│      ├─ Grammar.tsx       (expandable rule cards)            │
│      ├─ Pronunciation.tsx (audio list, play all)             │
│      ├─ Writing.tsx       (textarea + grammar check)         │
│      ├─ DictionarySearch.tsx (lookup + word explorer)        │
│      └─ Phrases.tsx       (topic tabs + phrase list)         │
│                                                              │
│  lib/api.ts       ← fetch wrapper (timeout, error norm.)    │
│  lib/progress.ts  ← localStorage + server sync              │
│  data/*.ts        ← static content (vocab, grammar, phrases) │
│  types/index.ts   ← shared TypeScript interfaces            │
└──────────────────────────────────────────────────────────────┘
         │
         │  All API calls  →  VITE_API_URL (default: http://localhost:3001)
         │  Authorization: Bearer VITE_PROGRESS_TOKEN (progress routes only)
         ▼
  english-learning-app  (backend proxy)
```

---

## 2. File Map

```
english-learning-client/
│
├── src/
│   ├── main.tsx                          # React entry point. Mounts <App /> to #root.
│   ├── App.tsx                           # Root layout + navigation. Top-level state.
│   │
│   ├── components/
│   │   ├── sections/
│   │   │   ├── Vocabulary.tsx            # Word flip cards with live API enrichment
│   │   │   ├── Grammar.tsx               # Expandable rule cards with completion tracking
│   │   │   ├── Pronunciation.tsx         # Audio playback list + Play All mode
│   │   │   ├── Writing.tsx               # Free editor + inline grammar annotation
│   │   │   ├── DictionarySearch.tsx      # Live word lookup + word explorer panel
│   │   │   └── Phrases.tsx               # Topic-tabbed phrase list with translations
│   │   └── ui/                           # shadcn/ui components (Radix primitives)
│   │
│   ├── data/
│   │   ├── vocabulary.ts                 # 820 VocabWord objects across 6 CEFR levels
│   │   ├── grammar.ts                    # GrammarRule objects per level
│   │   └── phrases.ts                    # PhraseTopic arrays per level
│   │
│   ├── lib/
│   │   ├── api.ts                        # Typed fetch helpers for the backend proxy
│   │   └── progress.ts                   # Progress read/write with localStorage + server sync
│   │
│   ├── types/
│   │   └── index.ts                      # All shared TypeScript interfaces
│   │
│   ├── hooks/                            # Custom React hooks
│   ├── assets/                           # Static assets
│   ├── index.css                         # Tailwind directives + global CSS variables
│   └── App.css                           # App-level styles
│
├── public/                               # Static files served as-is
├── index.html                            # Vite HTML template (React root: #root)
├── vite.config.ts                        # Vite config: React plugin + path alias @/
├── tailwind.config.js                    # Tailwind: custom colors, animations
├── tsconfig.json                         # TypeScript: strict mode, path aliases
├── .env                                  # Local secrets (gitignored)
└── .env.example                          # Template for .env
```

---

## 3. State Architecture

The app uses **local React state only** — no global store (no Redux, no Zustand, no Context).

### `App.tsx` — top-level state

```typescript
const [level,   setLevel]   = useState<CEFRLevel>("A1")  // current CEFR level
const [section, setSection] = useState<Section>("vocabulary")  // current view
```

State flows **down** via props. Each section receives `level` as a prop and is fully
self-contained — switching levels remounts the section component via the `key={level}` pattern
(where used), resetting its internal state.

```typescript
type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
type Section   = "vocabulary" | "grammar" | "dictionary" | "phrases" | "pronunciation" | "writing"
```

### Section-level state

Each section manages its own state independently:

| Section | Key state |
|---|---|
| Vocabulary | `learned[]`, `filter`, `liveData` cache (per word) |
| Grammar | `completed[]`, `open` rule index |
| Pronunciation | `audioCache`, `playingIndex`, `pace`, `learned[]` |
| Writing | `text`, `mode` (editing/results), `matches[]`, `activeMatch` |
| DictionarySearch | `query`, `entry`, `wordExplorer data`, `history[]` |
| Phrases | `learnedPhrases[]`, `activeTopic` |

### Progress state

Progress (learned words, completed grammar, learned phrases) lives in **two places simultaneously**:

1. `localStorage` — instant read/write, survives reload, local to this browser
2. SQLite (backend) — authoritative, survives clearing localStorage, accessible from other devices

See [Section 4: Progress System](#4-progress-system) for the full sync strategy.

---

## 4. Progress System

**File**: `src/lib/progress.ts`

### Data shape

```typescript
interface LevelProgress {
  vocabularyLearned: string[]   // word terms, e.g. ["hello", "goodbye"]
  grammarCompleted:  number[]   // rule indices, e.g. [0, 2, 5]
  phrasesLearned:    string[]   // full phrase strings
  wordsSearched:     string[]   // recent dictionary searches (local-only, max 20)
}

// One LevelProgress per CEFR level
type ProgressStore = Record<CEFRLevel, LevelProgress>
```

### localStorage key
`"englishLearning_progress"` — JSON-stringified `ProgressStore`

### Reading

```typescript
progress.load()   // → Record<CEFRLevel, LevelProgress>
                  //   Reads from localStorage. Returns defaultProgress() if empty.
```

### Writing (all operations are synchronous on localStorage + async fire-and-forget to server)

```typescript
progress.markVocabLearned(level, term)       // add term
progress.unmarkVocabLearned(level, term)     // remove term
progress.markGrammarCompleted(level, index)  // add index (if not already there)
progress.toggleGrammarCompleted(level, index)// toggle (add or remove)
progress.markPhraseLearned(level, phrase)    // add phrase
progress.togglePhraseLearned(level, phrase)  // toggle
progress.addWordSearched(level, word)        // prepend to wordsSearched, trim to 20
progress.reset(level?)                       // clear one level or all
```

### Server sync

```typescript
// Called once on app mount (App.tsx useEffect)
await loadFromServer()
```

`loadFromServer()` flow:
1. `GET /api/progress` with Bearer token
2. If response ok → merges server data into localStorage
   - `vocabularyLearned`, `grammarCompleted`, `phrasesLearned` → **overwritten** by server (server is authoritative)
   - `wordsSearched` → **kept as-is** from localStorage (local-only, server doesn't know about it)
3. Saves merged result back to localStorage
4. On any error → logs `console.warn` and returns silently (app works offline)

### Fire-and-forget pattern

Every local write also triggers an async server sync:

```typescript
// Example from markVocabLearned:
data[level].vocabularyLearned.push(term)
save(data)              // ← synchronous, instant UI
syncVocab("POST", level, term)  // ← async, non-blocking, silently fails if server is down
```

This means the UI **never waits** for the server. If the server is offline, changes are
preserved in localStorage and will be overwritten next time `loadFromServer()` runs with
current server state. This is acceptable for a single-user personal app.

### Auth header

```typescript
const PROGRESS_TOKEN = import.meta.env.VITE_PROGRESS_TOKEN as string | undefined

function progressHeaders(): Record<string, string> {
  const headers = { "Content-Type": "application/json" }
  if (PROGRESS_TOKEN) headers["Authorization"] = `Bearer ${PROGRESS_TOKEN}`
  return headers
}
```

Token is optional in development (server also skips auth if `PROGRESS_TOKEN` is not set).
In production, both must have the same token value.

---

## 5. API Client Layer

**File**: `src/lib/api.ts`

Base URL: `(import.meta.env.VITE_API_URL ?? "http://localhost:3001") + "/api"`

### Core function

```typescript
async function proxyFetch<T>(path: string): Promise<T>
```

- Attaches a 10-second `AbortController` timeout
- Throws `"Request timed out."` on abort
- On non-2xx response: extracts `.error` from JSON body and throws it
- All inputs are `encodeURIComponent`-encoded before use in URLs

### Exported functions

```typescript
// Dictionary
lookupWord(word: string): Promise<DictionaryEntry>

// Grammar
checkGrammar(text: string, language?: string): Promise<GrammarMatch[]>
// Note: 20-second timeout (LanguageTool is slow)

// Audio
getWordAudio(word: string): Promise<string | null>  // null on any error

// Word Explorer (all return string[])
getWordRhymes(word)
getWordSimilar(word)
getWordAdjectives(word)
getAutocomplete(q): Promise<string[]>

// Weather
geocodeLocation(name: string): Promise<GeocodingResult>
getForecast(lat: number, lon: number): Promise<WeatherData>

// Countries
getAllCountries(): Promise<Country[]>
searchCountries(name: string): Promise<Country[]>
getCountryByCode(code: string): Promise<Country>
```

---

## 6. Component Reference

### `App.tsx`

**Purpose**: Root layout, CEFR level selector, section navigation, progress bars.

**Layout structure**:
```
<div class="min-h-screen" style="background: #F5F4F0">
  <header>   ← "ENGLISH · Personal Learning Dashboard" + level pill
  <div class="flex">
    <nav>    ← Left sidebar (220px)
             │  CEFR LEVEL: [A1][A2][B1] / [B2][C1][C2]
             │  SECTION: Vocabulary / Grammar / Pronunciation / Writing / Dictionary / Phrases
    <main>   ← Content area
             │  <LevelStatsBar level={level} />
             │  <CurrentSection level={level} />
```

**`LevelStatsBar`** (inner component):
- Calls `progress.load()` to read current level's stats
- Renders three labeled progress bars: `Vocab X/Y`, `Grammar X/Y`, `Phrases X/Y`
- Re-renders on level change (receives `level` prop)

**`useEffect`**: Calls `loadFromServer()` once on mount.

---

### `Vocabulary.tsx`

**Purpose**: Word cards that flip to reveal enriched live data.

**Props**: `{ level: CEFRLevel }`

**Key state**:
```typescript
const [learned, setLearned] = useState<string[]>([])  // from progress
const [filter,  setFilter]  = useState<"all"|"learned"|"new">("all")
const liveCache = useRef<Record<string, DictionaryEntry>>({})  // in-memory cache
```

**`WordCard` component** (inner, memoized):
```typescript
// Props: { word: VocabWord, learned: boolean, onToggle: () => void }
// State: { flipped, liveData, fetching }
```

Card behavior:
- **Front** (not flipped): term, IPA, part-of-speech, topic tag, toggle button
- **Click** → `flipped = true` + triggers `fetchLiveEntry(word.term)` if not cached
- **Back** (flipped):
  - Static definition (from `data/vocabulary.ts`)
  - Live definitions (from backend API, up to 3 additional, grayed out)
  - Example sentence
  - Synonyms chips (max 8, clickable — searches in Dictionary section)
  - Antonyms chips (max 6)
  - Idioms (max 3, phrase + definition)
  - Audio button (plays `liveData.audioUrl`)
- **Learned toggle**: `e.stopPropagation()` to prevent flip on click

**Filter logic**:
```typescript
const displayed = words.filter(w =>
  filter === "learned" ? learned.includes(w.term) :
  filter === "new"     ? !learned.includes(w.term) :
  true
)
```

**Reset button**: Calls `progress.reset(level)` + clears local `learned` state.

---

### `Grammar.tsx`

**Purpose**: Grammar rules displayed as expandable cards with completion tracking.

**Props**: `{ level: CEFRLevel }`

**`RuleCard` component** (inner):
```typescript
// Props: { rule: GrammarRule, index: number, completed: boolean, onToggle: () => void }
// State: { open: boolean }
```

HTML structure (important — no nested `<button>`):
```
<div>                         ← wrapper with green border when completed
  <div role="button"          ← expand/collapse row (div, not button)
       tabIndex={0}           ← keyboard accessible (Enter/Space triggers expand)
       cursor-pointer>
    {index}. {title}          ← left
    <button title="Mark...">  ← standalone button (not nested)
      <Circle|CheckCircle />
    </button>
    <ChevronRight|Down />
  </div>

  {open && (                  ← expanded content
    <div>
      <p>{explanation}</p>
      <div bg-zinc-900>{structure}</div>  ← dark code block
      <ul>{examples}</ul>
      {notes && <aside>{notes}</aside>}   ← amber callout
    </div>
  )}
</div>
```

**Why `<div role="button">` not `<button>`**:
A `<button>` cannot be a descendant of another `<button>` (HTML spec). The "Mark as done"
button is inside the header row, so the row container must be a div with role="button"
to avoid the nested button violation that caused a hydration error.

**Toggle logic**: `progress.toggleGrammarCompleted(level, index)` — adds if not in array, removes if present.

---

### `Pronunciation.tsx`

**Purpose**: Audio-focused learning — one word per row with real Merriam-Webster audio.

**Props**: `{ level: CEFRLevel }`

**Key state**:
```typescript
const [audioCache, setAudioCache] = useState<Record<string, "idle"|"loading"|"ready"|"error">>({})
const [audioUrls,  setAudioUrls]  = useState<Record<string, string>>({})
const [playingIdx, setPlayingIdx] = useState<number | null>(null)
const [pace, setPace] = useState<"slow"|"normal"|"fast">("normal")
const stopRef = useRef(false)  // interrupt signal for Play All
```

**Pace → delay mapping**:
- slow: 3500ms between words
- normal: 1800ms
- fast: 800ms

**`WordRow` component** (inner):
- Audio state machine: `idle → loading → ready/error`
- Lazy load: fetches audio URL via `getWordAudio(term)` on first play click
- Play: `new Audio(url).play()`

**Play All flow**:
```typescript
// 1. Set stopRef.current = false
// 2. Loop through words array
// 3. For each: fetch URL if needed, play, await delay (or until stopRef = true)
// 4. On Stop button: stopRef.current = true → loop exits at next check
```

---

### `Writing.tsx`

**Purpose**: Free text editor with live inline grammar annotation from LanguageTool.

**Props**: `{ level: CEFRLevel }`

**Modes**:
- `"editing"` — textarea visible, "Check my writing" button
- `"results"` — annotated text visible, "Edit again" button

**Key state**:
```typescript
const [text,        setText]        = useState("")
const [mode,        setMode]        = useState<"editing"|"results">("editing")
const [matches,     setMatches]     = useState<GrammarMatch[]>([])
const [activeMatch, setActiveMatch] = useState<GrammarMatch | null>(null)
const [language,    setLanguage]    = useState("en-US")
```

**`buildSegments(text, matches)`**:
Splits the text string into alternating plain/error segments:
```typescript
type Segment = { type: "plain", text: string }
             | { type: "error", text: string, match: GrammarMatch }
```
Algorithm:
1. Sort matches by offset
2. Remove overlapping matches (keeps first, discards overlapping)
3. Walk through text: emit plain segment before each match, then error segment
4. Emit final plain segment after last match

**Error color coding** (by `match.rule.issueType`):
- `grammar` → red background
- `spelling` → amber background
- `style` → blue background
- `punctuation` → purple background
- other → zinc background

**`ErrorPopover`** (inner component):
- Renders above the error span
- Shows: message, category dot + label, up to 4 suggestion buttons
- "Apply" button: replaces text at `[offset, offset+length]` with selected replacement,
  clears matches, returns to editing mode

**Check flow**:
```
onClick "Check my writing"
  → setMode("results")
  → setLoading(true)
  → checkGrammar(text, language)   // POST /api/grammar/check (20s timeout)
  → setMatches(result)
  → setLoading(false)
```

---

### `DictionarySearch.tsx`

**Purpose**: Full dictionary lookup UI with autocomplete, word explorer, and search history.

**Props**: `{ level: CEFRLevel }`

**Layout**: Two-panel (sidebar left 260px + main content)

**Key state**:
```typescript
const [query,      setQuery]      = useState("")
const [entry,      setEntry]      = useState<DictionaryEntry | null>(null)
const [history,    setHistory]    = useState<string[]>([])   // up to 10 entries
const [suggestions,setSuggestions]= useState<string[]>([])   // autocomplete
const [explorer,   setExplorer]   = useState<{
  rhymes: string[], similar: string[], adjectives: string[]
}>({ rhymes: [], similar: [], adjectives: [] })
const [loading,    setLoading]    = useState(false)
```

**Autocomplete**: Debounced 220ms via `useRef(setTimeout)`. Calls `getAutocomplete(q)`.
Dropdown closes on Escape or Enter or click-outside.

**`handleSearch(word)`**:
1. `setLoading(true)`
2. `lookupWord(word)` — GET /api/dictionary/{word}
3. `setEntry(result)`
4. Prepend to history (dedup, max 10)
5. `progress.addWordSearched(level, word)` — saves to localStorage
6. Background: `getWordRhymes`, `getWordSimilar`, `getWordAdjectives` — all parallel
7. `setExplorer(results)`

**Definition display**:
- Part of speech shown as colored pill (verb=blue, noun=green, adjective=amber, adverb=purple)
- Numbered definitions with example in italic
- Synonyms as white chips, antonyms as dark chips — clickable to search
- Idioms with lightbulb icon, left border accent

**Word Explorer section** (fetched in background):
- Similar meaning (sparkles icon)
- Rhymes (music note icon)
- Common adjectives for nouns (layers icon)
- Skeleton loading state while fetching

---

### `Phrases.tsx`

**Purpose**: Essential phrases grouped by topic with learned tracking and translations.

**Props**: `{ level: CEFRLevel }`

**Data shape** (from `data/phrases.ts`):
```typescript
interface Phrase {
  phrase: string       // The English phrase
  translation: string  // Spanish translation
  context: string      // Usage context label (e.g. "General greeting")
  example?: string     // Optional example sentence
}
interface PhraseTopic {
  topic: string        // Topic name (e.g. "Greetings")
  icon:  string        // Emoji icon
  phrases: Phrase[]
}
```

**Key state**:
```typescript
const [learnedPhrases, setLearnedPhrases] = useState<string[]>([])
const [activeTopic,    setActiveTopic]    = useState<string>(topics[0]?.topic ?? "")
```

**`PhraseRow`** (inner component):
```typescript
// State: { showTranslation: boolean }
// Toggle: learned checkbox (circle → green check)
// Translation: hidden by default, "▼ translation" button to reveal
```

**Topic tab**: Each tab shows `topic name` + `(learned count)` if > 0.
Active tab = dark background, inactive = hover effect.

---

## 7. Data Layer

All data is **static TypeScript** — no fetch required for content.

### `data/vocabulary.ts`

```typescript
type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"

interface VocabWord {
  term:        string   // The word itself
  phonetic:    string   // IPA notation, e.g. "/həˈloʊ/"
  partOfSpeech: string  // "noun", "verb", "adjective", "adverb", etc.
  definition:  string   // Short static definition (backup if API is unavailable)
  example:     string   // Example sentence
  topic:       string   // Topic category for color coding
}

const VOCABULARY: Record<CEFRLevel, VocabWord[]>
```

Counts: A1=150, A2=150, B1=150, B2=150, C1=120, C2=100 (820 total)

Topics include: Greetings, Identity, Home, Daily life, Description, People, Places,
Food, Transport, Colors, Body, Family, Communication, Activities, Time, Senses,
Cognition, Feelings, Objects, Politeness, Basics, Education, Travel, Work, Emotions,
Nature, Society, Language, Advanced, Rhetoric

### `data/grammar.ts`

```typescript
interface GrammarRule {
  title:       string     // Short rule name
  explanation: string     // Full plain-English explanation
  structure:   string     // Syntax pattern (e.g. "Subject + am/is/are + complement")
  examples:    string[]   // 3-5 example sentences
  notes?:      string     // Optional tip or exception
}

const GRAMMAR: Record<CEFRLevel, GrammarRule[]>
```

Rule counts per level: A1=10-12, A2=10-12, B1=10-12, B2=10-12, C1=8-10, C2=8

### `data/phrases.ts`

```typescript
interface Phrase {
  phrase:      string    // Full English phrase
  translation: string    // Spanish translation
  context:     string    // Situational label
  example?:    string    // Usage example
}

interface PhraseTopic {
  topic:   string
  icon:    string        // Emoji
  phrases: Phrase[]
}

const PHRASES: Record<CEFRLevel, PhraseTopic[]>
```

---

## 8. Type Definitions

**File**: `src/types/index.ts`

### Dictionary

```typescript
interface UnifiedDefinition {
  definition:    string
  example?:      string
  partOfSpeech?: string
}

interface UnifiedIdiom {
  phrase:     string
  definition: string
}

interface DictionaryEntry {
  word:          string
  phonetic?:     string
  audioUrl?:     string
  partOfSpeech?: string
  definitions:   UnifiedDefinition[]
  synonyms:      string[]
  antonyms:      string[]
  idioms:        UnifiedIdiom[]
}

interface DictionaryResponse {
  success: boolean
  data?:   DictionaryEntry
  source?: string
  cached:  boolean
  error?:  { code: string; message: string }
}
```

### Grammar Check

```typescript
interface GrammarMatch {
  message:       string
  shortMessage:  string
  offset:        number    // char index of error start in original text
  length:        number    // char span of error
  sentence:      string    // surrounding sentence context
  replacements:  string[]
  rule: {
    id:          string
    description: string
    issueType:   string    // "grammar" | "spelling" | "style" | "punctuation" | etc.
    category:    string
  }
}

interface GrammarResponse {
  success: boolean
  data?:   { language: string; languageCode: string; matches: GrammarMatch[] }
  source?: string
  cached:  boolean
  error?:  { code: string; message: string }
}
```

### Weather

```typescript
interface GeoLocation {
  id:           number
  name:         string
  latitude:     number
  longitude:    number
  country:      string
  country_code: string
  admin1?:      string
  timezone:     string
  population?:  number
}

interface CurrentWeather {
  temperature_2m:       number
  relative_humidity_2m: number
  apparent_temperature: number
  weather_code:         number
  wind_speed_10m:       number
  precipitation:        number
}

interface WeatherData {
  current:       CurrentWeather
  daily:         DailyWeather
  hourly:        HourlyWeather
  timezone:      string
  current_units: Record<string, string>
}
```

### Countries

```typescript
interface Country {
  cca2:         string           // "US"
  cca3:         string           // "USA"
  name:         CountryName      // { common, official, nativeName? }
  flags:        CountryFlag      // { png, svg, alt? }
  region:       string
  subregion?:   string
  population:   number
  capital?:     string[]
  languages?:   Record<string, string>
  currencies?:  Record<string, Currency>
  borders?:     string[]
  timezones?:   string[]
  area?:        number
  continents?:  string[]
  independent?: boolean
  unMember?:    boolean
  translations?: Record<string, { official: string; common: string }>
  maps?:        { googleMaps: string; openStreetMaps: string }
  coatOfArms?:  { png?: string; svg?: string }
}
```

---

## 9. Styling System

**Framework**: Tailwind CSS 3.4.1 with shadcn/ui theming

### Design philosophy
- Warm off-white background: `bg-[#F5F4F0]`
- Monospace accents: `font-mono` for terms, IPA, structure blocks, counters
- Flat / sharp: very few rounded corners (no `rounded-full` on content)
- Editorial: no drop shadows on content cards, thin borders (`border-zinc-200`)
- No gradients, no purple, no centered hero layouts

### CEFR level colors

| Level | Color | Tailwind class |
|---|---|---|
| A1 | Sky blue | `bg-sky-100 text-sky-700 border-sky-300` |
| A2 | Lime | `bg-lime-100 text-lime-700 border-lime-300` |
| B1 | Amber | `bg-amber-100 text-amber-700 border-amber-300` |
| B2 | Orange | `bg-orange-100 text-orange-700 border-orange-300` |
| C1 | Rose | `bg-rose-100 text-rose-700 border-rose-300` |
| C2 | Purple | `bg-purple-100 text-purple-700 border-purple-300` |

### Topic tag colors (Vocabulary)

Topic tags on word cards use a `topicColor(topic)` helper function that maps topic names
to specific Tailwind classes. Topics not in the map fall back to a neutral zinc style.

### shadcn/ui components used

Accordion, Tabs, Slider, Popover, Progress, Dialog, Tooltip, ScrollArea, Separator,
Switch, RadioGroup, Command (autocomplete), Sonner (toast), and more.
All are in `src/components/ui/` — standard shadcn installs, not modified.

---

## 10. Environment Variables

**File**: `.env` (gitignored). Template: `.env.example`.

Vite only exposes variables prefixed with `VITE_` to the browser bundle.

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:3001` | Backend URL. Use HTTPS in production. |
| `VITE_PROGRESS_TOKEN` | No (dev) / Yes (prod) | — | Bearer token for `/api/progress`. Must match `PROGRESS_TOKEN` on backend. |

**Important**: `VITE_*` variables are baked into the JS bundle at build time.
They are visible in the browser's DevTools → Sources. For a personal app this is
acceptable. For a multi-user app, use session-based auth instead.

---

## 11. Build System

### Development
```bash
pnpm run dev    # Vite dev server at http://localhost:5173
                # Hot module replacement (HMR) enabled
                # TypeScript checked inline
```

### Production build
```bash
pnpm run build  # tsc -b (type check) + vite build
                # Output: dist/
```

### Path aliases
`@/` → `src/` (configured in `vite.config.ts` + `tsconfig.json`)

```typescript
import { progress } from "@/lib/progress"   // resolves to src/lib/progress.ts
```

### TypeScript config
- `strict: true` — all strict checks enabled
- `target: ES2020`
- `moduleResolution: bundler`

---

## 12. Data Flow Examples

### Example 1: User learns a vocabulary word

```
User clicks toggle on WordCard (e.stopPropagation prevents card flip)
    │
    ├─ progress.markVocabLearned("A1", "hello")
    │   ├─ load() from localStorage
    │   ├─ push "hello" to vocabularyLearned
    │   ├─ save() to localStorage    ← instant, synchronous
    │   └─ syncVocab("POST", "A1", "hello")   ← fire-and-forget
    │       └─ fetch("POST /api/progress/vocab", { level: "A1", term: "hello" })
    │           └─ headers: { Authorization: "Bearer <token>", Content-Type: "application/json" }
    │
    ├─ setLearned(prev => [...prev, "hello"])  ← React state update → re-render
    │
    └─ WordCard: border becomes green, CheckCircle icon shown
```

### Example 2: User flips a vocabulary card

```
User clicks WordCard body
    │
    ├─ setFlipped(true)
    │
    └─ if (!liveCache.current["hello"])
        └─ fetchLiveEntry("hello")
            ├─ lookupWord("hello")
            │   └─ GET /api/dictionary/hello
            │       ├─ Backend: mwLearnersLookup("hello")  [or cached]
            │       └─ Response: { word, phonetic, audioUrl, definitions, synonyms, antonyms, idioms }
            ├─ liveCache.current["hello"] = entry
            └─ setLiveData(entry)   ← React re-render shows back of card with live data
```

### Example 3: Grammar check flow

```
User types "She go to school every day."
User clicks "Check my writing"
    │
    ├─ setMode("results")
    ├─ setLoading(true)
    │
    ├─ checkGrammar(text, "en-US")
    │   └─ POST /api/grammar/check
    │       └─ body: { text: "She go to school every day.", language: "en-US" }
    │       └─ Backend: Bottleneck throttle → LanguageTool API
    │       └─ Response: { matches: [{ offset: 4, length: 2, message: "...", replacements: ["goes"] }] }
    │
    ├─ setMatches(result)
    ├─ setLoading(false)
    │
    └─ buildSegments(text, matches)
        → [
            { type: "plain", text: "She " },
            { type: "error", text: "go", match: { message: "...", replacements: ["goes"] } },
            { type: "plain", text: " to school every day." }
          ]
        → Rendered as: "She <span class='bg-red-100'>go</span> to school every day."
```

### Example 4: App startup — loading progress from server

```
App mounts
    │
    └─ useEffect(() => { loadFromServer() }, [])
        │
        ├─ GET /api/progress
        │   headers: { Authorization: "Bearer <token>" }
        │   Response: {
        │     vocabulary: { A1: ["hello", "goodbye"], A2: ["happy", ...] },
        │     grammar:    { A1: [0, 2, 5], B1: [1] },
        │     phrases:    { A1: ["Hello!", ...] }
        │   }
        │
        ├─ load() from localStorage
        │   (may already have progress from previous session)
        │
        ├─ For each level:
        │   data[level].vocabularyLearned = server.vocabulary[level]  ← overwrite
        │   data[level].grammarCompleted  = server.grammar[level]     ← overwrite
        │   data[level].phrasesLearned    = server.phrases[level]     ← overwrite
        │   data[level].wordsSearched     = local.wordsSearched       ← keep local
        │
        └─ save() to localStorage
            → All subsequent progress.load() calls return the authoritative server state
```
