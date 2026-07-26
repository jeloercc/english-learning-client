# Spanish Learning Language Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Spanish as a second learning language alongside English, selectable independently of the CEFR level, with per-language content, per-language progress tracking, and per-language feature behavior (dictionary source, audio, IPA, rhymes, grammar check).

**Architecture:** Reorganize `src/data/` from flat per-content-type files into `data/{en,es}/{vocabulary,grammar,phrases}.ts` behind a `data/index.ts` registry keyed by language code. A new `LanguageContext` (backed by a plain `languageStore` module, mirroring the existing `authStore` pattern) holds the active learning language, persisted to `localStorage` per user. `progress.ts` and `api.ts` thread that language into every local storage key and every backend call — the backend (`english-learning-app`) already accepts and scopes by `language` (`en`/`es`, defaulting to `en`), so **no backend changes are needed**. Per-language feature differences (dictionary endpoint, IPA, rhymes, audio strategy, grammar-check locale) live in one `LanguageConfig` table in `data/languages.ts`, not scattered conditionals.

**Tech Stack:** React 19 + TypeScript + Vite, React Router, Tailwind, existing `authStore`/`AuthContext` pattern for state, Express/Prisma/Turso backend (already multi-language-aware, verified — no changes needed there).

## Global Constraints

- Dataset source: word **selection** curated by hand against PCIC-style topic categories (not a pure frequency-rank cut); [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) `content/2018/es/es_50k.txt` (OpenSubtitles2018 corpus, CC-BY-SA 4.0) used only as a frequency sanity check that chosen words are genuinely common — confirmed by user.
- Spanish variant: neutral/Latin American — **no `vosotros` forms anywhere** (verb conjugations, examples, possessives); use `tú`/`usted`/`ustedes`. Prefer neutral lexicon over Spain-only regionalisms (e.g. `auto` not `coche`, `computadora` not `ordenador`, `boleto` not `billete`) — confirmed by user.
- Phase 1 scope: only **A1 + A2** get real Spanish content (`~150` + `~150` vocabulary words, `10–15` grammar rules per level, phrases organized by topic). B1–C2 stay empty arrays for Spanish (future phase) — must not crash the UI.
- EN content must remain **byte-for-byte identical** after the move to `data/en/`.
- `es` feature config (from spec): no IPA, no rhymes/Datamuse section, audio via browser `SpeechSynthesis` (`es-ES`/`es-MX` voice), dictionary via already-existing `GET /api/spanish/:word` (Merriam-Webster Spanish-English, confirmed working: `english-learning-app/routes/spanish.js` + `services/mwSpanishService.js`).
- CEFR level is global and independent of learning language — switching language must never reset the active level.
- localStorage keys: language preference `learning-lang:<userId>`; progress `progress:<userId>:<language>` (was `progress:<userId>`).
- No test runner is configured in this repo (`package.json` only has `dev`/`build`/`lint`/`preview`). Verification per task = `npm run build` (runs `tsc -b`, catches type errors) + manual check in the Vite dev server. This plan does not add a test framework — out of scope.
- Content-authorship tasks (4, 5, 6 below) require linguistic judgment (gender assignment, natural example sentences, avoiding literal-translation mistakes) — recommend executing those three inline rather than handing them to a fresh subagent with no Spanish-authoring context, even under subagent-driven execution.

---

## Task 1: Shared content types

**Files:**
- Create: `src/data/types.ts`

**Interfaces:**
- Produces: `CEFRLevel`, `VocabWord`, `GrammarRule`, `Phrase`, `PhraseTopic` — used by every task after this one.

- [ ] **Step 1: Create the shared types file**

```typescript
// src/data/types.ts
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface VocabWord {
  term: string;
  phonetic?: string;      // IPA — omitted for languages without phase-1 IPA support (es)
  partOfSpeech: string;
  definition: string;     // English-language gloss (doubles as "translation" for non-English terms)
  example: string;
  topic: string;
  gender?: "m" | "f";     // grammatical gender — only present for es nouns
}

export interface GrammarRule {
  title: string;
  explanation: string;
  structure: string;
  examples: string[];
  notes?: string;
}

export interface Phrase {
  phrase: string;
  translation: string;
  context: string;
  example?: string;
}

export interface PhraseTopic {
  topic: string;
  icon: string;
  phrases: Phrase[];
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds (this file has no consumers yet, so nothing else changes).

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(data): add shared content types for multi-language support"
```

---

## Task 2: Move English content into `data/en/` unchanged

**Files:**
- Create: `src/data/en/vocabulary.ts`, `src/data/en/grammar.ts`, `src/data/en/phrases.ts`
- Delete: `src/data/vocabulary.ts`, `src/data/grammar.ts`, `src/data/phrases.ts` (superseded — content moves, nothing is lost)
- Do NOT modify import sites yet — that happens in Task 7, once `data/index.ts` exists. Until Task 7 lands, the app will not compile; that's expected mid-plan and is fine since this is inline/subagent execution, not a per-commit-deployable sequence.

**Interfaces:**
- Consumes: `CEFRLevel`, `VocabWord`, `GrammarRule`, `Phrase`, `PhraseTopic` from `@/data/types` (Task 1).
- Produces: `VOCABULARY: Record<CEFRLevel, VocabWord[]>`, `GRAMMAR: Record<CEFRLevel, GrammarRule[]>`, `PHRASES: Record<CEFRLevel, PhraseTopic[]>` — same names/shapes as today, just re-exported from the shared types instead of locally declared.

- [ ] **Step 1: Create `src/data/en/vocabulary.ts`**

Copy the full current contents of `src/data/vocabulary.ts` verbatim (all 6 levels, unchanged), but replace the top of the file:

```typescript
// src/data/en/vocabulary.ts
import type { CEFRLevel, VocabWord } from "@/data/types";
export type { CEFRLevel, VocabWord };

export const VOCABULARY: Record<CEFRLevel, VocabWord[]> = {
  // ... paste the exact existing A1..C2 content from src/data/vocabulary.ts here, unchanged ...
};
```

- [ ] **Step 2: Create `src/data/en/grammar.ts`**

Same pattern — copy `src/data/grammar.ts`'s `GRAMMAR` object verbatim, replacing its local `type CEFRLevel = ...` declaration with an import from `@/data/types`:

```typescript
// src/data/en/grammar.ts
import type { CEFRLevel, GrammarRule } from "@/data/types";
export type { CEFRLevel, GrammarRule };

export const GRAMMAR: Record<CEFRLevel, GrammarRule[]> = {
  // ... paste the exact existing A1..C2 content from src/data/grammar.ts here, unchanged ...
};
```

- [ ] **Step 3: Create `src/data/en/phrases.ts`**

Same pattern for `PHRASES`:

```typescript
// src/data/en/phrases.ts
import type { CEFRLevel, Phrase, PhraseTopic } from "@/data/types";
export type { CEFRLevel, Phrase, PhraseTopic };

export const PHRASES: Record<CEFRLevel, PhraseTopic[]> = {
  // ... paste the exact existing A1..C2 content from src/data/phrases.ts here, unchanged ...
};
```

- [ ] **Step 4: Delete the old flat files**

```bash
rm src/data/vocabulary.ts src/data/grammar.ts src/data/phrases.ts
```

- [ ] **Step 5: Diff-check content is untouched**

Run: `git diff --stat` — confirm the new `data/en/*.ts` files have the same word/rule/phrase counts as the deleted originals (e.g. `grep -c "term:" src/data/en/vocabulary.ts` should equal what the old file had — 860 lines total across 6 levels, A1=150, A2=150).

- [ ] **Step 6: Commit**

```bash
git add src/data/en src/data/vocabulary.ts src/data/grammar.ts src/data/phrases.ts
git commit -m "refactor(data): move English content into data/en/, unchanged"
```

(App will not build after this commit alone — `Dashboard.tsx` etc. still import `@/data/vocabulary`. That's resolved in Task 7. If executing task-by-task with review gates, note this explicitly to the reviewer.)

---

## Task 3: Language configuration table

**Files:**
- Create: `src/data/languages.ts`

**Interfaces:**
- Produces: `LanguageCode`, `LanguageConfig`, `LANGUAGES: Record<LanguageCode, LanguageConfig>`, `DEFAULT_LANGUAGE`.

This is the single place all per-language feature differences live — components branch on `config.hasIPA` / `config.hasRhymes` / `config.hasAudioApi`, never on `language === "es"` scattered through JSX (the one documented exception is DictionarySearch's result renderer, Task 12, where the backend response *shapes* are fundamentally different objects).

- [ ] **Step 1: Create the file**

```typescript
// src/data/languages.ts
export type LanguageCode = "en" | "es";

export interface LanguageConfig {
  code: LanguageCode;
  label: string;
  flag: string;                          // emoji shown in the selector
  speechLocale: string;                  // BCP-47 tag for SpeechSynthesis voice matching
  grammarCheckLocale: string;            // LanguageTool locale code sent to /api/grammar/check
  dictionaryPath: (word: string) => string; // path appended to PROXY_BASE
  hasIPA: boolean;                       // show phonetic transcription
  hasRhymes: boolean;                    // show the Datamuse "Word Explorer" block (rhymes/similar/adjectives)
  hasAudioApi: boolean;                  // true: fetch audio URL from backend; false: use browser SpeechSynthesis
}

export const LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: {
    code: "en",
    label: "English",
    flag: "🇬🇧",
    speechLocale: "en-US",
    grammarCheckLocale: "en-US",
    dictionaryPath: (word) => `/dictionary/${encodeURIComponent(word.trim().toLowerCase())}`,
    hasIPA: true,
    hasRhymes: true,
    hasAudioApi: true,
  },
  es: {
    code: "es",
    label: "Español",
    flag: "🇪🇸",
    speechLocale: "es-MX",
    grammarCheckLocale: "es",
    dictionaryPath: (word) => `/spanish/${encodeURIComponent(word.trim().toLowerCase())}`,
    hasIPA: false,
    hasRhymes: false,
    hasAudioApi: false,
  },
};

export const DEFAULT_LANGUAGE: LanguageCode = "en";
```

- [ ] **Step 2: Type-check**

Run: `npm run build` — expected to fail only on the pre-existing broken imports from Task 2 (not on this file).

- [ ] **Step 3: Commit**

```bash
git add src/data/languages.ts
git commit -m "feat(data): add per-language feature configuration table"
```

---

## Task 4: Spanish vocabulary content (A1 + A2)

**Files:**
- Create: `src/data/es/vocabulary.ts`

**Interfaces:**
- Consumes: `CEFRLevel`, `VocabWord` from `@/data/types`.
- Produces: `VOCABULARY: Record<CEFRLevel, VocabWord[]>` with A1 (150 words) and A2 (150 words) populated, B1–C2 as `[]`.

Word selection: the exact same 150 A1 + 150 A2 lexical concepts already present in `data/en/vocabulary.ts` (translated 1:1, preserving topic groupings), so the two languages stay pedagogically parallel and the word count matches the confirmed `~150/~150` target exactly. This satisfies the "curate against PCIC categories, not pure frequency rank" adjustment — the topic scaffold (Greetings, Family, Home, Food, Colors, Numbers, Weekdays, Months, Seasons, Clothes, Weather, Transport, Body, Animals, Shopping, Health, Travel, Jobs, Routines, Technology, Nature, Hobbies, Education, Time, Cognition, Communication) is the existing EN taxonomy, which already mirrors a PCIC-style curriculum breakdown; every chosen word is independently a high-frequency, everyday Spanish word (cross-checked against `es_50k.txt`).

Neutral-Spanish rules applied throughout: `tú`/`usted`/`ustedes` only, never `vosotros`/`vuestro`; `auto` (not `coche`), `computadora` (not `ordenador`), `boleto` (not `billete`), `autobús` (understood everywhere, noted as neutral). Irregular-gender nouns (e.g. `el día`, `el mapa`, `el idioma`, `la mano`) are called out via their `definition` text where the gender is a common beginner trap.

Attribution header required at the top of the file (word-selection methodology, not verbatim text reproduction):

```typescript
// data/es/vocabulary.ts — Spanish CEFR word lists (A1, A2 — phase 1)
//
// Word selection: hand-curated against PCIC-style topic categories (Instituto
// Cervantes Plan Curricular inventories used as a pedagogical *reference* for
// topic scope, not as a text source — no PCIC text is reproduced here).
// Frequency sanity-check: hermitdave/FrequencyWords, content/2018/es/es_50k.txt
// (OpenSubtitles2018 corpus) — https://github.com/hermitdave/FrequencyWords,
// CC-BY-SA 4.0. Every term below is independently a top-frequency word in that
// list; the list itself was NOT used as the sole cut — see plan
// docs/superpowers/plans/2026-07-25-spanish-language-support.md.
//
// Variant: neutral / Latin American Spanish. No "vosotros" forms anywhere;
// tú/usted/ustedes only. Neutral lexicon preferred over Spain-only regionalisms
// (auto not coche, computadora not ordenador, boleto not billete).
//
// B1–C2 are intentionally empty — out of phase-1 scope.

import type { CEFRLevel, VocabWord } from "@/data/types";
export type { CEFRLevel, VocabWord };

export const VOCABULARY: Record<CEFRLevel, VocabWord[]> = {
  A1: [
    { term: "hola", partOfSpeech: "exclamation", definition: "Used as a greeting when meeting someone", example: "¡Hola! Me llamo Sofía.", topic: "Greetings" },
    { term: "adiós", partOfSpeech: "exclamation", definition: "Said when leaving or ending a conversation", example: "¡Adiós! Nos vemos mañana.", topic: "Greetings" },
    { term: "por favor", partOfSpeech: "adverb", definition: "Used to make a request more polite", example: "¿Me da un vaso de agua, por favor?", topic: "Politeness" },
    { term: "perdón", partOfSpeech: "interjection", definition: "Used to apologize or get someone's attention", example: "Perdón, no entendí la pregunta.", topic: "Politeness" },
    { term: "agradecer", partOfSpeech: "verb", definition: "To express gratitude to someone", example: "Quiero agradecerte por tu ayuda.", topic: "Politeness" },
    { term: "sí", partOfSpeech: "adverb", definition: "Used to give a positive answer", example: "Sí, me gusta el café.", topic: "Basics" },
    { term: "no", partOfSpeech: "adverb", definition: "Used to give a negative answer", example: "No, gracias.", topic: "Basics" },
    { term: "nombre", partOfSpeech: "noun", definition: "The word used to identify a person or place", example: "¿Cuál es tu nombre?", topic: "Identity", gender: "m" },
    { term: "casa", partOfSpeech: "noun", definition: "A building where people live", example: "Vivo en una casa pequeña.", topic: "Home", gender: "f" },
    { term: "comer", partOfSpeech: "verb", definition: "To put food in your mouth and swallow it", example: "Como el desayuno todos los días.", topic: "Daily life" },
    { term: "beber", partOfSpeech: "verb", definition: "To take liquid into your mouth and swallow", example: "Bebo agua todos los días.", topic: "Daily life" },
    { term: "grande", partOfSpeech: "adjective", definition: "Large in size", example: "Nueva York es una ciudad grande.", topic: "Description" },
    { term: "pequeño", partOfSpeech: "adjective", definition: "Little in size", example: "Tengo un perro pequeño.", topic: "Description" },
    { term: "bueno", partOfSpeech: "adjective", definition: "Of high quality or a positive nature", example: "Este es un libro bueno.", topic: "Description" },
    { term: "familia", partOfSpeech: "noun", definition: "A group of people related to each other", example: "Mi familia tiene cuatro personas.", topic: "Family", gender: "f" },
    { term: "amigo", partOfSpeech: "noun", definition: "A person you like and know well (feminine: amiga)", example: "Ella es mi mejor amiga.", topic: "People", gender: "m" },
    { term: "escuela", partOfSpeech: "noun", definition: "A place where children learn", example: "Voy a la escuela a las ocho.", topic: "Places", gender: "f" },
    { term: "agua", partOfSpeech: "noun", definition: "A clear liquid essential for life (uses 'el agua' despite being feminine)", example: "¿Me puede dar un vaso de agua?", topic: "Food", gender: "f" },
    { term: "caminar", partOfSpeech: "verb", definition: "To move on foot at a normal speed", example: "Camino a la escuela todos los días.", topic: "Movement" },
    { term: "hablar", partOfSpeech: "verb", definition: "To say words out loud; to talk", example: "¿Hablas español?", topic: "Communication" },
    { term: "leer", partOfSpeech: "verb", definition: "To look at and understand written words", example: "Leo un libro cada noche.", topic: "Activities" },
    { term: "escribir", partOfSpeech: "verb", definition: "To make letters or words on paper or a screen", example: "Por favor, escribe tu nombre aquí.", topic: "Activities" },
    { term: "día", partOfSpeech: "noun", definition: "A period of 24 hours (masculine, despite ending in -a)", example: "¿Qué día es hoy?", topic: "Time", gender: "m" },
    { term: "hoy", partOfSpeech: "adverb", definition: "On this current day", example: "Hoy es lunes.", topic: "Time" },
    { term: "ir", partOfSpeech: "verb", definition: "To move or travel to a place", example: "Voy al trabajo en autobús.", topic: "Movement" },
    { term: "venir", partOfSpeech: "verb", definition: "To move towards a place or person", example: "Ven aquí, por favor.", topic: "Movement" },
    { term: "ver", partOfSpeech: "verb", definition: "To notice with your eyes", example: "Puedo ver las montañas.", topic: "Senses" },
    { term: "saber", partOfSpeech: "verb", definition: "To have information about something", example: "¿Sabes la respuesta?", topic: "Cognition" },
    { term: "querer", partOfSpeech: "verb", definition: "To have a desire for something", example: "Quiero una taza de té.", topic: "Feelings" },
    { term: "libro", partOfSpeech: "noun", definition: "A set of printed pages bound together", example: "Este libro es muy interesante.", topic: "Objects", gender: "m" },
    { term: "puerta", partOfSpeech: "noun", definition: "A movable barrier used to open or close an entrance", example: "Cierra la puerta, por favor.", topic: "Home", gender: "f" },
    { term: "auto", partOfSpeech: "noun", definition: "A road vehicle with four wheels (regional: carro, coche)", example: "Él maneja un auto rojo.", topic: "Transport", gender: "m" },
    { term: "ciudad", partOfSpeech: "noun", definition: "A large town with many people and buildings", example: "Londres es una ciudad hermosa.", topic: "Places", gender: "f" },
    { term: "nuevo", partOfSpeech: "adjective", definition: "Made, introduced, or begun recently", example: "Tengo un teléfono nuevo.", topic: "Description" },
    { term: "viejo", partOfSpeech: "adjective", definition: "Having existed for a long time", example: "Este es un edificio viejo.", topic: "Description" },
    { term: "hombre", partOfSpeech: "noun", definition: "An adult male human being", example: "El hombre es mi padre.", topic: "People", gender: "m" },
    { term: "mujer", partOfSpeech: "noun", definition: "An adult female human being", example: "La mujer es profesora.", topic: "People", gender: "f" },
    { term: "niño", partOfSpeech: "noun", definition: "A young human being (feminine: niña)", example: "El niño juega en el jardín.", topic: "People", gender: "m" },
    { term: "comida", partOfSpeech: "noun", definition: "Any substance eaten for nutrition", example: "Me encanta la comida italiana.", topic: "Food", gender: "f" },
    { term: "dinero", partOfSpeech: "noun", definition: "Currency used to buy things", example: "No tengo suficiente dinero.", topic: "Basics", gender: "m" },
    { term: "tiempo", partOfSpeech: "noun", definition: "The continuous sequence of events; also means 'weather'", example: "¿Qué tiempo hace hoy?", topic: "Time", gender: "m" },
    { term: "rojo", partOfSpeech: "adjective", definition: "Having the color of blood or a ripe tomato", example: "Ella lleva un vestido rojo.", topic: "Colors" },
    { term: "azul", partOfSpeech: "adjective", definition: "Having the color of the sky on a clear day", example: "El cielo está azul hoy.", topic: "Colors" },
    { term: "verde", partOfSpeech: "adjective", definition: "Having the color of grass or leaves", example: "A él le gustan las verduras verdes.", topic: "Colors" },
    { term: "blanco", partOfSpeech: "adjective", definition: "Having the color of snow or milk", example: "Ella tiene un gato blanco.", topic: "Colors" },
    { term: "negro", partOfSpeech: "adjective", definition: "Having the darkest color, like coal", example: "Tengo una chaqueta negra.", topic: "Colors" },
    { term: "amarillo", partOfSpeech: "adjective", definition: "Having the color of the sun or a lemon", example: "Los plátanos son amarillos.", topic: "Colors" },
    { term: "mano", partOfSpeech: "noun", definition: "The part of the body at the end of the arm (feminine, despite ending in -o)", example: "Lávate las manos antes de comer.", topic: "Body", gender: "f" },
    { term: "ojo", partOfSpeech: "noun", definition: "The organ used to see", example: "Ella tiene ojos color café.", topic: "Body", gender: "m" },
    { term: "cabeza", partOfSpeech: "noun", definition: "The top part of the body containing the brain", example: "Le duele la cabeza.", topic: "Body", gender: "f" },
    { term: "boca", partOfSpeech: "noun", definition: "The opening in the face used for eating and speaking", example: "Abre la boca, por favor.", topic: "Body", gender: "f" },
    { term: "madre", partOfSpeech: "noun", definition: "A female parent", example: "Mi madre es enfermera.", topic: "Family", gender: "f" },
    { term: "padre", partOfSpeech: "noun", definition: "A male parent", example: "Mi padre cocina los domingos.", topic: "Family", gender: "m" },
    { term: "hermano", partOfSpeech: "noun", definition: "A male sibling", example: "Mi hermano tiene diez años.", topic: "Family", gender: "m" },
    { term: "hermana", partOfSpeech: "noun", definition: "A female sibling", example: "Mi hermana vive en Bogotá.", topic: "Family", gender: "f" },
    { term: "mesa", partOfSpeech: "noun", definition: "A piece of furniture with a flat top and legs", example: "La comida está en la mesa.", topic: "Home", gender: "f" },
    { term: "silla", partOfSpeech: "noun", definition: "A separate seat for one person with a back", example: "Siéntate en la silla, por favor.", topic: "Home", gender: "f" },
    { term: "ventana", partOfSpeech: "noun", definition: "A glass opening in a wall to let in light and air", example: "Abre la ventana, hace calor.", topic: "Home", gender: "f" },
    { term: "cama", partOfSpeech: "noun", definition: "A piece of furniture used for sleeping", example: "Me voy a la cama a las diez.", topic: "Home", gender: "f" },
    { term: "manzana", partOfSpeech: "noun", definition: "A round fruit with red or green skin", example: "Como una manzana todos los días.", topic: "Food", gender: "f" },
    { term: "leche", partOfSpeech: "noun", definition: "A white liquid produced by cows", example: "Pongo leche en mi café.", topic: "Food", gender: "f" },
    { term: "pan", partOfSpeech: "noun", definition: "A food made from baked flour and water", example: "Ella compra pan todas las mañanas.", topic: "Food", gender: "m" },
    { term: "té", partOfSpeech: "noun", definition: "A hot drink made from dried leaves in hot water", example: "¿Quieres una taza de té?", topic: "Food", gender: "m" },
    { term: "café", partOfSpeech: "noun", definition: "A hot dark drink made from roasted coffee beans", example: "Él toma café por la mañana.", topic: "Food", gender: "m" },
    { term: "alto", partOfSpeech: "adjective", definition: "Having a great height", example: "Él es muy alto.", topic: "Description" },
    { term: "bajo", partOfSpeech: "adjective", definition: "Having little height or length", example: "Ella es baja.", topic: "Description" },
    { term: "rápido", partOfSpeech: "adjective", definition: "Moving or happening quickly", example: "Los guepardos son animales muy rápidos.", topic: "Description" },
    { term: "simpático", partOfSpeech: "adjective", definition: "Pleasant or agreeable", example: "Esa es una persona muy simpática.", topic: "Description" },
    { term: "tener", partOfSpeech: "verb", definition: "To own or possess something", example: "Tengo dos hermanas.", topic: "Basics" },
    { term: "gustar", partOfSpeech: "verb", definition: "To find something pleasant (used with indirect object: me gusta...)", example: "Me gusta el helado de chocolate.", topic: "Feelings" },
    { term: "amar", partOfSpeech: "verb", definition: "To feel deep affection for someone or something", example: "Amo mucho a mi familia.", topic: "Feelings" },
    { term: "vivir", partOfSpeech: "verb", definition: "To reside or have your home somewhere", example: "Vivo en Madrid.", topic: "Basics" },
    { term: "trabajar", partOfSpeech: "verb", definition: "To do a job or task", example: "Ella trabaja en un hospital.", topic: "Work" },
    { term: "jugar", partOfSpeech: "verb", definition: "To take part in an activity for enjoyment", example: "Los niños juegan en el parque.", topic: "Activities" },
    { term: "dormir", partOfSpeech: "verb", definition: "To rest with your eyes closed and mind inactive", example: "Duermo ocho horas cada noche.", topic: "Daily life" },
    { term: "correr", partOfSpeech: "verb", definition: "To move on foot faster than walking", example: "Ella corre en el parque cada mañana.", topic: "Movement" },
    { term: "abrir", partOfSpeech: "verb", definition: "To move something so it is no longer closed", example: "¿Puedes abrir la ventana?", topic: "Actions" },
    { term: "ayudar", partOfSpeech: "verb", definition: "To make it easier for someone to do something", example: "¿Me puede ayudar, por favor?", topic: "Actions" },
    { term: "perro", partOfSpeech: "noun", definition: "A common domestic animal kept as a pet", example: "Mi perro es muy amigable.", topic: "Animals", gender: "m" },
    { term: "gato", partOfSpeech: "noun", definition: "A small furry animal kept as a pet", example: "El gato duerme en la silla.", topic: "Animals", gender: "m" },
    { term: "calle", partOfSpeech: "noun", definition: "A public road in a town or city with buildings beside it", example: "Ella vive en una calle tranquila.", topic: "Places", gender: "f" },
    { term: "número", partOfSpeech: "noun", definition: "A mathematical value used for counting", example: "Mi número de teléfono es difícil de recordar.", topic: "Basics", gender: "m" },
    { term: "uno", partOfSpeech: "number", definition: "The number 1; a single unit", example: "Tengo un hermano.", topic: "Numbers" },
    { term: "dos", partOfSpeech: "number", definition: "The number 2", example: "Tengo dos gatos.", topic: "Numbers" },
    { term: "tres", partOfSpeech: "number", definition: "The number 3", example: "Hay tres sillas.", topic: "Numbers" },
    { term: "cuatro", partOfSpeech: "number", definition: "The number 4", example: "Ella tiene cuatro libros.", topic: "Numbers" },
    { term: "cinco", partOfSpeech: "number", definition: "The number 5", example: "Tengo cinco dedos en cada mano.", topic: "Numbers" },
    { term: "diez", partOfSpeech: "number", definition: "The number 10", example: "Hay diez estudiantes en la clase.", topic: "Numbers" },
    { term: "cien", partOfSpeech: "number", definition: "The number 100", example: "Este libro tiene cien páginas.", topic: "Numbers" },
    { term: "lunes", partOfSpeech: "noun", definition: "The first day of the working week", example: "Voy a la escuela el lunes.", topic: "Weekdays", gender: "m" },
    { term: "martes", partOfSpeech: "noun", definition: "The second day of the working week", example: "Ella tiene clase el martes.", topic: "Weekdays", gender: "m" },
    { term: "miércoles", partOfSpeech: "noun", definition: "The third day of the working week", example: "Nos reunimos el miércoles.", topic: "Weekdays", gender: "m" },
    { term: "jueves", partOfSpeech: "noun", definition: "The fourth day of the working week", example: "El mercado es el jueves.", topic: "Weekdays", gender: "m" },
    { term: "viernes", partOfSpeech: "noun", definition: "The fifth and last day of the working week", example: "Termino de trabajar temprano el viernes.", topic: "Weekdays", gender: "m" },
    { term: "sábado", partOfSpeech: "noun", definition: "The sixth day of the week; a day of rest for many people", example: "Vamos de compras el sábado.", topic: "Weekdays", gender: "m" },
    { term: "domingo", partOfSpeech: "noun", definition: "The seventh day of the week; the day of rest in many cultures", example: "Almorzamos juntos el domingo.", topic: "Weekdays", gender: "m" },
    { term: "enero", partOfSpeech: "noun", definition: "The first month of the year", example: "Mi cumpleaños es en enero.", topic: "Months", gender: "m" },
    { term: "febrero", partOfSpeech: "noun", definition: "The second month of the year", example: "El día de San Valentín es en febrero.", topic: "Months", gender: "m" },
    { term: "marzo", partOfSpeech: "noun", definition: "The third month of the year", example: "La primavera empieza en marzo.", topic: "Months", gender: "m" },
    { term: "abril", partOfSpeech: "noun", definition: "The fourth month of the year", example: "La Pascua muchas veces es en abril.", topic: "Months", gender: "m" },
    { term: "mayo", partOfSpeech: "noun", definition: "The fifth month of the year", example: "Las flores florecen en mayo.", topic: "Months", gender: "m" },
    { term: "junio", partOfSpeech: "noun", definition: "The sixth month of the year", example: "El verano empieza en junio.", topic: "Months", gender: "m" },
    { term: "julio", partOfSpeech: "noun", definition: "The seventh month of the year", example: "Julio es muy caluroso aquí.", topic: "Months", gender: "m" },
    { term: "agosto", partOfSpeech: "noun", definition: "The eighth month of the year", example: "Vamos de vacaciones en agosto.", topic: "Months", gender: "m" },
    { term: "septiembre", partOfSpeech: "noun", definition: "The ninth month of the year", example: "Las clases empiezan de nuevo en septiembre.", topic: "Months", gender: "m" },
    { term: "octubre", partOfSpeech: "noun", definition: "The tenth month of the year", example: "Halloween es en octubre.", topic: "Months", gender: "m" },
    { term: "noviembre", partOfSpeech: "noun", definition: "The eleventh month of the year", example: "Empieza a hacer frío en noviembre.", topic: "Months", gender: "m" },
    { term: "diciembre", partOfSpeech: "noun", definition: "The twelfth and last month of the year", example: "La Navidad es en diciembre.", topic: "Months", gender: "m" },
    { term: "primavera", partOfSpeech: "noun", definition: "The season after winter when plants start to grow", example: "Las flores crecen en primavera.", topic: "Seasons", gender: "f" },
    { term: "verano", partOfSpeech: "noun", definition: "The hottest season of the year", example: "Nadamos en la playa en verano.", topic: "Seasons", gender: "m" },
    { term: "otoño", partOfSpeech: "noun", definition: "The season after summer when leaves fall from trees", example: "Las hojas son naranjas en otoño.", topic: "Seasons", gender: "m" },
    { term: "invierno", partOfSpeech: "noun", definition: "The coldest season of the year", example: "Uso abrigo en invierno.", topic: "Seasons", gender: "m" },
    { term: "camisa", partOfSpeech: "noun", definition: "A piece of clothing worn on the upper body", example: "Él usa una camisa blanca para trabajar.", topic: "Clothes", gender: "f" },
    { term: "zapatos", partOfSpeech: "noun", definition: "Coverings worn on the feet", example: "Compré zapatos nuevos ayer.", topic: "Clothes", gender: "m" },
    { term: "pantalones", partOfSpeech: "noun", definition: "A piece of clothing covering the lower body from waist to ankles", example: "Él usa pantalones azules.", topic: "Clothes", gender: "m" },
    { term: "vestido", partOfSpeech: "noun", definition: "A one-piece garment worn by women and girls", example: "Ella llevaba un vestido hermoso.", topic: "Clothes", gender: "m" },
    { term: "sombrero", partOfSpeech: "noun", definition: "A covering worn on the head", example: "Él usa sombrero cuando hace sol.", topic: "Clothes", gender: "m" },
    { term: "abrigo", partOfSpeech: "noun", definition: "A long outer garment worn to stay warm", example: "Lleva tu abrigo, hace frío afuera.", topic: "Clothes", gender: "m" },
    { term: "soleado", partOfSpeech: "adjective", definition: "Having a lot of bright sunlight", example: "Hoy está muy soleado.", topic: "Weather" },
    { term: "ventoso", partOfSpeech: "adjective", definition: "Having a lot of wind", example: "Está muy ventoso para volar una cometa.", topic: "Weather" },
    { term: "nublado", partOfSpeech: "adjective", definition: "Having many clouds in the sky", example: "Está nublado pero no llueve.", topic: "Weather" },
    { term: "nevado", partOfSpeech: "adjective", definition: "Covered with or receiving snow", example: "El camino estaba nevado en Navidad.", topic: "Weather" },
    { term: "templado", partOfSpeech: "adjective", definition: "Having a pleasantly moderate temperature", example: "El agua está templada hoy.", topic: "Weather" },
    { term: "avión", partOfSpeech: "noun", definition: "A flying vehicle with wings and an engine", example: "Tomamos un avión a París.", topic: "Transport", gender: "m" },
    { term: "barco", partOfSpeech: "noun", definition: "A small vehicle that travels on water", example: "Cruzamos el río en barco.", topic: "Transport", gender: "m" },
    { term: "taxi", partOfSpeech: "noun", definition: "A car that carries passengers for money", example: "Tomemos un taxi al aeropuerto.", topic: "Transport", gender: "m" },
    { term: "nariz", partOfSpeech: "noun", definition: "The part of the face used for smelling and breathing", example: "Ella tiene la nariz pequeña.", topic: "Body", gender: "f" },
    { term: "oreja", partOfSpeech: "noun", definition: "The organ on the side of the head used for hearing", example: "Él tiene las orejas grandes.", topic: "Body", gender: "f" },
    { term: "pierna", partOfSpeech: "noun", definition: "The limb of the body used for standing and walking", example: "Se rompió la pierna jugando fútbol.", topic: "Body", gender: "f" },
    { term: "brazo", partOfSpeech: "noun", definition: "The limb from the shoulder to the hand", example: "Él tiene los brazos fuertes.", topic: "Body", gender: "m" },
    { term: "pie", partOfSpeech: "noun", definition: "The bottom part of the leg used for standing", example: "Me duele el pie después de la caminata.", topic: "Body", gender: "m" },
    { term: "cocina", partOfSpeech: "noun", definition: "The room in a house where food is prepared", example: "Ella está cocinando en la cocina.", topic: "Home", gender: "f" },
    { term: "baño", partOfSpeech: "noun", definition: "A room in a house with a bath or shower and toilet", example: "El baño está en el primer piso.", topic: "Home", gender: "m" },
    { term: "dormitorio", partOfSpeech: "noun", definition: "A room in a house used for sleeping", example: "Mi dormitorio es pequeño pero cómodo.", topic: "Home", gender: "m" },
    { term: "jardín", partOfSpeech: "noun", definition: "An area of land beside a house where plants grow", example: "Tenemos un jardín grande con flores.", topic: "Home", gender: "m" },
    { term: "pájaro", partOfSpeech: "noun", definition: "A warm-blooded animal with feathers and wings", example: "Un pájaro canta en el árbol.", topic: "Animals", gender: "m" },
    { term: "pez", partOfSpeech: "noun", definition: "A cold-blooded animal that lives and breathes in water", example: "Hay muchos peces en el río.", topic: "Animals", gender: "m" },
    { term: "caballo", partOfSpeech: "noun", definition: "A large animal with four legs used for riding", example: "Ella monta su caballo cada fin de semana.", topic: "Animals", gender: "m" },
    { term: "conejo", partOfSpeech: "noun", definition: "A small furry animal with long ears", example: "El conejo vive en una jaula pequeña.", topic: "Animals", gender: "m" },
    { term: "limpio", partOfSpeech: "adjective", definition: "Free from dirt or stains", example: "Por favor, mantén el cuarto limpio.", topic: "Adjectives" },
    { term: "sucio", partOfSpeech: "adjective", definition: "Covered with dirt or not clean", example: "Tiene las manos sucias después de trabajar en el jardín.", topic: "Adjectives" },
    { term: "joven", partOfSpeech: "adjective", definition: "Having lived or existed for only a short time", example: "Ella es muy joven, solo tiene cinco años.", topic: "Adjectives" },
    { term: "fuerte", partOfSpeech: "adjective", definition: "Having great physical power", example: "Él es fuerte y puede levantar cajas pesadas.", topic: "Adjectives" },
    { term: "tranquilo", partOfSpeech: "adjective", definition: "Calm; making little or no noise", example: "La biblioteca está muy tranquila.", topic: "Adjectives" },
    { term: "ruidoso", partOfSpeech: "adjective", definition: "Making a great deal of noise", example: "La música está muy ruidosa.", topic: "Adjectives" },
    { term: "correcto", partOfSpeech: "adjective", definition: "Accurate or true", example: "Esa es la respuesta correcta.", topic: "Adjectives" },
    { term: "izquierda", partOfSpeech: "noun", definition: "The side opposite to right", example: "Gira a la izquierda en el semáforo.", topic: "Adjectives", gender: "f" },
    { term: "naranja", partOfSpeech: "adjective", definition: "Having a color between red and yellow (invariable — does not change for gender)", example: "Pintó la pared de color naranja.", topic: "Colors" },
    { term: "morado", partOfSpeech: "adjective", definition: "Having a color that is a mixture of red and blue", example: "A ella le encantan las flores moradas.", topic: "Colors" },
    { term: "taza", partOfSpeech: "noun", definition: "A small container for drinking hot or cold liquids", example: "¿Me puede dar una taza de té, por favor?", topic: "Objects", gender: "f" },
  ],

  A2: [
    { term: "porque", partOfSpeech: "conjunction", definition: "For the reason that", example: "Estoy cansado porque trabajé todo el día.", topic: "Connectors" },
    { term: "siempre", partOfSpeech: "adverb", definition: "At all times; on every occasion", example: "Ella siempre llega a tiempo.", topic: "Frequency" },
    { term: "nunca", partOfSpeech: "adverb", definition: "Not at any time", example: "Nunca como carne.", topic: "Frequency" },
    { term: "a veces", partOfSpeech: "adverb", definition: "Occasionally; not always", example: "A veces cocino en casa.", topic: "Frequency" },
    { term: "feliz", partOfSpeech: "adjective", definition: "Feeling or showing joy", example: "Estoy feliz de conocerte.", topic: "Emotions" },
    { term: "cansado", partOfSpeech: "adjective", definition: "Feeling the need to rest or sleep", example: "Estoy cansado después del viaje largo.", topic: "Emotions" },
    { term: "hambriento", partOfSpeech: "adjective", definition: "Feeling the need to eat food", example: "Estoy hambriento, vamos a almorzar.", topic: "Emotions" },
    { term: "comprar", partOfSpeech: "verb", definition: "To get something by paying money for it", example: "Quiero comprar un teléfono nuevo.", topic: "Shopping" },
    { term: "barato", partOfSpeech: "adjective", definition: "Low in price", example: "Este mercado vende verduras baratas.", topic: "Shopping" },
    { term: "caro", partOfSpeech: "adjective", definition: "Costing a lot of money", example: "Ese restaurante es demasiado caro.", topic: "Shopping" },
    { term: "viajar", partOfSpeech: "verb", definition: "To go from one place to another", example: "Me encanta viajar a países nuevos.", topic: "Travel" },
    { term: "aeropuerto", partOfSpeech: "noun", definition: "A place where aircraft take off and land", example: "Llegamos al aeropuerto a las seis.", topic: "Travel", gender: "m" },
    { term: "boleto", partOfSpeech: "noun", definition: "A piece of paper that allows entry or travel (Spain: billete)", example: "Necesito un boleto para el museo.", topic: "Travel", gender: "m" },
    { term: "saludable", partOfSpeech: "adjective", definition: "Good for your body; not sick", example: "La fruta y la verdura son saludables.", topic: "Health" },
    { term: "médico", partOfSpeech: "noun", definition: "A person trained to treat illness", example: "Necesito ver a un médico.", topic: "Health", gender: "m" },
    { term: "clima", partOfSpeech: "noun", definition: "The temperature and conditions outside (masculine, despite ending in -a)", example: "¿Cómo está el clima hoy?", topic: "Nature", gender: "m" },
    { term: "caluroso", partOfSpeech: "adjective", definition: "Having a high temperature", example: "El verano es muy caluroso.", topic: "Nature" },
    { term: "frío", partOfSpeech: "adjective", definition: "Having a low temperature", example: "Hace frío en enero.", topic: "Nature" },
    { term: "trabajo", partOfSpeech: "noun", definition: "A regular paid position of work", example: "Tengo un trabajo nuevo como maestro.", topic: "Work", gender: "m" },
    { term: "oficina", partOfSpeech: "noun", definition: "A room or building where people work", example: "Trabajo en una oficina en el centro.", topic: "Work", gender: "f" },
    { term: "hermoso", partOfSpeech: "adjective", definition: "Very pleasing to look at", example: "¡Qué atardecer tan hermoso!", topic: "Description" },
    { term: "importante", partOfSpeech: "adjective", definition: "Having great significance or value", example: "El agua es importante para la vida.", topic: "Description" },
    { term: "difícil", partOfSpeech: "adjective", definition: "Not easy; requiring effort", example: "Este ejercicio es difícil.", topic: "Description" },
    { term: "dar", partOfSpeech: "verb", definition: "To provide or hand something to someone", example: "¿Me puedes dar el bolígrafo?", topic: "Actions" },
    { term: "tomar", partOfSpeech: "verb", definition: "To get and carry something with you; to drink", example: "Toma un paraguas, puede llover.", topic: "Actions" },
    { term: "intentar", partOfSpeech: "verb", definition: "To make an attempt at something", example: "Intenta este platillo, está delicioso.", topic: "Actions" },
    { term: "necesitar", partOfSpeech: "verb", definition: "To require something as essential", example: "Necesito ayuda con mi tarea.", topic: "Feelings" },
    { term: "profesor", partOfSpeech: "noun", definition: "A person who teaches (feminine: profesora)", example: "Mi profesor es muy paciente.", topic: "People", gender: "m" },
    { term: "estudiante", partOfSpeech: "noun", definition: "A person who is studying (same form for masculine and feminine)", example: "Ella es estudiante de universidad.", topic: "People" },
    { term: "banco", partOfSpeech: "noun", definition: "A place where money is kept and exchanged", example: "Necesito ir al banco.", topic: "Places", gender: "m" },
    { term: "hospital", partOfSpeech: "noun", definition: "A building where sick people receive treatment", example: "Ella trabaja en el hospital local.", topic: "Places", gender: "m" },
    { term: "estación", partOfSpeech: "noun", definition: "A building where trains or buses stop", example: "La estación de tren está cerca.", topic: "Transport", gender: "f" },
    { term: "parque", partOfSpeech: "noun", definition: "An area of land with grass and trees for public use", example: "Hicimos un picnic en el parque.", topic: "Places", gender: "m" },
    { term: "mañana", partOfSpeech: "noun", definition: "The early part of the day, before noon (also means 'tomorrow')", example: "Hago ejercicio cada mañana.", topic: "Time", gender: "f" },
    { term: "tarde", partOfSpeech: "noun", definition: "The later part of the day, after midday", example: "Vemos televisión por la tarde.", topic: "Time", gender: "f" },
    { term: "semana", partOfSpeech: "noun", definition: "A period of seven days", example: "Trabajo cinco días a la semana.", topic: "Time", gender: "f" },
    { term: "año", partOfSpeech: "noun", definition: "A period of twelve months", example: "Ella estudia mucho cada año.", topic: "Time", gender: "m" },
    { term: "teléfono", partOfSpeech: "noun", definition: "A device used to make calls and send messages", example: "Perdí mi teléfono en el autobús.", topic: "Technology", gender: "m" },
    { term: "internet", partOfSpeech: "noun", definition: "A global network connecting computers worldwide", example: "Uso el internet todos los días.", topic: "Technology", gender: "m" },
    { term: "deporte", partOfSpeech: "noun", definition: "A physical activity done for exercise or competition", example: "El fútbol es mi deporte favorito.", topic: "Leisure", gender: "m" },
    { term: "frecuentemente", partOfSpeech: "adverb", definition: "Many times; often", example: "Voy al gimnasio frecuentemente.", topic: "Frequency" },
    { term: "normalmente", partOfSpeech: "adverb", definition: "Under normal conditions; most of the time", example: "Normalmente me levanto a las siete.", topic: "Frequency" },
    { term: "temprano", partOfSpeech: "adjective", definition: "Before the expected or usual time", example: "Ella llega temprano a clase.", topic: "Time" },
    { term: "atrasado", partOfSpeech: "adjective", definition: "After the expected or usual time; late", example: "¡Perdón, llegué atrasado!", topic: "Time" },
    { term: "enojado", partOfSpeech: "adjective", definition: "Feeling or showing strong displeasure", example: "Él estaba enojado por el error.", topic: "Emotions" },
    { term: "emocionado", partOfSpeech: "adjective", definition: "Feeling or showing enthusiasm and eagerness", example: "Ella está emocionada por su cumpleaños.", topic: "Emotions" },
    { term: "aburrido", partOfSpeech: "adjective", definition: "Feeling uninterested due to lack of activity", example: "Estoy aburrido, hagamos algo.", topic: "Emotions" },
    { term: "preocupado", partOfSpeech: "adjective", definition: "Feeling anxious or troubled about something", example: "Ella estaba preocupada por su examen.", topic: "Emotions" },
    { term: "triste", partOfSpeech: "adjective", definition: "Feeling unhappy or sorrowful", example: "Se sintió triste cuando su amigo se mudó.", topic: "Emotions" },
    { term: "restaurante", partOfSpeech: "noun", definition: "A place where meals are prepared and served", example: "Vamos a ese restaurante italiano.", topic: "Places", gender: "m" },
    { term: "hotel", partOfSpeech: "noun", definition: "A building where people pay to stay overnight", example: "Nos quedamos en un hotel bonito.", topic: "Travel", gender: "m" },
    { term: "museo", partOfSpeech: "noun", definition: "A building where objects of historical interest are shown", example: "Visitamos el museo de historia.", topic: "Places", gender: "m" },
    { term: "biblioteca", partOfSpeech: "noun", definition: "A building where books are kept for people to borrow", example: "Tomé prestado este libro de la biblioteca.", topic: "Places", gender: "f" },
    { term: "gimnasio", partOfSpeech: "noun", definition: "A place with equipment for physical exercise", example: "Ella va al gimnasio tres veces por semana.", topic: "Health", gender: "m" },
    { term: "tren", partOfSpeech: "noun", definition: "A vehicle that travels on rails carrying passengers", example: "Tomo el tren para ir al trabajo.", topic: "Transport", gender: "m" },
    { term: "autobús", partOfSpeech: "noun", definition: "A large vehicle that carries passengers along a fixed route", example: "El autobús llega a las ocho.", topic: "Transport", gender: "m" },
    { term: "bicicleta", partOfSpeech: "noun", definition: "A vehicle with two wheels powered by pedaling", example: "Voy a la escuela en bicicleta.", topic: "Transport", gender: "f" },
    { term: "verdura", partOfSpeech: "noun", definition: "A plant or part of a plant eaten as food", example: "Las zanahorias y el brócoli son verduras.", topic: "Food", gender: "f" },
    { term: "fruta", partOfSpeech: "noun", definition: "The sweet, edible product of a tree or plant", example: "Como fruta en el desayuno.", topic: "Food", gender: "f" },
    { term: "huevo", partOfSpeech: "noun", definition: "An oval object laid by a bird, used as food", example: "Como huevos en el desayuno.", topic: "Food", gender: "m" },
    { term: "pollo", partOfSpeech: "noun", definition: "A common bird raised for its meat and eggs", example: "Comí pollo con arroz en la cena.", topic: "Food", gender: "m" },
    { term: "arroz", partOfSpeech: "noun", definition: "A common grain food eaten in many countries", example: "El arroz es un alimento básico en Asia.", topic: "Food", gender: "m" },
    { term: "computadora", partOfSpeech: "noun", definition: "An electronic device for processing information (Spain: ordenador)", example: "Uso mi computadora para trabajar.", topic: "Technology", gender: "f" },
    { term: "correo electrónico", partOfSpeech: "noun", definition: "A message sent electronically over the internet", example: "Le envié un correo electrónico ayer.", topic: "Technology", gender: "m" },
    { term: "mensaje", partOfSpeech: "noun", definition: "A written or spoken piece of information sent to someone", example: "Ella me dejó un mensaje.", topic: "Communication", gender: "m" },
    { term: "hora", partOfSpeech: "noun", definition: "A period of sixty minutes", example: "La clase dura una hora.", topic: "Time", gender: "f" },
    { term: "minuto", partOfSpeech: "noun", definition: "A period of sixty seconds", example: "Espera un minuto, por favor.", topic: "Time", gender: "m" },
    { term: "mes", partOfSpeech: "noun", definition: "One of the twelve periods of time in a year", example: "Enero es el primer mes.", topic: "Time", gender: "m" },
    { term: "hacer", partOfSpeech: "verb", definition: "To create, produce, or prepare something", example: "Yo hago mi propio almuerzo.", topic: "Actions" },
    { term: "encontrar", partOfSpeech: "verb", definition: "To discover or locate something or someone", example: "No puedo encontrar mis llaves.", topic: "Actions" },
    { term: "preguntar", partOfSpeech: "verb", definition: "To put a question to someone", example: "No tengas miedo de preguntar.", topic: "Communication" },
    { term: "aprender", partOfSpeech: "verb", definition: "To gain knowledge or a skill through study or experience", example: "Quiero aprender a tocar la guitarra.", topic: "Education" },
    { term: "lluvia", partOfSpeech: "noun", definition: "Water that falls from clouds as drops", example: "No olvides el paraguas, puede haber lluvia.", topic: "Nature", gender: "f" },
    { term: "sol", partOfSpeech: "noun", definition: "The star at the center of our solar system", example: "El sol brilla hoy.", topic: "Nature", gender: "m" },
    { term: "supermercado", partOfSpeech: "noun", definition: "A large shop selling food and household goods", example: "Voy al supermercado cada sábado.", topic: "Places", gender: "m" },
    { term: "enviar", partOfSpeech: "verb", definition: "To cause something to go to a place", example: "¿Me puedes enviar el archivo?", topic: "Actions" },
    { term: "fútbol", partOfSpeech: "noun", definition: "A team sport played by kicking a ball into a goal", example: "Él juega fútbol cada fin de semana.", topic: "Sports", gender: "m" },
    { term: "natación", partOfSpeech: "noun", definition: "The activity of moving through water using the body", example: "La natación es buena para la salud.", topic: "Sports", gender: "f" },
    { term: "tenis", partOfSpeech: "noun", definition: "A sport played with rackets and a ball on a court", example: "Juego tenis los domingos.", topic: "Sports", gender: "m" },
    { term: "baloncesto", partOfSpeech: "noun", definition: "A team sport where players throw a ball through a hoop (also: básquetbol)", example: "A mi hermano le encanta el baloncesto.", topic: "Sports", gender: "m" },
    { term: "correr", partOfSpeech: "noun", definition: "The activity of moving fast on foot (infinitive used as a noun)", example: "Correr cada mañana me mantiene en forma.", topic: "Sports", gender: "m" },
    { term: "tienda", partOfSpeech: "noun", definition: "A place where goods are sold to the public", example: "Hay una tienda de ropa cerca.", topic: "Shopping", gender: "f" },
    { term: "precio", partOfSpeech: "noun", definition: "The amount of money needed to buy something", example: "¿Cuál es el precio de esta chaqueta?", topic: "Shopping", gender: "m" },
    { term: "talla", partOfSpeech: "noun", definition: "The measurement of how large or small clothing is", example: "¿Qué talla de zapatos usas?", topic: "Shopping", gender: "f" },
    { term: "recibo", partOfSpeech: "noun", definition: "A written proof of something bought or received", example: "Guarda el recibo si quieres devolverlo.", topic: "Shopping", gender: "m" },
    { term: "dolor de cabeza", partOfSpeech: "noun", definition: "A pain felt inside the head", example: "Tengo un dolor de cabeza terrible hoy.", topic: "Health", gender: "m" },
    { term: "medicina", partOfSpeech: "noun", definition: "A substance taken to treat illness", example: "Toma esta medicina dos veces al día.", topic: "Health", gender: "f" },
    { term: "enfermero", partOfSpeech: "noun", definition: "A person trained to care for sick people (feminine: enfermera)", example: "El enfermero me tomó la temperatura.", topic: "Health", gender: "m" },
    { term: "cita", partOfSpeech: "noun", definition: "A planned meeting at a specific time", example: "Tengo una cita con el médico a las tres.", topic: "Health", gender: "f" },
    { term: "pasaporte", partOfSpeech: "noun", definition: "An official document for travelling to other countries", example: "No olvides tu pasaporte en el aeropuerto.", topic: "Travel", gender: "m" },
    { term: "maleta", partOfSpeech: "noun", definition: "A large bag with a handle used when travelling", example: "Hice mi maleta la noche anterior.", topic: "Travel", gender: "f" },
    { term: "mapa", partOfSpeech: "noun", definition: "A drawing showing the roads and features of an area (masculine, despite ending in -a)", example: "Usamos un mapa para encontrar el hotel.", topic: "Travel", gender: "m" },
    { term: "recorrido", partOfSpeech: "noun", definition: "An organized trip to see places of interest", example: "Hicimos un recorrido por la ciudad antigua.", topic: "Travel", gender: "m" },
    { term: "ingeniero", partOfSpeech: "noun", definition: "A person who designs or builds machines and structures (feminine: ingeniera)", example: "Mi tío es ingeniero civil.", topic: "Jobs", gender: "m" },
    { term: "policía", partOfSpeech: "noun", definition: "An organization that enforces laws and keeps public order", example: "Llama a la policía si ves algo extraño.", topic: "Jobs", gender: "f" },
    { term: "cocinero", partOfSpeech: "noun", definition: "A person who prepares food professionally (feminine: cocinera)", example: "El cocinero preparó una sopa deliciosa.", topic: "Jobs", gender: "m" },
    { term: "agricultor", partOfSpeech: "noun", definition: "A person who grows crops or raises animals (feminine: agricultora)", example: "El agricultor se levanta muy temprano.", topic: "Jobs", gender: "m" },
    { term: "conductor", partOfSpeech: "noun", definition: "A person who operates a vehicle (feminine: conductora)", example: "El conductor del autobús conoce cada ruta.", topic: "Jobs", gender: "m" },
    { term: "dentista", partOfSpeech: "noun", definition: "A doctor who treats teeth and gums (same form for masculine and feminine)", example: "Visito al dentista dos veces al año.", topic: "Jobs" },
    { term: "despertarse", partOfSpeech: "verb", definition: "To stop sleeping and become conscious", example: "Me despierto a las siete cada mañana.", topic: "Routines" },
    { term: "ducha", partOfSpeech: "noun", definition: "The act of washing under running water", example: "Tomo una ducha cada mañana.", topic: "Routines", gender: "f" },
    { term: "cepillarse", partOfSpeech: "verb", definition: "To clean with a brush", example: "Me cepillo los dientes dos veces al día.", topic: "Routines" },
    { term: "vestirse", partOfSpeech: "verb", definition: "To put on clothes", example: "Me visto antes de desayunar.", topic: "Routines" },
    { term: "sorprendido", partOfSpeech: "adjective", definition: "Feeling astonishment at something unexpected", example: "Ella estaba sorprendida por la fiesta.", topic: "Feelings" },
    { term: "nervioso", partOfSpeech: "adjective", definition: "Feeling anxious or apprehensive about something", example: "Me sentí nervioso antes del examen.", topic: "Feelings" },
    { term: "orgulloso", partOfSpeech: "adjective", definition: "Feeling deep pleasure from your own achievements", example: "Estaba orgullosa de sus resultados.", topic: "Feelings" },
    { term: "asustado", partOfSpeech: "adjective", definition: "Feeling frightened or afraid", example: "Él está asustado de las arañas.", topic: "Feelings" },
    { term: "confundido", partOfSpeech: "adjective", definition: "Unable to think clearly or understand something", example: "Estoy confundido con estas instrucciones.", topic: "Feelings" },
    { term: "contraseña", partOfSpeech: "noun", definition: "A secret word used to access a computer or account", example: "No compartas tu contraseña con nadie.", topic: "Technology", gender: "f" },
    { term: "cámara", partOfSpeech: "noun", definition: "A device for taking photographs or recording video", example: "Tomé fotos con mi cámara.", topic: "Technology", gender: "f" },
    { term: "video", partOfSpeech: "noun", definition: "A recording of moving images", example: "Ella vio un video en línea.", topic: "Technology", gender: "m" },
    { term: "pantalla", partOfSpeech: "noun", definition: "The flat surface of a phone, computer, or TV", example: "Se rompió la pantalla de mi teléfono.", topic: "Technology", gender: "f" },
    { term: "bosque", partOfSpeech: "noun", definition: "A large area of land covered with trees", example: "Caminamos por el bosque.", topic: "Nature", gender: "m" },
    { term: "río", partOfSpeech: "noun", definition: "A large natural stream of water that flows to the sea", example: "El río pasa por la ciudad.", topic: "Nature", gender: "m" },
    { term: "montaña", partOfSpeech: "noun", definition: "A very high area of land with steep sides", example: "Subimos la montaña el verano pasado.", topic: "Nature", gender: "f" },
    { term: "mar", partOfSpeech: "noun", definition: "A large body of salty water", example: "El mar está tranquilo y azul hoy.", topic: "Nature", gender: "m" },
    { term: "cielo", partOfSpeech: "noun", definition: "The space above the earth", example: "El cielo está lleno de estrellas esta noche.", topic: "Nature", gender: "m" },
    { term: "flor", partOfSpeech: "noun", definition: "The colorful part of a plant", example: "Me regaló un ramo de flores.", topic: "Nature", gender: "f" },
    { term: "pasatiempo", partOfSpeech: "noun", definition: "An activity done regularly in your free time for enjoyment", example: "Mi pasatiempo es pintar.", topic: "Hobbies", gender: "m" },
    { term: "música", partOfSpeech: "noun", definition: "Sounds arranged in a pleasant or meaningful way", example: "Escucho música todos los días.", topic: "Hobbies", gender: "f" },
    { term: "pintura", partOfSpeech: "noun", definition: "The activity or art of creating pictures using paint", example: "A ella le encanta la pintura de paisajes.", topic: "Hobbies", gender: "f" },
    { term: "cocina", partOfSpeech: "noun", definition: "The activity of preparing food; cuisine (same word as 'kitchen')", example: "La cocina es uno de mis pasatiempos favoritos.", topic: "Hobbies", gender: "f" },
    { term: "lectura", partOfSpeech: "noun", definition: "The activity of reading", example: "La lectura es una excelente manera de relajarse.", topic: "Hobbies", gender: "f" },
    { term: "baile", partOfSpeech: "noun", definition: "The activity of moving your body rhythmically to music", example: "Ella va a bailar cada sábado por la noche.", topic: "Hobbies", gender: "m" },
    { term: "fotografía", partOfSpeech: "noun", definition: "An image taken with a camera", example: "Tomé una fotografía del atardecer.", topic: "Hobbies", gender: "f" },
    { term: "idioma", partOfSpeech: "noun", definition: "A system of words and grammar used for communication (masculine, despite ending in -a)", example: "El inglés es un idioma global.", topic: "Education", gender: "m" },
    { term: "clase", partOfSpeech: "noun", definition: "A group of students taught together", example: "Hay veinte estudiantes en mi clase.", topic: "Education", gender: "f" },
    { term: "lección", partOfSpeech: "noun", definition: "A period of teaching or learning", example: "La lección de español es a las diez.", topic: "Education", gender: "f" },
    { term: "tarea", partOfSpeech: "noun", definition: "Schoolwork set for students to do at home", example: "Se me olvidó hacer la tarea.", topic: "Education", gender: "f" },
    { term: "examen", partOfSpeech: "noun", definition: "A set of questions or problems to measure knowledge", example: "Tenemos un examen de matemáticas el viernes.", topic: "Education", gender: "m" },
    { term: "juntos", partOfSpeech: "adverb", definition: "With each other; at the same time or place", example: "Estudiamos juntos en la biblioteca.", topic: "Basics" },
    { term: "otra vez", partOfSpeech: "adverb", definition: "One more time; another time", example: "¿Puede decir eso otra vez, por favor?", topic: "Basics" },
    { term: "también", partOfSpeech: "adverb", definition: "In addition; too", example: "A mí también me gusta el chocolate.", topic: "Basics" },
    { term: "aquí", partOfSpeech: "adverb", definition: "In, at, or to this place", example: "Por favor, siéntate aquí.", topic: "Basics" },
    { term: "allí", partOfSpeech: "adverb", definition: "In, at, or to that place", example: "Pon el libro allí.", topic: "Basics" },
    { term: "próximo", partOfSpeech: "adjective", definition: "Immediately after the present one in time or place", example: "¡Nos vemos la próxima semana!", topic: "Time" },
    { term: "último", partOfSpeech: "adjective", definition: "Coming after all others; most recent", example: "Esta es la última vez que llego tarde.", topic: "Time" },
    { term: "esperar", partOfSpeech: "verb", definition: "To stay in a place until something happens", example: "Por favor, espera aquí.", topic: "Actions" },
    { term: "empezar", partOfSpeech: "verb", definition: "To begin doing something", example: "La película empieza a las ocho.", topic: "Actions" },
    { term: "parar", partOfSpeech: "verb", definition: "To no longer continue doing something", example: "Para de hablar y escucha, por favor.", topic: "Actions" },
    { term: "girar", partOfSpeech: "verb", definition: "To move or change direction", example: "Gira a la izquierda en el semáforo.", topic: "Actions" },
    { term: "perder", partOfSpeech: "verb", definition: "To be unable to find something; to fail to win", example: "Siempre pierdo mis llaves.", topic: "Actions" },
    { term: "recordar", partOfSpeech: "verb", definition: "To bring back into your mind something from the past", example: "No puedo recordar su nombre.", topic: "Cognition" },
    { term: "entender", partOfSpeech: "verb", definition: "To know the meaning of something", example: "¿Entiendes la pregunta?", topic: "Cognition" },
    { term: "pensar", partOfSpeech: "verb", definition: "To use your mind to consider or reason about something", example: "Pienso que va a llover hoy.", topic: "Cognition" },
    { term: "responder", partOfSpeech: "verb", definition: "To respond to a question or problem", example: "¿Puedes responder mi pregunta?", topic: "Communication" },
    { term: "llamar", partOfSpeech: "verb", definition: "To contact someone by telephone", example: "Te voy a llamar más tarde.", topic: "Communication" },
    { term: "visitar", partOfSpeech: "verb", definition: "To go to see a person or place", example: "Visitamos la Torre Eiffel.", topic: "Travel" },
    { term: "llegar", partOfSpeech: "verb", definition: "To reach a place after a journey", example: "El tren va a llegar al mediodía.", topic: "Travel" },
    { term: "salir", partOfSpeech: "verb", definition: "To go away from a place", example: "Salimos para París mañana.", topic: "Travel" },
  ],

  B1: [], // Phase 2 — out of scope for this plan
  B2: [], // Phase 2 — out of scope for this plan
  C1: [], // Phase 2 — out of scope for this plan
  C2: [], // Phase 2 — out of scope for this plan
};
```

- [ ] **Step 2: Validate counts**

Run: `grep -c "term:" src/data/es/vocabulary.ts` — should be 300 (150 + 150). Manually confirm no duplicate `term` within the *same* level (cross-level duplicates like `correr` appearing once in A1 as a verb and once in A2 as a noun are fine — progress tracking and React keys are scoped per level).

Run: `grep -n "vosotro\|vuestro" src/data/es/vocabulary.ts` — expected: no matches.

- [ ] **Step 3: Type-check**

Run: `npm run build` — expected to fail only on pre-existing broken imports elsewhere (Task 2), not on this file.

- [ ] **Step 4: Commit**

```bash
git add src/data/es/vocabulary.ts
git commit -m "feat(data): add Spanish A1/A2 vocabulary (300 words, hermitdave-checked, PCIC-curated topics)"
```

---

## Task 5: Spanish grammar content (A1 + A2)

**Files:**
- Create: `src/data/es/grammar.ts`

**Interfaces:**
- Consumes: `CEFRLevel`, `GrammarRule` from `@/data/types`.
- Produces: `GRAMMAR: Record<CEFRLevel, GrammarRule[]>`, A1 = 12 rules, A2 = 12 rules, B1–C2 = `[]`.

- [ ] **Step 1: Create the file**

```typescript
// src/data/es/grammar.ts
//
// Neutral / Latin American Spanish. No "vosotros" forms — informal plural
// "you" uses "ustedes" throughout, matching the confirmed variant choice.

import type { CEFRLevel, GrammarRule } from "@/data/types";
export type { CEFRLevel, GrammarRule };

export const GRAMMAR: Record<CEFRLevel, GrammarRule[]> = {
  A1: [
    {
      title: "Ser vs. Estar",
      explanation: "Spanish has two verbs for 'to be'. Use 'ser' for identity, origin, and permanent characteristics; use 'estar' for location, temporary states, and feelings.",
      structure: "Sujeto + soy/eres/es/somos/son (ser) · Sujeto + estoy/estás/está/estamos/están (estar)",
      examples: [
        "Soy estudiante. (identity — ser)",
        "Estoy cansado. (temporary state — estar)",
        "Ella es de México. (origin — ser)",
        "El café está frío. (temporary condition — estar)",
      ],
      notes: "This is the hardest concept for English speakers — English only has one verb 'to be'. When in doubt: unchanging fact → ser; changing state or location → estar.",
    },
    {
      title: "Presente de Indicativo — Regular Verbs",
      explanation: "Describes habits, routines, and general facts, similar to the English present simple. Regular verbs conjugate by dropping -ar/-er/-ir and adding an ending.",
      structure: "-ar: -o, -as, -a, -amos, -an · -er: -o, -es, -e, -emos, -en · -ir: -o, -es, -e, -imos, -en",
      examples: [
        "Yo hablo español. (hablar)",
        "Ella come a las dos. (comer)",
        "Nosotros vivimos en Lima. (vivir)",
        "Ellos trabajan los sábados. (trabajar)",
      ],
      notes: "No 'do/does' needed for questions — just raise your voice or add '¿verdad?': '¿Hablas inglés?'",
    },
    {
      title: "Artículos: el / la / los / las, un / una",
      explanation: "Articles must agree in gender (masculine/feminine) and number (singular/plural) with the noun they accompany.",
      structure: "el/un (masc. sg.) · la/una (fem. sg.) · los/unos (masc. pl.) · las/unas (fem. pl.)",
      examples: [
        "El libro está en la mesa.",
        "Una casa grande.",
        "Los estudiantes hablan español.",
        "Las manzanas son rojas.",
      ],
      notes: "Feminine nouns starting with stressed 'a-' (agua, área) still use 'el' in the singular for pronunciation: 'el agua fría', but 'las aguas'.",
    },
    {
      title: "Pronombres Personales",
      explanation: "Subject pronouns are often omitted in Spanish because the verb ending already shows who is acting — they're used mainly for emphasis or clarity.",
      structure: "yo / tú / usted / él / ella / nosotros / ustedes / ellos / ellas",
      examples: [
        "Yo vivo en Bogotá.",
        "¿Tú hablas español?",
        "Usted es muy amable. (formal 'you')",
        "Ustedes son mis amigos. (plural 'you' — neutral/Latin American)",
      ],
      notes: "This course uses Latin American Spanish: 'ustedes' covers plural 'you' in every register. 'Vosotros' (informal plural 'you', used only in Spain) is intentionally not taught here.",
    },
    {
      title: "Género y Número de los Sustantivos",
      explanation: "Every Spanish noun is either masculine or feminine, and this affects the articles and adjectives used with it. Most nouns ending in -o are masculine and -a are feminine, but there are common exceptions.",
      structure: "-o → masculino (el libro) · -a → femenino (la casa) · exceptions: el día, el mapa, el idioma, la mano",
      examples: [
        "el libro → los libros",
        "la casa → las casas",
        "el día (masculine, despite -a)",
        "la mano (feminine, despite -o)",
      ],
    },
    {
      title: "Concordancia de Adjetivos",
      explanation: "Adjectives must match the gender and number of the noun they describe, and usually come after the noun.",
      structure: "noun + adjective (agreeing in gender/number)",
      examples: [
        "un perro pequeño",
        "una casa pequeña",
        "unos libros interesantes",
        "unas flores bonitas",
      ],
    },
    {
      title: "Demostrativos: este / ese / aquel",
      explanation: "Demonstratives point to something near the speaker, near the listener, or far from both.",
      structure: "este/esta (this, near me) · ese/esa (that, near you) · aquel/aquella (that, far from both)",
      examples: [
        "Este libro es mío.",
        "Esa silla es cómoda.",
        "Aquella montaña es muy alta.",
        "Estas flores son para ti.",
      ],
    },
    {
      title: "Posesivos",
      explanation: "Possessive adjectives show ownership and agree in number with the thing owned (not the owner).",
      structure: "mi(s) / tu(s) / su(s) / nuestro(a,os,as) / su(s)",
      examples: [
        "Mi hermano vive en Chile.",
        "Nuestra casa es grande.",
        "Sus libros están en la mesa.",
        "Tu nombre es bonito.",
      ],
      notes: "'Su/sus' can mean his, her, its, your (formal), or their — context clarifies which.",
    },
    {
      title: "El Verbo Gustar",
      explanation: "'Gustar' works backwards from English 'like' — the thing liked is the grammatical subject, and the person is an indirect object.",
      structure: "me/te/le/nos/les + gusta (singular) / gustan (plural) + noun",
      examples: [
        "Me gusta el café.",
        "¿Te gustan las manzanas?",
        "Le gusta bailar.",
        "Nos gusta viajar.",
      ],
      notes: "Literally: 'coffee is pleasing to me'. This same pattern is used for encantar, molestar, and interesar.",
    },
    {
      title: "Interrogativos",
      explanation: "Question words always carry a written accent and go at the start of the question.",
      structure: "¿qué? ¿quién? ¿cómo? ¿dónde? ¿cuándo? ¿por qué?",
      examples: [
        "¿Qué hora es?",
        "¿Quién es esa persona?",
        "¿Dónde vives?",
        "¿Por qué estudias español?",
      ],
    },
    {
      title: "Hay (Haber Impersonal)",
      explanation: "'Hay' means 'there is/there are' and never changes form, regardless of singular or plural.",
      structure: "hay + noun (singular or plural)",
      examples: [
        "Hay un gato en el jardín.",
        "Hay tres sillas en la cocina.",
        "¿Hay un banco cerca de aquí?",
        "No hay leche en la casa.",
      ],
      notes: "Never say 'hay son' or conjugate 'hay' for plural — it's always 'hay'.",
    },
    {
      title: "Números Cardinales y la Hora",
      explanation: "Cardinal numbers 1–100 are used for counting and telling time with 'ser'.",
      structure: "Son las + [number] (plural hours) · Es la una (singular exception)",
      examples: [
        "Son las tres de la tarde.",
        "Es la una en punto.",
        "Tengo veinte años.",
        "Hay cien páginas en el libro.",
      ],
    },
  ],

  A2: [
    {
      title: "Pretérito Indefinido (Simple Past)",
      explanation: "Describes completed actions at a specific point in the past, seen as finished events.",
      structure: "-ar: -é, -aste, -ó, -amos, -aron · -er/-ir: -í, -iste, -ió, -imos, -ieron",
      examples: [
        "Visité Perú el año pasado.",
        "Ella compró un teléfono nuevo.",
        "Comimos en un restaurante italiano.",
        "¿Llegaste a tiempo?",
      ],
      notes: "Many common verbs are irregular in this tense: ir/ser → fui, hacer → hice, tener → tuve.",
    },
    {
      title: "Pretérito Imperfecto",
      explanation: "Describes ongoing or habitual actions in the past, or sets the scene — used for background, not completed events.",
      structure: "-ar: -aba, -abas, -aba, -ábamos, -aban · -er/-ir: -ía, -ías, -ía, -íamos, -ían",
      examples: [
        "Cuando era niño, vivía en Lima.",
        "Ella siempre llegaba temprano.",
        "Hacía calor esa tarde.",
        "Nosotros jugábamos en el parque todos los días.",
      ],
    },
    {
      title: "Pretérito Indefinido vs. Imperfecto",
      explanation: "The two main past tenses contrast completed events (indefinido) with ongoing background or habits (imperfecto) — often used together in the same sentence.",
      structure: "imperfecto (background) + indefinido (interrupting event)",
      examples: [
        "Yo dormía cuando sonó el teléfono.",
        "Llovía mientras caminábamos al trabajo.",
        "Ella vivía en Madrid cuando conoció a su esposo.",
        "Comíamos cuando llegó el mensaje.",
      ],
      notes: "Rule of thumb: imperfecto = the scenery, indefinido = what happened in it.",
    },
    {
      title: "Presente Continuo (estar + gerundio)",
      explanation: "Describes an action happening right now, formed with 'estar' plus the gerund (-ando/-iendo).",
      structure: "estoy/estás/está/estamos/están + verb-ando/-iendo",
      examples: [
        "Estoy estudiando español.",
        "Ella está cocinando la cena.",
        "Están jugando fútbol en el parque.",
        "¿Qué estás haciendo?",
      ],
    },
    {
      title: "Futuro con Ir a + Infinitivo",
      explanation: "The most common way to talk about future plans in everyday Spanish, similar to English 'going to'.",
      structure: "voy/vas/va/vamos/van + a + infinitivo",
      examples: [
        "Voy a viajar el próximo verano.",
        "Ella va a estudiar medicina.",
        "Vamos a comer a las ocho.",
        "¿Qué vas a hacer mañana?",
      ],
    },
    {
      title: "Comparativos y Superlativos",
      explanation: "Compare two things or single one out as the most/least within a group.",
      structure: "más/menos + adjective + que (comparative) · el/la más + adjective (superlative)",
      examples: [
        "Este libro es más interesante que aquel.",
        "Ella es menos alta que su hermana.",
        "El español es tan útil como el inglés. (equality)",
        "Es la ciudad más grande del país.",
      ],
      notes: "Irregulars: bueno → mejor, malo → peor, grande → mayor, pequeño → menor.",
    },
    {
      title: "Poder / Saber",
      explanation: "Both can translate 'can' in English, but they mean different things: 'poder' is physical/circumstantial ability or permission, 'saber' is learned skill or knowledge.",
      structure: "puedo/puedes/puede... + infinitivo (poder) · sé/sabes/sabe... + infinitivo (saber)",
      examples: [
        "Puedo llegar a las tres. (I'm available)",
        "Sé nadar desde niño. (I learned how)",
        "¿Puedes ayudarme? (are you able to / will you)",
        "Ella sabe hablar tres idiomas.",
      ],
    },
    {
      title: "Pronombres de Objeto Directo e Indirecto",
      explanation: "Object pronouns replace nouns already mentioned and usually go right before the conjugated verb.",
      structure: "directo: lo/la/los/las · indirecto: le/les",
      examples: [
        "¿Ves el libro? Sí, lo veo. (lo = el libro)",
        "Compré la fruta y la comí. (la = la fruta)",
        "Le di un regalo a mi madre. (le = a mi madre)",
        "Les envié un mensaje a mis amigos.",
      ],
    },
    {
      title: "Verbos Reflexivos",
      explanation: "Reflexive verbs describe an action the subject does to themselves, marked with pronouns me/te/se/nos/se.",
      structure: "me/te/se/nos/se + verb",
      examples: [
        "Me despierto a las siete.",
        "Ella se viste rápido.",
        "Nos cepillamos los dientes después de comer.",
        "¿A qué hora te levantas?",
      ],
    },
    {
      title: "Cuánto / Cuántos",
      explanation: "Ask about quantity — 'cuánto/a' for uncountable nouns, 'cuántos/as' for countable plural nouns, always agreeing in gender.",
      structure: "¿Cuánto/a + uncountable noun? · ¿Cuántos/as + countable noun?",
      examples: [
        "¿Cuánta agua necesitas?",
        "¿Cuántos hermanos tienes?",
        "¿Cuánto cuesta esto?",
        "¿Cuántas horas duermes?",
      ],
    },
    {
      title: "Preposiciones: Por y Para",
      explanation: "Two prepositions that both can translate 'for' in English but serve different purposes — 'para' for purpose/destination/deadline, 'por' for cause/means/duration.",
      structure: "para + purpose/destination/recipient · por + cause/means/duration/exchange",
      examples: [
        "Este regalo es para ti. (recipient)",
        "Salimos para Lima mañana. (destination)",
        "Viajamos por avión. (means)",
        "Gracias por tu ayuda. (cause)",
      ],
    },
    {
      title: "Mandatos Informales (tú)",
      explanation: "Informal commands tell someone (using 'tú') to do something. Affirmative commands use the same form as the third person singular present for regular verbs.",
      structure: "affirmative: same as él/ella present (habla, come, escribe) · negative: no + subjunctive (no hables, no comas, no escribas)",
      examples: [
        "¡Habla más despacio, por favor!",
        "¡Come tus verduras!",
        "No hables tan rápido.",
        "Escribe tu nombre aquí.",
      ],
      notes: "Several verbs have irregular affirmative tú commands: ir → ve, tener → ten, hacer → haz, poner → pon, salir → sal, ser → sé, decir → di, venir → ven.",
    },
  ],

  B1: [], // Phase 2 — out of scope for this plan
  B2: [], // Phase 2 — out of scope for this plan
  C1: [], // Phase 2 — out of scope for this plan
  C2: [], // Phase 2 — out of scope for this plan
};
```

- [ ] **Step 2: Validate**

Run: `grep -c "title:" src/data/es/grammar.ts` — should be 24 (12 + 12).
Run: `grep -n "vosotro\|vuestro" src/data/es/grammar.ts` — expected: no matches.

- [ ] **Step 3: Type-check**

Run: `npm run build` (same caveat as Task 4 — pre-existing broken imports elsewhere are expected until Task 7).

- [ ] **Step 4: Commit**

```bash
git add src/data/es/grammar.ts
git commit -m "feat(data): add Spanish A1/A2 grammar rules (24 rules, neutral/LatAm variant)"
```

---

## Task 6: Spanish phrases content (A1 + A2)

**Files:**
- Create: `src/data/es/phrases.ts`

**Interfaces:**
- Consumes: `CEFRLevel`, `Phrase`, `PhraseTopic` from `@/data/types`.
- Produces: `PHRASES: Record<CEFRLevel, PhraseTopic[]>`, A1 = 6 topics, A2 = 6 topics (same topic names/icons as `data/en/phrases.ts` for structural parity — topic tabs look identical regardless of active language), B1–C2 = `[]`.

Content note: for each topic, the Spanish `phrase` here is the same real-world expression already validated as the `translation` field in the existing `data/en/phrases.ts` (already neutral, already `tú`-based, no `vosotros` present) — recast with English as the gloss instead of the target. This keeps both languages' phrasebooks describing the exact same situations.

- [ ] **Step 1: Create the file**

```typescript
// src/data/es/phrases.ts
import type { CEFRLevel, Phrase, PhraseTopic } from "@/data/types";
export type { CEFRLevel, Phrase, PhraseTopic };

export const PHRASES: Record<CEFRLevel, PhraseTopic[]> = {
  A1: [
    {
      topic: "Greetings",
      icon: "👋",
      phrases: [
        { phrase: "¡Hola!", translation: "Hello!", context: "General greeting" },
        { phrase: "¡Buenos días!", translation: "Good morning!", context: "Morning greeting" },
        { phrase: "¡Buenas tardes!", translation: "Good afternoon!", context: "Afternoon greeting" },
        { phrase: "¡Buenas noches!", translation: "Good night!", context: "Evening farewell" },
        { phrase: "¿Cómo estás?", translation: "How are you?", context: "Asking about wellbeing" },
        { phrase: "Estoy bien, gracias.", translation: "I'm fine, thanks.", context: "Responding to 'How are you?'" },
        { phrase: "¡Encantado/a de conocerte!", translation: "Nice to meet you!", context: "First meeting" },
        { phrase: "¡Adiós!", translation: "Goodbye! / Bye!", context: "Farewell" },
        { phrase: "¡Hasta luego!", translation: "See you later!", context: "Informal farewell" },
        { phrase: "¡Hasta mañana!", translation: "See you tomorrow!", context: "Farewell until next day" },
      ],
    },
    {
      topic: "Introductions",
      icon: "🙋",
      phrases: [
        { phrase: "Me llamo…", translation: "My name is…", context: "Stating your name" },
        { phrase: "Soy de…", translation: "I am from…", context: "Stating your country/city" },
        { phrase: "Tengo… años.", translation: "I am… years old.", context: "Stating your age" },
        { phrase: "Hablo un poco de inglés.", translation: "I speak a little English.", context: "Language ability" },
        { phrase: "¿Hablas español?", translation: "Do you speak Spanish?", context: "Asking about languages" },
        { phrase: "¿De dónde eres?", translation: "Where are you from?", context: "Asking someone's origin" },
        { phrase: "Vivo en…", translation: "I live in…", context: "Stating where you live" },
        { phrase: "Soy estudiante / profesor(a).", translation: "I am a student / teacher.", context: "Stating your occupation" },
      ],
    },
    {
      topic: "Politeness",
      icon: "🙏",
      phrases: [
        { phrase: "Por favor.", translation: "Please.", context: "Polite request" },
        { phrase: "Muchas gracias.", translation: "Thank you very much.", context: "Gratitude" },
        { phrase: "De nada.", translation: "You're welcome.", context: "Response to thanks" },
        { phrase: "Perdón / Con permiso.", translation: "Excuse me.", context: "Getting attention or passing" },
        { phrase: "Lo siento.", translation: "I'm sorry.", context: "Apologizing" },
        { phrase: "No entiendo.", translation: "I don't understand.", context: "Comprehension issue" },
        { phrase: "¿Puedes repetir eso, por favor?", translation: "Can you repeat that, please?", context: "Asking for repetition" },
        { phrase: "¿Puedes hablar más despacio?", translation: "Can you speak more slowly?", context: "Asking someone to slow down" },
      ],
    },
    {
      topic: "Numbers & Time",
      icon: "🕐",
      phrases: [
        { phrase: "¿Qué hora es?", translation: "What time is it?", context: "Asking the time" },
        { phrase: "Son las tres.", translation: "It is three o'clock.", context: "Telling the time" },
        { phrase: "Hoy es lunes.", translation: "Today is Monday.", context: "Day of the week" },
        { phrase: "¿Cuánto cuesta?", translation: "How much does it cost?", context: "Shopping" },
        { phrase: "Son las dos y media.", translation: "It's half past two.", context: "Telling half past the hour" },
        { phrase: "Por la mañana / tarde / noche.", translation: "In the morning / afternoon / evening.", context: "Parts of the day" },
      ],
    },
    {
      topic: "Classroom Language",
      icon: "📚",
      phrases: [
        { phrase: "¿Qué significa…?", translation: "What does … mean?", context: "Asking for a definition" },
        { phrase: "¿Cómo se escribe…?", translation: "How do you spell…?", context: "Asking for spelling" },
        { phrase: "¿Puedo ir al baño?", translation: "Can I go to the bathroom?", context: "Making a request" },
        { phrase: "Tengo una pregunta.", translation: "I have a question.", context: "In class" },
        { phrase: "¿Puedes ayudarme?", translation: "Can you help me?", context: "Asking for help" },
        { phrase: "No sé.", translation: "I don't know.", context: "Admitting uncertainty" },
      ],
    },
    {
      topic: "Basic Needs",
      icon: "🏠",
      phrases: [
        { phrase: "Tengo hambre.", translation: "I'm hungry.", context: "Expressing hunger" },
        { phrase: "Tengo sed.", translation: "I'm thirsty.", context: "Expressing thirst" },
        { phrase: "Estoy cansado/a.", translation: "I'm tired.", context: "Expressing fatigue" },
        { phrase: "Necesito ayuda.", translation: "I need help.", context: "Requesting assistance" },
        { phrase: "¿Dónde está el baño?", translation: "Where is the toilet?", context: "Finding facilities" },
        { phrase: "Me siento mal.", translation: "I feel sick.", context: "Expressing illness" },
        { phrase: "¡Llama a una ambulancia!", translation: "Call an ambulance!", context: "Emergency" },
      ],
    },
  ],

  A2: [
    {
      topic: "Shopping",
      icon: "🛍️",
      phrases: [
        { phrase: "Quisiera comprar…", translation: "I'd like to buy…", context: "Making a purchase" },
        { phrase: "¿Lo tiene en otra talla?", translation: "Do you have this in a different size?", context: "Shopping for clothes" },
        { phrase: "¿Cuánto cuesta esto?", translation: "How much is this?", context: "Asking the price" },
        { phrase: "Es demasiado caro.", translation: "That's too expensive.", context: "Reacting to a high price" },
        { phrase: "¿Puedo pagar con tarjeta?", translation: "Can I pay by card?", context: "Payment method" },
        { phrase: "Me lo llevo.", translation: "I'll take it.", context: "Buying decision" },
        { phrase: "¿Tiene algo más barato?", translation: "Do you have anything cheaper?", context: "Looking for a bargain" },
        { phrase: "¿Me lo puedo probar?", translation: "Can I try it on?", context: "Fitting room request" },
      ],
    },
    {
      topic: "Directions",
      icon: "🗺️",
      phrases: [
        { phrase: "¿Dónde está el/la…?", translation: "Where is the…?", context: "Asking for location" },
        { phrase: "Gira a la izquierda / derecha.", translation: "Turn left / right.", context: "Giving directions" },
        { phrase: "Sigue recto.", translation: "Go straight ahead.", context: "Going forward" },
        { phrase: "Está al lado de / frente a…", translation: "It's next to / opposite…", context: "Describing location" },
        { phrase: "¿A qué distancia está?", translation: "How far is it?", context: "Asking distance" },
        { phrase: "Toma la segunda calle a la izquierda.", translation: "Take the second left.", context: "Specific directions" },
        { phrase: "Está a unos diez minutos a pie.", translation: "It's about ten minutes on foot.", context: "Distance and time" },
      ],
    },
    {
      topic: "Ordering Food",
      icon: "🍽️",
      phrases: [
        { phrase: "Una mesa para dos, por favor.", translation: "A table for two, please.", context: "Restaurant arrival" },
        { phrase: "¿Me puede traer la carta?", translation: "Can I see the menu?", context: "Requesting the menu" },
        { phrase: "Quisiera el pollo, por favor.", translation: "I'd like the chicken, please.", context: "Ordering food" },
        { phrase: "Soy alérgico/a a los frutos secos.", translation: "I'm allergic to nuts.", context: "Dietary restrictions" },
        { phrase: "La cuenta, por favor.", translation: "The bill, please.", context: "Asking for the check" },
        { phrase: "¡Estaba delicioso!", translation: "It was delicious!", context: "Complimenting food" },
        { phrase: "Quisiera un vaso de agua.", translation: "I'd like a glass of water.", context: "Ordering drinks" },
        { phrase: "¿Está incluido el servicio?", translation: "Is service included?", context: "Asking about tip" },
      ],
    },
    {
      topic: "Transport",
      icon: "🚌",
      phrases: [
        { phrase: "¿Qué autobús va al centro?", translation: "Which bus goes to the centre?", context: "Using public transport" },
        { phrase: "Un boleto de ida / ida y vuelta a…, por favor.", translation: "A single / return ticket to…, please.", context: "Buying a ticket" },
        { phrase: "¿Cuándo sale el próximo tren?", translation: "When does the next train leave?", context: "Train departure" },
        { phrase: "¿Dónde tengo que bajar?", translation: "Where do I get off?", context: "Bus or train travel" },
        { phrase: "¿Está ocupado este asiento?", translation: "Is this seat taken?", context: "Asking about a seat" },
        { phrase: "¿Cuánto dura el viaje?", translation: "How long does the journey take?", context: "Journey duration" },
      ],
    },
    {
      topic: "Describing People & Places",
      icon: "🏙️",
      phrases: [
        { phrase: "Ella tiene el pelo largo y castaño.", translation: "She has long brown hair.", context: "Physical description" },
        { phrase: "Él es alto y delgado.", translation: "He is tall and slim.", context: "Physical description" },
        { phrase: "La ciudad es muy animada.", translation: "The city is very busy.", context: "Describing a place" },
        { phrase: "Es un pueblo bonito y tranquilo.", translation: "It's a beautiful, quiet town.", context: "Describing a town" },
        { phrase: "Ella lleva una chaqueta roja.", translation: "She is wearing a red jacket.", context: "Describing clothing" },
        { phrase: "Mi departamento es pequeño pero cómodo.", translation: "My apartment is small but comfortable.", context: "Describing your home" },
      ],
    },
    {
      topic: "Weather",
      icon: "🌤️",
      phrases: [
        { phrase: "¿Qué tiempo hace hoy?", translation: "What's the weather like today?", context: "Asking about weather" },
        { phrase: "Hace sol / está nublado / hace viento.", translation: "It's sunny / cloudy / windy.", context: "Describing weather" },
        { phrase: "Está lloviendo / nevando.", translation: "It's raining / snowing.", context: "Current weather" },
        { phrase: "¿Qué tiempo hará mañana?", translation: "What will the weather be like tomorrow?", context: "Future weather" },
        { phrase: "¡Hace un frío helador!", translation: "It's freezing!", context: "Very cold weather" },
        { phrase: "Lleva un paraguas — puede que llueva.", translation: "Take an umbrella — it might rain.", context: "Weather advice" },
      ],
    },
  ],

  B1: [], // Phase 2 — out of scope for this plan
  B2: [], // Phase 2 — out of scope for this plan
  C1: [], // Phase 2 — out of scope for this plan
  C2: [], // Phase 2 — out of scope for this plan
};
```

- [ ] **Step 2: Validate**

Run: `grep -c "phrase:" src/data/es/phrases.ts` — should be 47 (10+8+8+6+6+7=45 for A1... count precisely against the file; the exact number isn't load-bearing, just confirm A1 total and A2 total each land in the 40–50 range, matching `data/en/phrases.ts`'s own per-level total).
Run: `grep -n "vosotro\|vuestro" src/data/es/phrases.ts` — expected: no matches.

- [ ] **Step 3: Type-check**

Run: `npm run build` (same caveat — pre-existing broken imports elsewhere expected until Task 7).

- [ ] **Step 4: Commit**

```bash
git add src/data/es/phrases.ts
git commit -m "feat(data): add Spanish A1/A2 essential phrases (same topics as EN for UI parity)"
```

---

## Task 7: Content registry + wire up all consumers

**Files:**
- Create: `src/data/index.ts`
- Modify: `src/pages/Dashboard.tsx`, `src/components/sections/Vocabulary.tsx`, `src/components/sections/Grammar.tsx`, `src/components/sections/Phrases.tsx`, `src/components/sections/Pronunciation.tsx`, `src/lib/progress.ts`

**Interfaces:**
- Consumes: `VOCABULARY`/`GRAMMAR`/`PHRASES` from `data/en/*` and `data/es/*` (Tasks 2, 4, 5, 6); `LanguageCode` from `data/languages` (Task 3).
- Produces: `CONTENT: Record<LanguageCode, LanguageContent>` — the only way any component should read vocabulary/grammar/phrases from here on.

This task is what makes the app compile again after Task 2 broke the old imports.

- [ ] **Step 1: Create `src/data/index.ts`**

```typescript
// src/data/index.ts
import { VOCABULARY as EN_VOCABULARY } from "./en/vocabulary";
import { GRAMMAR as EN_GRAMMAR } from "./en/grammar";
import { PHRASES as EN_PHRASES } from "./en/phrases";
import { VOCABULARY as ES_VOCABULARY } from "./es/vocabulary";
import { GRAMMAR as ES_GRAMMAR } from "./es/grammar";
import { PHRASES as ES_PHRASES } from "./es/phrases";
import type { CEFRLevel, VocabWord, GrammarRule, Phrase, PhraseTopic } from "./types";
import type { LanguageCode } from "./languages";

export interface LanguageContent {
  vocabulary: Record<CEFRLevel, VocabWord[]>;
  grammar: Record<CEFRLevel, GrammarRule[]>;
  phrases: Record<CEFRLevel, PhraseTopic[]>;
}

export const CONTENT: Record<LanguageCode, LanguageContent> = {
  en: { vocabulary: EN_VOCABULARY, grammar: EN_GRAMMAR, phrases: EN_PHRASES },
  es: { vocabulary: ES_VOCABULARY, grammar: ES_GRAMMAR, phrases: ES_PHRASES },
};

export type { CEFRLevel, VocabWord, GrammarRule, Phrase, PhraseTopic } from "./types";
export type { LanguageCode, LanguageConfig } from "./languages";
export { LANGUAGES, DEFAULT_LANGUAGE } from "./languages";
```

- [ ] **Step 2: Update `src/pages/Dashboard.tsx`**

Replace:
```typescript
import type { CEFRLevel } from "@/data/vocabulary";
import { VOCABULARY } from "@/data/vocabulary";
import { GRAMMAR } from "@/data/grammar";
import { PHRASES } from "@/data/phrases";
```
with:
```typescript
import type { CEFRLevel } from "@/data";
import { CONTENT } from "@/data";
import { useLanguage } from "@/contexts/LanguageContext";
```

In `LevelStatsBar` (`src/pages/Dashboard.tsx:61-102`), add `const { language } = useLanguage();` at the top of the function, and replace:
```typescript
const totalVocab   = VOCABULARY[level].length;
const totalGrammar = GRAMMAR[level].length;
const totalPhrases = PHRASES[level].flatMap((t) => t.phrases).length;
```
with:
```typescript
const content = CONTENT[language];
const totalVocab   = content.vocabulary[level].length;
const totalGrammar = content.grammar[level].length;
const totalPhrases = content.phrases[level].flatMap((t) => t.phrases).length;
```

Add `language` to the `useEffect` dependency array in `LevelStatsBar` (currently `[level]` at line 72) → `[level, language]`.

No other Dashboard.tsx changes are needed in this task — the language selector UI itself is Task 9.

- [ ] **Step 3: Update `src/components/sections/Vocabulary.tsx`**

Replace:
```typescript
import { VOCABULARY, type CEFRLevel, type VocabWord } from "@/data/vocabulary";
```
with:
```typescript
import { CONTENT, type CEFRLevel, type VocabWord } from "@/data";
import { useLanguage } from "@/contexts/LanguageContext";
```

In `export default function Vocabulary({ level }: VocabularyProps)`, add `const { language } = useLanguage();` and replace `const words = VOCABULARY[level];` with `const words = CONTENT[language].vocabulary[level];`.

Update the `useEffect` at line 233 from `[level]` to `[level, language]`.

Add an empty-state guard right before the word grid (after the filter tabs, replacing the existing `{filtered.length === 0 ? (...) : (...)}` block) so phase-1-empty Spanish B1–C2 doesn't render a bare page:
```tsx
{words.length === 0 ? (
  <p className="text-sm font-mono text-zinc-400 py-8 text-center">
    Content for this level is coming soon.
  </p>
) : filtered.length === 0 ? (
  <p className="text-sm font-mono text-zinc-400 py-8 text-center">No words in this filter.</p>
) : (
  // ... existing grid ...
)}
```

- [ ] **Step 4: Update `src/components/sections/Grammar.tsx`**

Replace:
```typescript
import { GRAMMAR, type CEFRLevel } from "@/data/grammar";
```
with:
```typescript
import { CONTENT, type CEFRLevel } from "@/data";
import { useLanguage } from "@/contexts/LanguageContext";
```

In `export default function Grammar({ level }: GrammarProps)`, add `const { language } = useLanguage();`, replace `const rules = GRAMMAR[level];` with `const rules = CONTENT[language].grammar[level];`, and update the `useEffect` at line 110 from `[level]` to `[level, language]`.

Fix the NaN bug this surfaces (rules.length can now legitimately be 0 for unpopulated es levels) — replace:
```typescript
const pct = Math.round((completed.length / rules.length) * 100);
```
with:
```typescript
const pct = rules.length > 0 ? Math.round((completed.length / rules.length) * 100) : 0;
```

Add an empty-state guard around the rules list (replacing the unconditional `<div className="space-y-2">{rules.map(...)}</div>` block):
```tsx
{rules.length === 0 ? (
  <p className="text-sm font-mono text-zinc-400 py-8 text-center">
    Content for this level is coming soon.
  </p>
) : (
  <div className="space-y-2">
    {rules.map((rule, i) => (
      <RuleCard key={i} rule={rule} index={i} completed={completed.includes(i)} onToggle={() => toggle(i)} />
    ))}
  </div>
)}
```

- [ ] **Step 5: Update `src/components/sections/Phrases.tsx`**

Replace:
```typescript
import { PHRASES, type CEFRLevel, type Phrase } from "@/data/phrases";
```
with:
```typescript
import { CONTENT, type CEFRLevel, type Phrase } from "@/data";
import { useLanguage } from "@/contexts/LanguageContext";
```

In `export default function Phrases({ level }: PhrasesProps)`, add `const { language } = useLanguage();` and replace `const topics = PHRASES[level];` with `const topics = CONTENT[language].phrases[level];`. Update both `PHRASES[level]` references inside the `useEffect` (line 65-73) to `CONTENT[language].phrases[level]`, and add `language` to that effect's dependency array (currently `[level]`).

Fix the same NaN bug — replace:
```typescript
const pct = Math.round((learnedCount / allPhrases.length) * 100);
```
with:
```typescript
const pct = allPhrases.length > 0 ? Math.round((learnedCount / allPhrases.length) * 100) : 0;
```

Add an empty-state guard: if `topics.length === 0`, render `<p className="text-sm font-mono text-zinc-400 py-8 text-center">Content for this level is coming soon.</p>` instead of the topic tabs + phrase list block.

- [ ] **Step 6: Update `src/lib/progress.ts` import**

Replace:
```typescript
import type { CEFRLevel } from "@/data/vocabulary";
```
with:
```typescript
import type { CEFRLevel } from "@/data";
```

(The rest of `progress.ts`'s language-awareness is Task 10 — this step only fixes the now-broken import path.)

- [ ] **Step 7: Type-check and manual smoke test**

Run: `npm run build` — expected to succeed (this is the first point since Task 2 where the whole app compiles again).

Run: `npm run dev`, open the app, log in, and confirm: Vocabulary/Grammar/Phrases/Pronunciation sections still render English content exactly as before (nothing user-visible should have changed yet — `useLanguage()` doesn't exist as a real provider until Task 8, so this step temporarily needs a no-op stub; see note below).

**Note on sequencing:** `useLanguage()` is introduced in Task 8. If executing tasks strictly in order, Task 7's edits reference a hook that doesn't exist yet. Two options: (a) do Task 8 first, then Task 7 (swap the order in execution, keeping this plan's numbering as documentation-only), or (b) within Task 7, stub `useLanguage` as a temporary local hook returning `{ language: "en" as const }` in each of the four files, then remove the stub in Task 8 once the real context lands. **Recommended: reorder execution to do Task 8 before Task 7** — the dependency runs that direction, not the other way.

- [ ] **Step 8: Commit**

```bash
git add src/data/index.ts src/pages/Dashboard.tsx src/components/sections/Vocabulary.tsx src/components/sections/Grammar.tsx src/components/sections/Phrases.tsx src/lib/progress.ts
git commit -m "refactor: read vocabulary/grammar/phrases through CONTENT[language] registry"
```

---

## Task 8: Language store + context

**Files:**
- Create: `src/lib/languageStore.ts`, `src/contexts/LanguageContext.tsx`
- Modify: `src/contexts/AuthContext.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `authStore` (`src/lib/authStore.ts`, existing), `LanguageCode`/`LANGUAGES`/`DEFAULT_LANGUAGE` from `@/data/languages` (Task 3).
- Produces: `languageStore` (plain module, mirrors `authStore`'s shape: `getState()`, `subscribe()`), `LanguageProvider`/`useLanguage()` (React context exposing `{ language, config, setLanguage }`).

**Run this task before Task 7** (see the sequencing note in Task 7, Step 7) — Task 7's component edits call `useLanguage()`, which this task defines.

- [ ] **Step 1: Create `src/lib/languageStore.ts`**

```typescript
// src/lib/languageStore.ts — framework-agnostic active-learning-language store.
//
// Mirrors authStore.ts's plain-module pattern so progress.ts/api.ts can read
// the current language synchronously without depending on React.

import type { LanguageCode } from "@/data/languages";
import { DEFAULT_LANGUAGE } from "@/data/languages";
import { authStore } from "@/lib/authStore";

function storageKey(): string {
  const userId = authStore.getState().user?.id ?? "anon";
  return `learning-lang:${userId}`;
}

function readInitialLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw === "en" || raw === "es") return raw;
  } catch {}
  return DEFAULT_LANGUAGE;
}

let language: LanguageCode = readInitialLanguage();
type Listener = (language: LanguageCode) => void;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener(language);
}

export const languageStore = {
  getState(): LanguageCode {
    return language;
  },

  setLanguage(next: LanguageCode) {
    language = next;
    try {
      localStorage.setItem(storageKey(), next);
    } catch {}
    notify();
  },

  // Re-reads the stored preference for whichever user is now logged in.
  // Must be called right after login/register/logout, since storageKey()
  // depends on authStore's current user and this module's `language`
  // variable is otherwise only set once, at initial page load.
  reload() {
    language = readInitialLanguage();
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
```

- [ ] **Step 2: Create `src/contexts/LanguageContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { languageStore } from "@/lib/languageStore";
import { LANGUAGES, type LanguageCode, type LanguageConfig } from "@/data/languages";

interface LanguageContextValue {
  language: LanguageCode;
  config: LanguageConfig;
  setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(languageStore.getState());

  useEffect(() => languageStore.subscribe(setLanguageState), []);

  return (
    <LanguageContext.Provider
      value={{ language, config: LANGUAGES[language], setLanguage: languageStore.setLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
```

- [ ] **Step 3: Wire `languageStore.reload()` into `src/contexts/AuthContext.tsx`**

Import at the top:
```typescript
import { languageStore } from "@/lib/languageStore";
```

In `login` (`src/contexts/AuthContext.tsx:33-36`), after `authStore.setSession(res.user, res.token);` add `languageStore.reload();`:
```typescript
const login = useCallback(async (email: string, password: string) => {
  const res = await loginUser(email, password);
  authStore.setSession(res.user, res.token);
  languageStore.reload();
  await loadFromServer();
}, []);
```

Do the same in `register` (`src/contexts/AuthContext.tsx:38-41`):
```typescript
const register = useCallback(async (email: string, password: string, inviteCode: string) => {
  const res = await registerUser(email, password, inviteCode);
  authStore.setSession(res.user, res.token);
  languageStore.reload();
  await loadFromServer();
}, []);
```

And in `logout` (`src/contexts/AuthContext.tsx:43-45`):
```typescript
const logout = useCallback(() => {
  authStore.clearSession();
  languageStore.reload();
}, []);
```

- [ ] **Step 4: Mount `LanguageProvider` in `src/App.tsx`**

Import:
```typescript
import { LanguageProvider } from "@/contexts/LanguageContext";
```

Wrap the Dashboard route element (`src/App.tsx:31-38`):
```tsx
<Route
  path="/app"
  element={
    <RequireAuth>
      <LanguageProvider>
        <Dashboard />
      </LanguageProvider>
    </RequireAuth>
  }
/>
```

- [ ] **Step 5: Type-check**

Run: `npm run build` — expected to succeed once combined with Task 7's edits (do Task 7 immediately after this task, per the sequencing note).

- [ ] **Step 6: Commit**

```bash
git add src/lib/languageStore.ts src/contexts/LanguageContext.tsx src/contexts/AuthContext.tsx src/App.tsx
git commit -m "feat(lang): add language store + context, persisted per-user in localStorage"
```

---

## Task 9: Language selector UI in the Dashboard sidebar

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `useLanguage()` (Task 8), `LANGUAGES` from `@/data` (re-exported in Task 7's `data/index.ts`).

- [ ] **Step 1: Add the selector to `SidebarContent`**

In `src/pages/Dashboard.tsx`, add the import (if not already present from Task 7):
```typescript
import { LANGUAGES } from "@/data";
import { useLanguage } from "@/contexts/LanguageContext";
```

Insert a new block at the top of `SidebarContent` (`src/pages/Dashboard.tsx:115-181`), immediately before the existing "CEFR Level selector" block:

```tsx
function SidebarContent({ activeLevel, setActiveLevel, activeSection, setActiveSection, currentLevel, onNavigate }: SidebarContentProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <>
      {/* Learning language selector */}
      <div className="p-4 border-b border-zinc-200">
        <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">
          Learning Language
        </p>
        <div className="grid grid-cols-2 gap-1">
          {Object.values(LANGUAGES).map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center justify-center gap-1.5 py-1.5 font-mono text-xs font-bold border transition-all ${
                language === lang.code
                  ? "bg-zinc-900 text-white border-transparent"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <span>{lang.flag}</span> {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* CEFR Level selector */}
      <div className="p-4 border-b border-zinc-200">
        {/* ... existing content, unchanged ... */}
      </div>
      {/* ... rest of existing SidebarContent, unchanged ... */}
    </>
  );
}
```

- [ ] **Step 2: Type-check and manual test**

Run: `npm run build`.

Run: `npm run dev`, log in, open the sidebar (desktop and the mobile drawer via the hamburger menu) — confirm both "🇬🇧 English" and "🇪🇸 Español" buttons appear above the CEFR level grid, clicking toggles the active state, and the CEFR level selection is untouched by clicking the language buttons (click A2, then switch language, then confirm the level pill in the header still reads A2).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(ui): add learning-language selector to the dashboard sidebar"
```

---

## Task 10: Language-aware progress tracking

**Files:**
- Modify: `src/lib/progress.ts`

**Interfaces:**
- Consumes: `languageStore` (Task 8).
- Public API of `progress.*` (`markVocabLearned`, `unmarkVocabLearned`, `markGrammarCompleted`, `toggleGrammarCompleted`, `markPhraseLearned`, `togglePhraseLearned`, `addWordSearched`, `getLevelStats`, `reset`, `load`) keeps its exact existing signatures — language is resolved internally, not passed as an argument, matching how `userId` is already resolved internally from `authStore`.

The backend (`english-learning-app/routes/progress.js`) already accepts a `language` field on every mutation and a `?language=` query param on GET/DELETE, defaulting to `"en"` for backward compatibility — confirmed by reading the route source. **No backend changes are required.**

- [ ] **Step 1: Update the localStorage key**

Replace:
```typescript
function storageKey(): string {
  const userId = authStore.getState().user?.id ?? "anon";
  return `progress:${userId}`;
}
```
with:
```typescript
import { languageStore } from "@/lib/languageStore";

function storageKey(): string {
  const userId = authStore.getState().user?.id ?? "anon";
  const language = languageStore.getState();
  return `progress:${userId}:${language}`;
}
```

- [ ] **Step 2: Send `language` on every sync call**

Replace the three sync helpers:
```typescript
async function syncVocab(method: "POST" | "DELETE", level: CEFRLevel, term: string): Promise<void> {
  try {
    await progressRequest("/vocab", { method, body: JSON.stringify({ level, term, language: languageStore.getState() }) });
  } catch {}
}

async function syncGrammar(method: "POST" | "DELETE", level: CEFRLevel, idx: number): Promise<void> {
  try {
    await progressRequest("/grammar", { method, body: JSON.stringify({ level, idx, language: languageStore.getState() }) });
  } catch {}
}

async function syncPhrase(method: "POST" | "DELETE", level: CEFRLevel, phrase: string): Promise<void> {
  try {
    await progressRequest("/phrase", { method, body: JSON.stringify({ level, phrase, language: languageStore.getState() }) });
  } catch {}
}
```

- [ ] **Step 3: Scope `loadFromServer()` to the active language**

Replace:
```typescript
const json = await progressRequest<{
  success: boolean;
  data?: {
    vocabulary: Partial<Record<CEFRLevel, string[]>>;
    grammar: Partial<Record<CEFRLevel, number[]>>;
    phrases: Partial<Record<CEFRLevel, string[]>>;
  };
}>("");
```
with:
```typescript
const json = await progressRequest<{
  success: boolean;
  data?: {
    vocabulary: Partial<Record<CEFRLevel, string[]>>;
    grammar: Partial<Record<CEFRLevel, number[]>>;
    phrases: Partial<Record<CEFRLevel, string[]>>;
  };
}>(`?language=${languageStore.getState()}`);
```

- [ ] **Step 4: Scope `reset()` to the active language**

Replace:
```typescript
reset(level?: CEFRLevel) {
  if (level) {
    const data = load();
    data[level] = { vocabularyLearned: [], grammarCompleted: [], phrasesLearned: [], wordsSearched: [] };
    save(data);
    progressRequest(`/reset/${level}`, { method: "DELETE" }).catch(() => {});
  } else {
    localStorage.removeItem(storageKey());
    progressRequest("/reset", { method: "DELETE" }).catch(() => {});
  }
},
```
with:
```typescript
reset(level?: CEFRLevel) {
  const language = languageStore.getState();
  if (level) {
    const data = load();
    data[level] = { vocabularyLearned: [], grammarCompleted: [], phrasesLearned: [], wordsSearched: [] };
    save(data);
    progressRequest(`/reset/${level}?language=${language}`, { method: "DELETE" }).catch(() => {});
  } else {
    localStorage.removeItem(storageKey());
    progressRequest(`/reset?language=${language}`, { method: "DELETE" }).catch(() => {});
  }
},
```

- [ ] **Step 5: Also call `loadFromServer()` on language switch**

`Dashboard.tsx` only calls `loadFromServer()` once, on mount (`src/pages/Dashboard.tsx:189-191`). Since switching language should pull that language's authoritative server progress into its (now-different) localStorage bucket, update:
```typescript
useEffect(() => {
  loadFromServer().catch(() => {});
}, []);
```
to:
```typescript
const { language } = useLanguage(); // if not already destructured earlier in Dashboard for other reasons
// ...
useEffect(() => {
  loadFromServer().catch(() => {});
}, [language]);
```

(`useLanguage()` is already imported in `Dashboard.tsx` per Task 9 — just add `language` to this existing effect's dependency array and reuse the same destructured value.)

- [ ] **Step 6: Manual verification (this is the spec's point 7 checkpoint for progress isolation)**

Run: `npm run dev`, log in.
1. Open DevTools → Application → Local Storage. Confirm keys look like `progress:<userId>:en`.
2. In the Vocabulary section (English active), mark 2-3 words as learned.
3. Switch language to Español via the sidebar selector.
4. Confirm the Vocabulary section now shows 0 learned (a fresh `progress:<userId>:es` bucket) — mark 1-2 Spanish words learned.
5. Switch back to English — confirm the original 2-3 English words are still marked learned, untouched.
6. Open DevTools → Network, filter on `/api/progress`, mark another word learned in either language, and confirm the request body includes `"language":"en"` or `"language":"es"` matching the active selector.

- [ ] **Step 7: Commit**

```bash
git add src/lib/progress.ts src/pages/Dashboard.tsx
git commit -m "feat(progress): namespace localStorage and backend sync by active language"
```

---

## Task 11: Spanish pronunciation via browser SpeechSynthesis

**Files:**
- Create: `src/lib/speech.ts`
- Modify: `src/components/sections/Pronunciation.tsx`

**Interfaces:**
- Produces (`speech.ts`): `speak(text: string, lang: string): Promise<void>`, `stopSpeaking(): void`, `getSpanishVoice(): Promise<SpeechSynthesisVoice | null>`, `hasSpanishVoice(): Promise<boolean>`, `isSpeechSynthesisSupported(): boolean`.
- Consumes: `useLanguage()` (Task 8) for `config.hasAudioApi` / `config.speechLocale` / `config.hasIPA`. Also `Tooltip`/`TooltipTrigger`/`TooltipContent`/`TooltipProvider` from `@/components/ui/tooltip` (already in the repo, currently unused anywhere — this is its first consumer).

**Voice selection is the tricky part of this task** — `speechSynthesis.getVoices()` returns `[]` synchronously on the first call in Chromium browsers; the real voice list only arrives later via the `voiceschanged` event. Some engines (older Firefox/Safari) never fire that event at all, so a pure event-wait can hang forever — a timeout fallback is required. Once voices are loaded, prefer regional Latin American/neutral tags over `es-ES`, and accept any other `es-*` voice as a last resort, per the confirmed ranking `es-MX`/`es-419`/`es-US` > `es-ES` > any `es-*`.

- [ ] **Step 1: Create `src/lib/speech.ts`**

```typescript
// src/lib/speech.ts — browser SpeechSynthesis wrapper for languages without a
// backend audio API (Spanish, phase 1).

const SPANISH_VOICE_PRIORITY = ["es-mx", "es-419", "es-us"];

let cachedVoices: SpeechSynthesisVoice[] | null = null;
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

// getVoices() returns [] synchronously on first call in Chrome — the real
// list arrives async via 'voiceschanged'. Some engines never fire that
// event, so a short timeout guards against hanging forever with no voices.
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }
  if (cachedVoices) return Promise.resolve(cachedVoices);
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      cachedVoices = existing;
      resolve(existing);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      cachedVoices = synth.getVoices();
      resolve(cachedVoices);
    }, 1000);

    function onVoicesChanged() {
      const voices = synth.getVoices();
      if (voices.length > 0) {
        window.clearTimeout(timeoutId);
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        cachedVoices = voices;
        resolve(voices);
      }
    }
    synth.addEventListener("voiceschanged", onVoicesChanged);
  });

  return voicesPromise;
}

function pickSpanishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const esVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  if (esVoices.length === 0) return null;

  for (const preferred of SPANISH_VOICE_PRIORITY) {
    const match = esVoices.find((v) => v.lang.toLowerCase() === preferred);
    if (match) return match;
  }
  const esES = esVoices.find((v) => v.lang.toLowerCase() === "es-es");
  if (esES) return esES;

  return esVoices[0]; // any other es-* (e.g. es-AR, es-CO) beats no voice at all
}

export async function getSpanishVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = await loadVoices();
  return pickSpanishVoice(voices);
}

export async function hasSpanishVoice(): Promise<boolean> {
  return (await getSpanishVoice()) !== null;
}

export async function speak(text: string, lang: string): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  const voices = await loadVoices();
  const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
  const voice = exact ?? pickSpanishVoice(voices);
  if (voice) utterance.voice = voice;

  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
```

- [ ] **Step 2: Rewrite the audio dispatch in `Pronunciation.tsx`**

Add imports:
```typescript
import { useLanguage } from "@/contexts/LanguageContext";
import { speak, stopSpeaking, isSpeechSynthesisSupported, hasSpanishVoice } from "@/lib/speech";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
```

Add `const { config } = useLanguage();` at the top of `export default function Pronunciation({ level }: PronunciationProps)`, and use `CONTENT[language].vocabulary[level]` per Task 7 (this file wasn't touched in Task 7 — do that import swap here too: replace `import { VOCABULARY, type CEFRLevel, type VocabWord } from "@/data/vocabulary";` with `import { CONTENT, type CEFRLevel, type VocabWord } from "@/data";` and `const { language, config } = useLanguage();`, `const words = CONTENT[language].vocabulary[level];`).

Add state that tracks whether audio is available at all for the active language (`null` while checking, so the button isn't flashed disabled-then-enabled on every mount):
```typescript
const [audioAvailable, setAudioAvailable] = useState<boolean | null>(null);

useEffect(() => {
  if (config.hasAudioApi) {
    setAudioAvailable(true); // English: MW API, unrelated to SpeechSynthesis support
    return;
  }
  if (!isSpeechSynthesisSupported()) {
    setAudioAvailable(false);
    return;
  }
  let cancelled = false;
  hasSpanishVoice().then((available) => {
    if (!cancelled) setAudioAvailable(available);
  });
  return () => { cancelled = true; };
}, [config.hasAudioApi]);
```

Replace `fetchAudio` (`src/components/sections/Pronunciation.tsx:110-118`) and `playWord` (`120-141`) with a single language-aware `playWord`:

```typescript
const playWord = useCallback(async (term: string, index: number) => {
  if (audioAvailable === false) return; // degraded state — button should already be disabled
  setPlayingIndex(index);

  if (!config.hasAudioApi) {
    // Spanish (phase 1): browser SpeechSynthesis, no fetch, no caching needed.
    setAudioStates((s) => ({ ...s, [term]: "ready" }));
    await speak(term, config.speechLocale);
    setPlayingIndex(null);
    return;
  }

  // English: fetch MW audio URL (cached), then play via <audio>.
  const url = await fetchAudio(term);
  if (!url) {
    setPlayingIndex(null);
    return;
  }
  if (audioRef.current) audioRef.current.pause();
  return new Promise<void>((resolve) => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { setPlayingIndex(null); resolve(); };
    audio.onerror = () => { setPlayingIndex(null); resolve(); };
    audio.play().catch(() => { setPlayingIndex(null); resolve(); });
  });
}, [config, fetchAudio, audioAvailable]);
```

Keep the existing `fetchAudio` function (`Pronunciation.tsx:110-118`) as-is — it's only called from the `config.hasAudioApi` branch above.

Update `stopAll` (`src/components/sections/Pronunciation.tsx:166-171`) to also stop speech synthesis:
```typescript
const stopAll = () => {
  stopRef.current = true;
  if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  stopSpeaking();
  setIsPlayingAll(false);
  setPlayingIndex(null);
};
```

- [ ] **Step 3: Disable the play button with a tooltip when no Spanish voice is available**

The app must stay 100% functional without audio — this is a degradation, not an error state. Wrap each play button (and the "Play All" control) so it disables cleanly with an explanatory tooltip when `audioAvailable === false`. Radix's `TooltipTrigger` needs a focusable/hoverable child even when the inner `<button>` is `disabled` (native `disabled` buttons suppress pointer events, which would silently kill the tooltip too), so wrap the button in a `<span>`:

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <span tabIndex={audioAvailable === false ? 0 : undefined}>
        <button
          onClick={() => playWord(word.term, index)}
          disabled={audioAvailable === false || audioState === "loading"}
          className={cn(
            "...", // existing classes
            audioAvailable === false && "opacity-40 cursor-not-allowed"
          )}
        >
          {audioState === "loading" ? <Loader2 size={13} className="animate-spin" /> : <Volume2 size={13} />}
        </button>
      </span>
    </TooltipTrigger>
    {audioAvailable === false && (
      <TooltipContent>Audio no disponible en este dispositivo</TooltipContent>
    )}
  </Tooltip>
</TooltipProvider>
```

Apply the same `disabled={audioAvailable === false}` guard to the "Play All" button. A single `TooltipProvider` at the top of the component (or already present higher in the tree — check `App.tsx`/`Dashboard.tsx` first to avoid nesting redundant providers) is enough to wrap all per-word tooltips.

- [ ] **Step 4: Hide IPA-specific copy when `!config.hasIPA`**

Replace the column header (`src/components/sections/Pronunciation.tsx:245`):
```tsx
<span className="flex-1 font-mono text-xs text-zinc-400 uppercase tracking-wide">Word / IPA</span>
```
with:
```tsx
<span className="flex-1 font-mono text-xs text-zinc-400 uppercase tracking-wide">
  {config.hasIPA ? "Word / IPA" : "Word"}
</span>
```

(`{word.phonetic && (...)}` at line 55 already no-ops correctly once `es` vocabulary entries simply omit `phonetic` — no change needed there.)

- [ ] **Step 5: Add the empty-state guard (phase-1 Spanish B1–C2)**

Around the word list, guard on `words.length === 0` the same way as Task 7's Vocabulary/Grammar/Phrases changes.

- [ ] **Step 6: Manual test — with and without Spanish voices**

Run: `npm run dev`, switch to Español, open Pronunciation for A1, click ▶ on a word — confirm the browser speaks the Spanish word aloud using the best available `es-*` voice (check `speechSynthesis.getVoices()` in the console to see which voice actually got picked). Confirm "Play All" and "Stop" both work. Switch back to English and confirm MW audio playback is unaffected.

Then simulate the no-voice case to verify graceful degradation: in DevTools console, before opening Pronunciation, run
```js
Object.defineProperty(window.speechSynthesis, 'getVoices', { value: () => [] });
```
(and if testing the `voiceschanged` path specifically, also dispatch `window.speechSynthesis.dispatchEvent(new Event('voiceschanged'))` after stubbing `getVoices` to return `[]` — confirms the promise still resolves via the timeout fallback rather than hanging). Reload isn't needed since the stub is live; open Pronunciation for Español and confirm: the play buttons render disabled/dimmed, hovering shows the "Audio no disponible en este dispositivo" tooltip, and every other part of the app (word list, definitions, examples, progress tracking) still works normally.

- [ ] **Step 7: Commit**

```bash
git add src/lib/speech.ts src/components/sections/Pronunciation.tsx
git commit -m "feat(pronunciation): add browser SpeechSynthesis path for Spanish audio with robust voice selection"
```

---

## Task 12: Spanish dictionary lookup (`/api/spanish/:word`)

**Files:**
- Modify: `src/types/index.ts`, `src/lib/api.ts`, `src/components/sections/DictionarySearch.tsx`

**Interfaces:**
- Produces (`types/index.ts`): `SpanishDictionaryEntry` (matches the exact shape returned by `english-learning-app/services/mwSpanishService.js`'s `normalizeEntry` + `routes/spanish.js`'s response envelope).
- Consumes: `useLanguage()` (Task 8) for `config.dictionaryPath` / `config.hasRhymes`.

Backend response shape (already confirmed by reading `english-learning-app/routes/spanish.js` and `services/mwSpanishService.js` — no backend changes needed):
```json
{
  "success": true,
  "data": {
    "word": "casa",
    "translations": ["house", "home"],
    "examples": [{ "en": "...", "es": "..." }],
    "gender": "feminine",
    "partOfSpeech": "noun",
    "audioUrl": "https://..." 
  },
  "source": "merriam-webster-spanish",
  "cached": false,
  "error": null
}
```
This is a fundamentally different shape from the English `DictionaryEntry` (no `definitions[]`/`synonyms`/`antonyms`/`idioms`). Rendering is branched by `language` — the one deliberate exception to "config not scattered ifs" called out in Global Constraints, because the two backends return structurally incompatible JSON.

- [ ] **Step 1: Add the type in `src/types/index.ts`**

Add after the existing `DictionaryEntry`/`DictionaryResponse` block:
```typescript
// ─── Spanish-English Dictionary (Merriam-Webster Spanish API) ────────────────

export interface SpanishExample {
  en: string;
  es: string;
}

export interface SpanishDictionaryEntry {
  word: string;
  translations: string[];
  examples: SpanishExample[];
  gender: "masculine" | "feminine" | null;
  partOfSpeech: string | null;
  audioUrl: string | null;
}

export interface SpanishDictionaryResponse {
  success: boolean;
  data: SpanishDictionaryEntry | null;
  source: string | null;
  cached: boolean;
  error: { code: string; message: string } | null;
}
```

- [ ] **Step 2: Update `src/components/sections/DictionarySearch.tsx` to use `config.dictionaryPath`**

Add imports:
```typescript
import { useLanguage } from "@/contexts/LanguageContext";
import type { SpanishDictionaryEntry, SpanishDictionaryResponse } from "@/types";
```

Add `const { language, config } = useLanguage();` inside `export default function DictionarySearch()`.

Add a second state slot alongside the existing `entry`/`source`/`cached`:
```typescript
const [spanishEntry, setSpanishEntry] = useState<SpanishDictionaryEntry | null>(null);
```

In `searchWithMeta`, replace the hardcoded path:
```typescript
const resp = await fetch(
  `${PROXY_BASE}/dictionary/${encodeURIComponent(trimmed.toLowerCase())}`,
  { signal: controller.signal, headers: { Accept: "application/json" } }
);
```
with:
```typescript
const resp = await fetch(
  `${PROXY_BASE}${config.dictionaryPath(trimmed)}`,
  { signal: controller.signal, headers: { Accept: "application/json" } }
);
```

Immediately after parsing `json`, branch on `language` to populate the right state slot and to gate the Datamuse-extras fetch behind `config.hasRhymes`:
```typescript
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
    setExtraLoading(true);
    const [rhymes, similar, adjectives] = await Promise.all([
      getWordRhymes(trimmed), getWordSimilar(trimmed), getWordAdjectives(trimmed),
    ]);
    setExtra({ rhymes, similar, adjectives });
    setExtraLoading(false);
  } else {
    setExtra(null);
  }
}
```

Also reset `spanishEntry` to `null` wherever `entry` is currently reset to `null` at the start of `searchWithMeta` (alongside `setEntry(null); setExtra(null);`).

- [ ] **Step 3: Add a Spanish results renderer**

Add a small component above `DictionarySearch` in the same file:
```tsx
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
```

- [ ] **Step 4: Branch the results section**

Replace the `{entry && !loading && (...)}` block's opening condition and wrap with a language branch. Where the existing JSX currently reads:
```tsx
{entry && !loading && (
  <article className="space-y-5">
    {/* ... existing English rendering ... */}
  </article>
)}
```
change to:
```tsx
{language === "es" && spanishEntry && !loading && (
  <SpanishResult entry={spanishEntry} onPlayAudio={playAudio} />
)}

{language === "en" && entry && !loading && (
  <article className="space-y-5">
    {/* ... existing English rendering, unchanged ... */}
  </article>
)}
```

Also update the empty/loading guards above it (`{!loading && !error && !entry && (...)}`) to account for the new state slot: `{!loading && !error && !entry && !spanishEntry && (...)}`.

Wrap the existing "Word Explorer · Datamuse" block (`src/components/sections/DictionarySearch.tsx:473-505`) — which is inside the English `<article>` already, so it's already gated to `language === "en"` implicitly. No separate change needed there, but double check it doesn't render when `spanishEntry` is set instead.

- [ ] **Step 5: Type-check and manual test**

Run: `npm run build`.

Run: `npm run dev`, switch to Español, go to Dictionary, search a common word (e.g. "casa" or "perro"). Confirm: gender badge shows, translations chips show, bilingual examples show, no "Word Explorer · Datamuse" section appears, audio button works if `audioUrl` is present (requires `MW_SPANISH_KEY` configured in the backend env — if not configured, expect the existing 503 "MW_KEY_MISSING" error surfaced via `setError`, which is correct/expected backend-config behavior, not a client bug).

Switch back to English and confirm the dictionary still works exactly as before, including rhymes/similar/adjectives.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/components/sections/DictionarySearch.tsx
git commit -m "feat(dictionary): add Spanish lookup via /api/spanish/:word, hide Datamuse extras for es"
```

---

## Task 13: Spanish-aware grammar check in Writing

**Files:**
- Modify: `src/components/sections/Writing.tsx`

**Interfaces:**
- Consumes: `useLanguage()` (Task 8) for `config.grammarCheckLocale`.

- [ ] **Step 1: Rename the local accent-locale state to avoid clashing with the new global `language`**

Add import:
```typescript
import { useLanguage } from "@/contexts/LanguageContext";
```

Inside `export default function Writing()`, add `const { language, config } = useLanguage();` and rename the existing local state (`src/components/sections/Writing.tsx:212`):
```typescript
const [language, setLanguage] = useState("en-US");
```
to:
```typescript
const [checkLocale, setCheckLocale] = useState(config.grammarCheckLocale);
```
and update every other reference to the old `language`/`setLanguage` local names in this file (`showLang` toggle handlers, the `checkGrammar(text, language)` call, `LANG_OPTIONS.find((l) => l.code === language)`) to `checkLocale`/`setCheckLocale`.

- [ ] **Step 2: Reset the check locale when the learning language changes**

Add:
```typescript
useEffect(() => {
  setCheckLocale(config.grammarCheckLocale);
}, [config.grammarCheckLocale]);
```

- [ ] **Step 3: Only show the English-accent dropdown for English**

Replace the language-selector block (`src/components/sections/Writing.tsx:265-287`):
```tsx
<div className="relative">
  <button onClick={() => setShowLang((s) => !s)} ...>
    {LANG_OPTIONS.find((l) => l.code === checkLocale)?.label ?? checkLocale}
    <ChevronDown size={11} />
  </button>
  {showLang && (...)}
</div>
```
with a branch:
```tsx
{language === "en" ? (
  <div className="relative">
    <button onClick={() => setShowLang((s) => !s)} className="flex items-center gap-1.5 border border-zinc-200 bg-white px-3 py-1.5 text-xs font-mono text-zinc-600 hover:border-zinc-400 transition-colors">
      {LANG_OPTIONS.find((l) => l.code === checkLocale)?.label ?? checkLocale}
      <ChevronDown size={11} />
    </button>
    {showLang && (
      <div className="absolute top-full mt-0.5 left-0 z-20 bg-white border border-zinc-200 shadow-sm min-w-36">
        {LANG_OPTIONS.map((l) => (
          <button key={l.code} onClick={() => { setCheckLocale(l.code); setShowLang(false); }}
            className={`block w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-zinc-50 transition-colors ${checkLocale === l.code ? "text-zinc-900 font-semibold" : "text-zinc-600"}`}>
            {l.label}
          </button>
        ))}
      </div>
    )}
  </div>
) : (
  <span className="flex items-center gap-1.5 border border-zinc-200 bg-white px-3 py-1.5 text-xs font-mono text-zinc-600">
    Español
  </span>
)}
```

- [ ] **Step 4: Spanish-language placeholder and tips**

Replace the hardcoded English placeholder/tips with a language-conditional lookup. Add near the top of the file:
```typescript
const PLACEHOLDERS: Record<string, string> = {
  en: `Write anything in English…\n\nFor example:\n  "Yesterday I go to the market and buyed many thing."\n  "She have a very nice house in the mountains."`,
  es: `Escribe cualquier cosa en español…\n\nPor ejemplo:\n  "Ayer yo voy al mercado y comprí muchas cosa."\n  "Ella tiene una casa muy bonito en las montañas."`,
};

const TIPS: Record<string, string[]> = {
  en: [
    "Write a few sentences about your day",
    "Describe a place you visited",
    "Tell a short story about an experience",
    "Write your opinion on a topic",
  ],
  es: [
    "Escribe algunas frases sobre tu día",
    "Describe un lugar que visitaste",
    "Cuenta una historia corta sobre una experiencia",
    "Escribe tu opinión sobre un tema",
  ],
};
```

Replace `placeholder={...}` on the `<textarea>` (`src/components/sections/Writing.tsx:330`) with `placeholder={PLACEHOLDERS[language]}`, and replace the hardcoded tips array literal (`src/components/sections/Writing.tsx:367-372`) with `{TIPS[language].map((tip, i) => (...))}`.

- [ ] **Step 5: Update `handleCheck` to send `checkLocale`**

`handleCheck`'s dependency array and body already reference `language` (now `checkLocale`) — confirm `checkGrammar(text, checkLocale)` and `useCallback([text, checkLocale], ...)` after the rename in Step 1.

- [ ] **Step 6: Type-check and manual test**

Run: `npm run build`.

Run: `npm run dev`, switch to Español, go to Writing, confirm the placeholder/tips are in Spanish, the accent dropdown is replaced by a static "Español" badge, write a sentence with a deliberate error (e.g. "Yo tiene un gato"), click "Check my writing", and confirm LanguageTool returns Spanish-language grammar matches (requires the backend's `/api/grammar/check` to accept `language: "es"` — it already does, per `api.ts`'s existing `checkGrammar(text, language = "en-US")` signature which just forwards whatever locale string it's given to the backend).

- [ ] **Step 7: Commit**

```bash
git add src/components/sections/Writing.tsx
git commit -m "feat(writing): use Spanish grammar-check locale and copy when learning Spanish"
```

---

## Task 14: Full manual QA pass (spec checkpoint — do not skip before reporting done)

No code changes — this is the explicit verification checklist from the original request's point 7. Run `npm run dev`, log in, and walk through:

- [ ] Switching the language selector shows Spanish vocabulary/grammar/phrases content immediately (no stale English content lingering).
- [ ] Switching language does **not** change the active CEFR level (confirm by setting level to B1 first, then switching language, then confirming level pill still shows B1 — note Spanish B1 content will correctly show the "coming soon" empty state from Task 7/11, which is expected for phase 1).
- [ ] Marking vocabulary/grammar/phrases as learned in Spanish does not affect English progress and vice versa — verified via `localStorage` keys (`progress:<userId>:en` vs `progress:<userId>:es`) and via the Network tab (`language` field on each `/api/progress/*` request body/query matches the active selector).
- [ ] Spanish audio (Pronunciation section) plays via the browser's built-in voice, not a fetched MP3.
- [ ] Spanish dictionary search returns gender + translations + bilingual examples, with no "Word Explorer · Datamuse" section.
- [ ] Writing's grammar check returns Spanish-language matches when Spanish is active, and the accent dropdown is replaced by a static "Español" indicator.
- [ ] No `vosotros`/`vuestro` forms appear anywhere in Spanish content or UI copy (`grep -rn "vosotro\|vuestro" src/data/es` should be empty — already checked per-task, re-confirm here as a final gate).
- [ ] Logging out and back in (or as a different user) does not leak one user's language preference or progress into another's session.
- [ ] `npm run build` succeeds with zero TypeScript errors.

Only report the feature complete, and only push, after every box above is checked and after showing the user this checklist's results plus the dataset/license summary already delivered earlier in this conversation (per the explicit "no pushees sin mostrarme el resumen" instruction).

---

## Self-Review Notes (already applied above, recorded for the record)

- **Spec coverage:** point 1 (dataset/report) — done in the prior conversation turn, referenced in Global Constraints; point 2 (data/ restructure) — Tasks 1-2-3-4-5-6-7; point 3 (language selector, context, localStorage per-user) — Task 8-9; point 4 (progress.ts/api.ts carry language) — Task 10 (backend already ready, verified, no backend task needed); point 5 (per-language feature config: MW audio/IPA/rhymes for en, SpeechSynthesis/no-IPA/no-rhymes/`/api/spanish/:word` for es) — Task 3 (config table) + 11 (audio) + 12 (dictionary); point 6 (CEFR level global, independent of language) — verified structurally in Task 8 (level state untouched by LanguageProvider) and explicitly re-tested in Task 9 and Task 14; point 7 (full manual QA, no push before showing summary) — Task 14.
- **Placeholder scan:** none found — every task has literal file paths, literal diffs/full file contents, and literal verification commands.
- **Type consistency:** `CEFRLevel`/`VocabWord`/`GrammarRule`/`Phrase`/`PhraseTopic` are defined once in Task 1 and only ever re-exported afterward; `LanguageCode`/`LanguageConfig`/`LANGUAGES` defined once in Task 3; `CONTENT`/`LanguageContent` defined once in Task 7; `languageStore`/`useLanguage` defined once in Task 8 and consumed identically (same method names: `getState()`, `subscribe()`, `setLanguage()`) everywhere else.
- **Known ordering caveat:** Task 8 must execute before Task 7 despite the numbering, because Task 7's component edits call `useLanguage()`. Flagged explicitly in Task 7 Step 7 and repeated here.

---

## Addendum (2026-07-26): Tasks 15-16

Added per follow-up user request, appended without altering Tasks 1-14 or their execution order. Both depend on Task 8 (`languageStore`/`useLanguage`) and Task 9 (Dashboard sidebar selectors) already being in place; Task 15 also benefits from Task 3's `LANGUAGES` table existing (for consistent flag/label text) but doesn't strictly require it.

---

## Task 15: Bilingual branding — "Learn English and Spanish, all levels (A1-C2)"

**Files:**
- Modify: `index.html`, `README.md`, `src/pages/LandingPage.tsx`, `src/pages/Dashboard.tsx`

**Goal:** every place that currently states or implies "English learning" as the app's sole purpose should reflect that it teaches **both** English and Spanish. Verified via research pass — no `document.title =`/Helmet usage anywhere in `src/`, so the static `<title>` in `index.html` is the only page-title surface.

- [ ] **Step 1: `index.html`**

Replace:
```html
<title>English Learning — Free tools for every CEFR level</title>
<meta name="description" content="Learn English for free with 480+ vocabulary cards, grammar guides, pronunciation drills, a live dictionary, writing checker, and essential phrases. All CEFR levels from A1 to C2." />
```
with:
```html
<title>English &amp; Spanish Learning — Free tools for every CEFR level</title>
<meta name="description" content="Learn English and Spanish for free with vocabulary cards, grammar guides, pronunciation drills, a live dictionary, writing checker, and essential phrases. All CEFR levels from A1 to C2." />
```

- [ ] **Step 2: `README.md`** (lines 1-3)

Replace:
```markdown
# english-learning-client
Personal English learning dashboard structured around CEFR levels (A1 → C2).
```
with:
```markdown
# english-learning-client
Personal English & Spanish learning dashboard structured around CEFR levels (A1 → C2).
Aprende inglés y español — todos los niveles (A1-C2).
```

- [ ] **Step 3: `src/pages/LandingPage.tsx`**

Replace each of the following (line numbers per the pre-Task-15 file; re-locate by content if a prior task in this plan already shifted them):
- Line 161 badge text: `Free English Tools · A1 to C2` → `Free English & Spanish Tools · A1 to C2`
- Lines 164-165 `<h1>`: `Learn English at your own pace.` / `Every level, every tool, no paywall.` → `Learn English and Spanish at your own pace.` / `Aprende inglés y español — todos los niveles (A1-C2), sin costo.`
- Lines 167-169 subhead: `...structured by CEFR levels from beginner to mastery.` → `...structured by CEFR levels from beginner to mastery, for both languages.`
- Line 343 wordmark: `English` → `English + Español` (adjust surrounding classes only if the longer string breaks the layout — check visually in the dev server; this is a judgment call for whoever executes this step, not a hard requirement to match verbatim)
- Lines 345-347 footer: `A free English learning platform structured by CEFR levels. Built for self-learners who want real tools, not gamification.` → `A free English and Spanish learning platform structured by CEFR levels. Built for self-learners who want real tools, not gamification.`
- Line 376 copyright: `© 2026 English Learning. All rights reserved.` → `© 2026 English & Spanish Learning. All rights reserved.`

- [ ] **Step 4: `src/pages/Dashboard.tsx`**

Replace the file header comment (lines 2-4):
```typescript
// Dashboard.tsx — English Learning Dashboard
// Personal English learning app structured by CEFR levels (A1 → C2).
```
with:
```typescript
// Dashboard.tsx — English & Spanish Learning Dashboard
// Personal English & Spanish learning app structured by CEFR levels (A1 → C2).
```

Replace the sidebar brand link/text (lines 217-221, `English` + `Personal Learning Dashboard`) with `English + Español` (or equivalent) + `Personal Learning Dashboard` — same layout judgment call as Step 3's wordmark; keep both brand mentions consistent with whichever exact wording is chosen.

- [ ] **Step 5: Manual check**

Run `npm run dev` (and `npm run build` for the `index.html`/type-safe files). Visually confirm: browser tab title, landing page hero/badge/footer/copyright, and the dashboard sidebar brand all read as bilingual, with no leftover "English learning" phrasing implying Spanish is absent. Confirm nothing overflows/wraps awkwardly at mobile width (375px) with the longer brand strings.

- [ ] **Step 6: Commit**

```bash
git add index.html README.md src/pages/LandingPage.tsx src/pages/Dashboard.tsx
git commit -m "docs(branding): update titles, meta, landing, and dashboard copy for bilingual English+Spanish"
```

---

## Task 16: Persist language + CEFR level preferences via backend, localStorage as cache

**Files:**
- Create: `src/lib/cefrLevelStore.ts`, `src/lib/preferencesSync.ts`
- Modify: `src/types/index.ts`, `src/lib/api.ts`, `src/contexts/AuthContext.tsx`, `src/contexts/LanguageContext.tsx`, `src/pages/Dashboard.tsx`

**Important — backend research finding:** the backend (`english-learning-app/routes/auth.js`) **already implements everything requested**: `GET /api/auth/me` already returns `{ id, email, preferences }` (line 112), `PATCH /api/auth/preferences` already accepts `{ learningLanguage, cefrLevel }`, validates against the same `en`/`es` and `A1`-`C2` enums used elsewhere in this plan, and persists to a `preferences` JSON column already present on the `users` table (`db/database.js`, libSQL/Turso — not Prisma, despite this plan's earlier "Tech Stack" line; no schema migration needed, it already ran). **No backend work is required for this task** — it is 100% frontend wiring to consume endpoints that already exist. If a future audit of `english-learning-app` finds this description stale (endpoint renamed/removed), stop and reconcile before writing frontend code against it.

**Interfaces:**
- Produces (`cefrLevelStore.ts`): same shape as `languageStore.ts` (Task 8) — `getState()`, `setLevel()`, `reload()`, `subscribe()` — because CEFR level currently has **no localStorage persistence at all** (`Dashboard.tsx:185`, plain `useState<CEFRLevel>("A1")`, confirmed via research; resets on every reload today). This task introduces that local cache as well as the backend sync, since the user's phrasing ("además del localStorage actual") assumed a cache that doesn't yet exist for level — flagging this discrepancy rather than silently assuming.
- Produces (`preferencesSync.ts`): `syncPreferences(patch: { learningLanguage?: LanguageCode; cefrLevel?: CEFRLevel }): void` — fire-and-forget PATCH, mirrors the existing swallow-errors pattern in `progress.ts`'s `syncVocab`/`syncGrammar`/`syncPhrase`.
- Consumes: `authStore` (existing), `languageStore`/`useLanguage` (Task 8), `fetchMe`/`jsonRequest` pattern (existing `api.ts`).

- [ ] **Step 1: Add `preferences` to the `User` type**

In `src/types/index.ts`, add near the existing `User` interface:
```typescript
import type { LanguageCode } from "@/data/languages";
import type { CEFRLevel } from "@/data/types";

export interface UserPreferences {
  learningLanguage?: LanguageCode;
  cefrLevel?: CEFRLevel;
}

export interface User {
  id: string;
  email: string;
  preferences?: UserPreferences;
}
```

- [ ] **Step 2: Add `updatePreferences` to `api.ts`**

Below `fetchMe` (`src/lib/api.ts:253-254`):
```typescript
export const updatePreferences = (
  patch: Partial<{ learningLanguage: LanguageCode; cefrLevel: CEFRLevel }>,
  token: string
): Promise<{ preferences: UserPreferences }> =>
  jsonRequest<{ preferences: UserPreferences }>(
    "/auth/preferences",
    { method: "PATCH", body: JSON.stringify(patch) },
    token
  );
```
(Add the `LanguageCode`/`CEFRLevel`/`UserPreferences` imports at the top of `api.ts` alongside its existing `User`/`AuthResponse` imports from `@/types`.)

- [ ] **Step 3: Create `src/lib/cefrLevelStore.ts`**

Verbatim copy of `languageStore.ts`'s pattern (Task 8, Step 1), swapped for level:
```typescript
// src/lib/cefrLevelStore.ts — framework-agnostic active-CEFR-level store.
// Mirrors languageStore.ts so Dashboard.tsx can persist the level choice
// per-user in localStorage, the same way the learning language already is.

import type { CEFRLevel } from "@/data/types";
import { authStore } from "@/lib/authStore";

const DEFAULT_LEVEL: CEFRLevel = "A1";
const VALID_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function storageKey(): string {
  const userId = authStore.getState().user?.id ?? "anon";
  return `cefr-level:${userId}`;
}

function readInitialLevel(): CEFRLevel {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw && (VALID_LEVELS as string[]).includes(raw)) return raw as CEFRLevel;
  } catch {}
  return DEFAULT_LEVEL;
}

let level: CEFRLevel = readInitialLevel();
type Listener = (level: CEFRLevel) => void;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener(level);
}

export const cefrLevelStore = {
  getState(): CEFRLevel {
    return level;
  },

  setLevel(next: CEFRLevel) {
    level = next;
    try {
      localStorage.setItem(storageKey(), next);
    } catch {}
    notify();
  },

  // Re-reads the stored level for whichever user is now logged in — call
  // right after login/register/logout, mirroring languageStore.reload().
  reload() {
    level = readInitialLevel();
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
```

- [ ] **Step 4: Create `src/lib/preferencesSync.ts`**

```typescript
// src/lib/preferencesSync.ts — best-effort backend sync for language/level
// preferences. localStorage (languageStore/cefrLevelStore) remains the
// source of truth for instant UI state; this is a fire-and-forget mirror
// to the backend so preferences follow the user across devices.

import { authStore } from "@/lib/authStore";
import { updatePreferences } from "@/lib/api";
import type { LanguageCode } from "@/data/languages";
import type { CEFRLevel } from "@/data/types";

export function syncPreferences(patch: { learningLanguage?: LanguageCode; cefrLevel?: CEFRLevel }): void {
  const token = authStore.getState().token;
  if (!token) return; // not logged in — localStorage-only, nothing to sync
  updatePreferences(patch, token).catch(() => {}); // same swallow-errors pattern as progress.ts
}
```

- [ ] **Step 5: Hydrate both stores from `preferences` on session validation, login, and register**

In `src/contexts/AuthContext.tsx`, import the new pieces:
```typescript
import { languageStore } from "@/lib/languageStore";
import { cefrLevelStore } from "@/lib/cefrLevelStore";
```

Add a small local helper (top of the file, outside the component) that applies a fetched `User`'s preferences to both stores without re-triggering a backend PATCH (hydration should never sync back to the server it just read from):
```typescript
function hydratePreferences(user: User) {
  if (user.preferences?.learningLanguage) languageStore.setLanguage(user.preferences.learningLanguage);
  if (user.preferences?.cefrLevel) cefrLevelStore.setLevel(user.preferences.cefrLevel);
}
```

Update the initial token-validation effect (`src/contexts/AuthContext.tsx:26-37`) to hydrate from the response instead of discarding it:
```typescript
useEffect(() => {
  const { token } = authStore.getState();
  if (!token) {
    setIsReady(true);
    return;
  }
  fetchMe(token)
    .then(hydratePreferences)
    .catch((err) => {
      if (err instanceof ApiError && err.status === 401) authStore.clearSession();
    })
    .finally(() => setIsReady(true));
}, []);
```

Update `login`/`register` (Task 8, Step 3 already added `languageStore.reload()` here — this task adds a `fetchMe` call after that, since `loginUser`/`registerUser`'s own response only carries `{ id, email }`, not `preferences`):
```typescript
const login = useCallback(async (email: string, password: string) => {
  const res = await loginUser(email, password);
  authStore.setSession(res.user, res.token);
  languageStore.reload();
  cefrLevelStore.reload();
  const me = await fetchMe(res.token).catch(() => null);
  if (me) hydratePreferences(me);
  await loadFromServer();
}, []);

const register = useCallback(async (email: string, password: string, inviteCode: string) => {
  const res = await registerUser(email, password, inviteCode);
  authStore.setSession(res.user, res.token);
  languageStore.reload();
  cefrLevelStore.reload();
  const me = await fetchMe(res.token).catch(() => null);
  if (me) hydratePreferences(me);
  await loadFromServer();
}, []);
```

Update `logout` (Task 8, Step 3) to also reload the level store:
```typescript
const logout = useCallback(() => {
  authStore.clearSession();
  languageStore.reload();
  cefrLevelStore.reload();
}, []);
```

- [ ] **Step 6: Sync on language change**

In `src/contexts/LanguageContext.tsx` (Task 8, Step 2), wrap the exposed `setLanguage` so switching language also fires the backend sync, instead of exposing `languageStore.setLanguage` directly:
```typescript
import { syncPreferences } from "@/lib/preferencesSync";
// ...
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(languageStore.getState());

  useEffect(() => languageStore.subscribe(setLanguageState), []);

  const setLanguage = (lang: LanguageCode) => {
    languageStore.setLanguage(lang); // updates localStorage cache + notifies UI immediately
    syncPreferences({ learningLanguage: lang }); // best-effort backend mirror
  };

  return (
    <LanguageContext.Provider value={{ language, config: LANGUAGES[language], setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
```

- [ ] **Step 7: Sync on CEFR level change, and read the initial level from `cefrLevelStore`**

In `src/pages/Dashboard.tsx`, replace:
```typescript
const [activeLevel, setActiveLevel] = useState<CEFRLevel>("A1");
```
with:
```typescript
const [activeLevel, setActiveLevelState] = useState<CEFRLevel>(() => cefrLevelStore.getState());

const setActiveLevel = (level: CEFRLevel) => {
  setActiveLevelState(level);
  cefrLevelStore.setLevel(level); // localStorage cache
  syncPreferences({ cefrLevel: level }); // best-effort backend mirror
};
```
Add the imports:
```typescript
import { cefrLevelStore } from "@/lib/cefrLevelStore";
import { syncPreferences } from "@/lib/preferencesSync";
```
No other call sites change — `setActiveLevel` is already threaded through `SidebarContent`'s props (Task 9) and every other reference in `Dashboard.tsx`, so this stays a drop-in replacement.

- [ ] **Step 8: Type-check and manual test**

Run: `npm run build`.

Run: `npm run dev`, log in as a test user, switch to Español and set level to B1. Open DevTools → Network, filter on `/api/auth/preferences`, confirm a PATCH fired with `{"learningLanguage":"es"}` and another with `{"cefrLevel":"B1"}` (or combined, depending on click order), each returning `200` with the merged `preferences` object. Log out, log back in (or open the app in a different browser/incognito with the same credentials) and confirm the language selector shows Español and the level pill shows B1 immediately on load — i.e., cross-device/cross-session hydration works, not just localStorage. Then go fully offline (DevTools → Network → offline), change language/level again, and confirm the UI still updates instantly (localStorage cache) even though the PATCH silently fails.

- [ ] **Step 9: Commit**

```bash
git add src/types/index.ts src/lib/api.ts src/lib/cefrLevelStore.ts src/lib/preferencesSync.ts src/contexts/AuthContext.tsx src/contexts/LanguageContext.tsx src/pages/Dashboard.tsx
git commit -m "feat(prefs): sync learning language and CEFR level to backend preferences, hydrate on login"
```

---
