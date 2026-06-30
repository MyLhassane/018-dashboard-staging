import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
      fr: { translation: fr },
    },
    supportedLngs: ["ar", "en", "fr"],
    fallbackLng: "ar",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18n_lang",
      caches: ["localStorage"],
      checkWhitelist: true,
    },
  });

i18n.on("languageChanged", (lng) => {
  const dir = i18n.dir(lng);
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

const initialDir = i18n.dir(i18n.language);
document.documentElement.dir = initialDir;
document.documentElement.lang = i18n.language;

export default i18n;
