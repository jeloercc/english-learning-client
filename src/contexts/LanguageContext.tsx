import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { languageStore } from "@/lib/languageStore";
import { syncPreferences } from "@/lib/preferencesSync";
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

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
