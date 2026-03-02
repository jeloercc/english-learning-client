# english-learning-client

Personal English learning dashboard structured around CEFR levels (A1 → C2).

Built with React + TypeScript. Requires [english-learning-app](https://github.com/YOUR_USERNAME/english-learning-app) running as the backend proxy.

---

## Features

| Section | Description |
|---|---|
| **Vocabulary** | 820 word cards with flip animation, IPA phonetics, audio playback, and progress tracking |
| **Grammar** | Grammar rules with contextual examples per CEFR level, completion tracking |
| **Pronunciation** | Word list with real Merriam-Webster audio, Play All mode, pace control |
| **Writing** | Free text editor with live grammar/spelling checking via LanguageTool |
| **Dictionary** | Live word lookup — definitions, IPA, audio, synonyms, antonyms, idioms |
| **Phrases** | Essential phrases organized by topic and situation, learned phrase tracking |

**Progress persistence:** dual-write architecture — instant localStorage updates + SQLite backend (survives page reloads and syncs across sessions).

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — dev server and build tool
- **Tailwind CSS 3** + **shadcn/ui** (Radix UI components)
- **Lucide** — icons

---

## Prerequisites

- Node.js 18+
- pnpm — `npm install -g pnpm`
- [english-learning-app](https://github.com/YOUR_USERNAME/english-learning-app) running on `http://localhost:3001`

---

## Setup

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/english-learning-client.git
cd english-learning-client
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the backend

Make sure [english-learning-app](https://github.com/YOUR_USERNAME/english-learning-app) is running on port 3001.

### 4. Run

```bash
pnpm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
english-learning-client/
├── index.html
├── src/
│   ├── main.tsx                        # React entry point
│   ├── App.tsx                         # Root layout, CEFR nav, section routing
│   ├── components/
│   │   ├── sections/
│   │   │   ├── Vocabulary.tsx          # Flip cards, live audio, progress toggle
│   │   │   ├── Grammar.tsx             # Rules and completion tracking
│   │   │   ├── Pronunciation.tsx       # Audio list, play all, pace control
│   │   │   ├── Writing.tsx             # Editor + live grammar check
│   │   │   ├── DictionarySearch.tsx    # Word lookup with history
│   │   │   └── Phrases.tsx             # Topic-based phrases
│   │   └── ui/                         # shadcn/ui components
│   ├── data/
│   │   ├── vocabulary.ts               # 820 words across 6 CEFR levels
│   │   ├── grammar.ts                  # Grammar rules per level
│   │   └── phrases.ts                  # Phrases organized by topic
│   ├── lib/
│   │   ├── api.ts                      # Fetch helpers (all via localhost:3001)
│   │   └── progress.ts                 # localStorage + SQLite dual-write layer
│   ├── types/
│   │   └── index.ts                    # TypeScript interfaces
│   └── hooks/                          # Custom React hooks
├── public/
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## CEFR Levels

820 vocabulary words and grammar rules organized across 6 levels:

| Level | Words | Description |
|---|---|---|
| A1 | 150 | Beginner |
| A2 | 150 | Elementary |
| B1 | 150 | Intermediate |
| B2 | 150 | Upper-Intermediate |
| C1 | 120 | Advanced |
| C2 | 100 | Mastery |

Level color coding: A1 (sky), A2 (lime), B1 (amber), B2 (orange), C1 (rose), C2 (purple).

---

## API

All requests go through the backend proxy at `http://localhost:3001`. No external APIs are called directly from the frontend.

See [english-learning-app](https://github.com/YOUR_USERNAME/english-learning-app) for the full API reference.

---

## Build

```bash
pnpm run build
```

Output goes to `dist/`.
