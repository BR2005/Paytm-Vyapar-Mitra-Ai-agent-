import { createContext, useContext, useEffect, useState } from "react";
import { LANGUAGES, translations } from "../i18n/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem("vyaparmitra_lang");
      if (saved && translations[saved]) return saved;
    } catch (e) {
      // ignore
    }
    return "en";
  });

  const setLanguage = (code) => {
    if (translations[code]) {
      setLangState(code);
      try {
        localStorage.setItem("vyaparmitra_lang", code);
      } catch (e) {
        // ignore
      }
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const t = (key, fallback = "") => {
    const dict = translations[lang] || translations.en;
    if (dict && dict[key] !== undefined) return dict[key];
    if (translations.en && translations.en[key] !== undefined) return translations.en[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, currentLangObj, languages: LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
