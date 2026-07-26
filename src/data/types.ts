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
