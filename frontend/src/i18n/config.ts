import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import english from "i18n/locales/en.json";
import spanish from "i18n/locales/es.json";

export type LanguageDirection = "ltr" | "rtl";

export type SupportedLanguage = {
  code: string;
  label: string;
  direction: LanguageDirection;
};

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  { code: "en", label: "English", direction: "ltr" },
  { code: "es", label: "Español", direction: "ltr" },
];

export const FALLBACK_LANGUAGE = "en";

export const getLanguageDirection = (code: string): LanguageDirection =>
  SUPPORTED_LANGUAGES.find((language) => code.startsWith(language.code))
    ?.direction ?? "ltr";

export const applyDocumentLanguage = (code: string): void => {
  document.documentElement.lang = code;
  document.documentElement.dir = getLanguageDirection(code);
};

await i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: english },
      es: { translation: spanish },
    },
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES.map((language) => language.code),
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "language",
      caches: ["localStorage"],
    },
  });

applyDocumentLanguage(i18next.language);
i18next.on("languageChanged", applyDocumentLanguage);

export const translate = i18next.t.bind(i18next);
export const i18n = i18next;
