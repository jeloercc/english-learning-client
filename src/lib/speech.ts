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
