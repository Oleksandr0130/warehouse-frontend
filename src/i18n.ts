import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// если хранишь переводы в src/locales/*.json:
import en from './locales/en.json';
import ru from './locales/ru.json';
import pl from './locales/pl.json';
import de from './locales/de.json';

const STORAGE_KEY = 'flowqr_ui_lang';

const saved = (() => {
    try { return localStorage.getItem(STORAGE_KEY) || undefined; } catch { return undefined; }
})();

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ru: { translation: ru },
            pl: { translation: pl },
            de: { translation: de },
        },
        fallbackLng: 'en',
        lng: saved, // приоритет сохранённому языку
        detection: {
            order: ['localStorage', 'querystring', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: STORAGE_KEY
        },
        interpolation: { escapeValue: false },
        returnEmptyString: false
    });

export default i18n;
