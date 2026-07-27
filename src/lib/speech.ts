// src/lib/speech.ts — browser SpeechSynthesis wrapper for languages without a
// backend audio API (Spanish, phase 1).

const SPANISH_VOICE_PRIORITY = ["es-mx", "es-419", "es-us"];

// Known higher-quality macOS/iOS Spanish voice names (compared accent-insensitively).
const PREMIUM_VOICE_NAMES = ["monica", "paulina", "angelica", "juan"];
const QUALITY_KEYWORD_RE = /enhanced|premium|neural/i;

let hasLoggedVoices = false;

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
      // Don't permanently cache an empty result — [] is truthy, so caching it
      // here would make the `if (cachedVoices) ...` guard above treat "still
      // loading" as "confirmed no voices" forever. Only cache non-empty
      // results; otherwise clear voicesPromise so a later call re-attempts
      // (covers slow-but-not-hung engines, e.g. some Android/ChromeOS TTS
      // init that finishes just after our 1s timeout).
      const late = synth.getVoices();
      if (late.length > 0) cachedVoices = late; else voicesPromise = null;
      resolve(late);
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

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Higher score = better voice. Recognizes known premium macOS/iOS Spanish
// voices, "Enhanced"/"Premium"/"Neural" naming, and non-local (usually
// higher-quality, e.g. Chrome network) voices. Scores stack, so a voice
// matching multiple signals ranks above one matching only one.
function voiceQualityScore(voice: SpeechSynthesisVoice): number {
  const name = stripAccents(voice.name.toLowerCase());
  let score = 0;
  if (PREMIUM_VOICE_NAMES.some((n) => name.includes(n))) score += 2;
  if (QUALITY_KEYWORD_RE.test(voice.name)) score += 2;
  if (voice.localService === false) score += 1;
  return score;
}

// Locale-match score, used as a tie-break within a quality tier and as the
// sole ranking key when no candidate has any quality signal (i.e. the
// original locale-only fallback: exact match > es-MX/es-419/es-US > es-ES >
// any other es-*).
function localeScore(voice: SpeechSynthesisVoice, lang: string): number {
  const l = voice.lang.toLowerCase();
  if (l === lang.toLowerCase()) return 4;
  const idx = SPANISH_VOICE_PRIORITY.indexOf(l);
  if (idx !== -1) return 3 - idx;
  if (l === "es-es") return 0.5;
  return 0;
}

function pickSpanishVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  const esVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  if (esVoices.length === 0) return null;

  let best = esVoices[0];
  let bestQuality = voiceQualityScore(best);
  let bestLocale = localeScore(best, lang);

  for (const voice of esVoices.slice(1)) {
    const quality = voiceQualityScore(voice);
    const locale = localeScore(voice, lang);
    if (quality > bestQuality || (quality === bestQuality && locale > bestLocale)) {
      best = voice;
      bestQuality = quality;
      bestLocale = locale;
    }
  }

  return best;
}

// Temporary diagnostic: log every es-* voice this browser/OS reports, so we
// can see what quality of voice is actually available. Fires once per page
// load.
function logSpanishVoices(voices: SpeechSynthesisVoice[]): void {
  if (hasLoggedVoices) return;
  hasLoggedVoices = true;
  const esVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  if (esVoices.length === 0) {
    console.log("[speech] No es-* voices detected.");
    return;
  }
  console.table(
    esVoices.map((v) => ({ name: v.name, lang: v.lang, localService: v.localService }))
  );
}

export async function getSpanishVoice(lang = "es-MX"): Promise<SpeechSynthesisVoice | null> {
  const voices = await loadVoices();
  logSpanishVoices(voices);
  return pickSpanishVoice(voices, lang);
}

export async function hasSpanishVoice(): Promise<boolean> {
  return (await getSpanishVoice()) !== null;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

// `text` is spoken as-is, including punctuation — punctuation drives natural
// pauses in most engines, so callers (including future phrase/sentence
// playback) must not strip it before calling speak().
export async function speak(text: string, lang: string, options: SpeakOptions = {}): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = options.rate ?? 0.9;
  utterance.pitch = options.pitch ?? 1.0;

  const voices = await loadVoices();
  logSpanishVoices(voices);
  const voice = pickSpanishVoice(voices, lang);
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
