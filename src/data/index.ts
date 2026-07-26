// src/data/index.ts
import { VOCABULARY as EN_VOCABULARY } from "./en/vocabulary";
import { GRAMMAR as EN_GRAMMAR } from "./en/grammar";
import { PHRASES as EN_PHRASES } from "./en/phrases";
import { VOCABULARY as ES_VOCABULARY } from "./es/vocabulary";
import { GRAMMAR as ES_GRAMMAR } from "./es/grammar";
import { PHRASES as ES_PHRASES } from "./es/phrases";
import type { CEFRLevel, VocabWord, GrammarRule, PhraseTopic } from "./types";
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
