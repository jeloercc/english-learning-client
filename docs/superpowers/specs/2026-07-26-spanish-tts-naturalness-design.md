# Spanish TTS naturalness — design

## Context

`src/lib/speech.ts` wraps the browser `SpeechSynthesis` API for Spanish (Spanish has no
backend audio API yet, unlike English which uses the MW audio API). It is called from a
single site: `Pronunciation.tsx`'s `playWord()`, always with a single vocabulary term
(never a phrase or sentence). Today:

- Voice selection (`pickSpanishVoice`) ranks purely by locale string: exact `lang` match →
  `es-mx`/`es-419`/`es-us` → `es-es` → any other `es-*` → none. It ignores voice quality
  signals entirely.
- The utterance never sets `rate` or `pitch` — both stay at the browser default of `1`.
- `Pronunciation.tsx` already has a "Pace" selector (`PACE_OPTIONS`: Slow/Normal/Fast), but
  it only controls the `setTimeout` delay between words in "Play All" — it has no effect on
  the speech rate of any individual utterance.

Goal: make the synthesized Spanish audio sound less robotic and easier to learn from,
without breaking anything on systems that only have low-quality voices.

## Changes

### 1. Quality-aware voice ranking (`src/lib/speech.ts`)

Replace `pickSpanishVoice`'s pure-locale ranking with a two-key sort over all `es-*` voices:

- **Quality score** (primary key): `+2` if the voice name matches a known premium name
  (Mónica, Paulina, Angélica, Juan — compared accent-insensitively), `+2` if the name
  contains "Enhanced"/"Premium"/"Neural" (case-insensitive), `+1` if `localService === false`.
  Scores add up, so a voice matching multiple signals ranks highest.
- **Locale score** (tie-break, and the sole ranking key when every candidate scores 0
  quality): exact match on the requested `lang` > `es-mx`/`es-419`/`es-us` > `es-es` > any
  other `es-*`.

This subsumes today's two-step logic in `speak()` (try exact `lang` match, else fall back to
`pickSpanishVoice`) into one function, so quality can outrank a same-tier locale difference
(e.g. an Enhanced `es-ES` voice now beats a default-quality `es-MX` voice), while the
locale-only fallback ordering is preserved byte-for-byte when no voice reports any quality
signal — satisfies "don't break anything when only low-quality voices exist."

### 2. Utterance parameters

`speak()` gains a third, optional parameter: `speak(text, lang, { rate = 0.9, pitch = 1.0 })`.
Defaults match today's call sites exactly when the caller omits the option (existing
callers get the new default rate automatically, which is the desired behavior here).

### 3. Reuse the Pace control to drive `rate`

`PACE_OPTIONS` in `Pronunciation.tsx` gains a `rate` field per option:

| Label  | delay (ms) | rate |
|--------|-----------|------|
| Slow   | 3500      | 0.75 |
| Normal | 1800      | 0.9  |
| Fast   | 800       | 1.1  |

(`Fast` set to 1.1 rather than 1.15 per user direction — favor clarity over speed for a
learning app; cannot be A/B-listened to from this environment, so the more conservative
value is the shipped default.)

`playWord` passes `PACE_OPTIONS[paceIndex].rate` into `speak()`. Since `playWord` is the only
path to `speak()` (both direct word clicks and the `playAll` loop go through it), one control
now governs both inter-word pause and per-word speech rate.

### 4. Preserve punctuation for future phrase support

No current caller passes a phrase/sentence — `speak()` already forwards `text` to
`SpeechSynthesisUtterance` unmodified, so punctuation-driven pausing already works. Add a
one-line comment on `speak()` noting that callers must not strip punctuation, so this isn't
accidentally broken when phrase-level playback is added later.

### 5. Temporary voice-detection log

On first successful voice load, `console.table` the `name`, `lang`, and `localService` of
every `es-*` voice, gated behind a module-level flag so it only fires once per page load.
Purely diagnostic — the user will check the browser console to see what's available on their
system.

## Non-goals

- No UI changes beyond reusing the existing Pace selector.
- No changes to the English/MW audio path (`hasAudioApi` branch in `playWord`).
- No SSML / speech-markup support — plain-text punctuation only.

## Testing

Manual: run the dev server, open Pronunciation for Spanish, check the console table of
detected voices, click through Slow/Normal/Fast and confirm audible rate change, confirm
"Play All" still paces between words correctly.
