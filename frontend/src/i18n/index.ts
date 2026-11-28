import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./locales/de";
import en from "./locales/en";

export const LANGUAGES = [
    // label in its own language, so everyone finds theirs
    { code: "de", label: "Deutsch" },
    { code: "en", label: "English" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

// used when the browser language is not supported
export const FALLBACK_LANGUAGE: Language = "en";

const LANGUAGE_STORAGE_KEY = "flashcards_language";

export function isLanguage(value: unknown): value is Language {
    return LANGUAGES.some((l) => l.code === value);
}

// stored choice first (localStorage is untrusted: only known codes count),
// then the browser languages in order ("de-AT" -> "de"), otherwise the fallback
export function detectLanguage(): Language {
    try {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (isLanguage(stored)) return stored;
    } catch {
        // storage can be blocked (e.g. privacy settings)
    }
    for (const tag of navigator.languages ?? [navigator.language]) {
        const base = tag.split("-")[0].toLowerCase();
        if (isLanguage(base)) return base;
    }
    return FALLBACK_LANGUAGE;
}

// <html lang> for screen readers (pronunciation) and CSS hyphenation
function syncHtmlLang(lng: string) {
    document.documentElement.lang = lng;
}

i18n.on("languageChanged", syncHtmlLang);

// synchronous: resources are bundled, so the first render already has the texts
void i18n.use(initReactI18next).init({
    resources: {
        de: { translation: de },
        en: { translation: en },
    },
    lng: detectLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: LANGUAGES.map((l) => l.code),
    interpolation: {
        // React escapes all output already
        escapeValue: false,
    },
});

// switch the language everywhere and remember it in this browser
export function changeLanguage(lng: Language) {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch {
        // not saved, but still active until reload
    }
    void i18n.changeLanguage(lng);
}

export default i18n;
