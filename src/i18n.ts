import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import de from './locales/de.json';
import pl from './locales/pl.json';
import ru from './locales/ru.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            de: { translation: de },
            pl: { translation: pl },
            ru: { translation: ru },
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'de', 'pl', 'ru'],
        interpolation: { escapeValue: false },
        detection: { order: ['querystring', 'localStorage', 'navigator'], caches: ['localStorage'] },
    });

export default i18n;
