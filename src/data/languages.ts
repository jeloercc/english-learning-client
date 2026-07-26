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
