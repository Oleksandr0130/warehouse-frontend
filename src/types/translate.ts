// src/translate.ts
const GT_SCRIPT_SRC =
    '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
const COOKIE_NAME = 'googtrans';
const BASE_LANG = 'auto';

declare global {
    /** Описание Google Translate Element как конструктора со статикой InlineLayout */
    interface GoogleTranslateElementCtor {
        new (
            options: {
                pageLanguage: string;
                includedLanguages?: string;
                layout?: unknown;
                autoDisplay?: boolean;
            },
            elementId: string
        ): void;
        InlineLayout: {
            SIMPLE: unknown;
            HORIZONTAL: unknown;
        };
    }

    interface Window {
        googleTranslateElementInit?: () => void;
        google?: {
            translate?: {
                TranslateElement?: GoogleTranslateElementCtor;
            };
        };
    }
}

function setCookie(name: string, value: string, domain?: string) {
    const parts = [`${name}=${value}`, 'path=/'];
    if (domain) parts.push(`domain=${domain}`);
    document.cookie = parts.join('; ');
}

function getRootDomain(): string {
    const h = window.location.hostname;
    const parts = h.split('.');
    if (parts.length <= 1) return h;
    return parts.slice(-2).join('.');
}

export function applyLanguageCookie(lang: string): void {
    const value = `/${BASE_LANG}/${lang}`;
    setCookie(COOKIE_NAME, value);
    setCookie(COOKIE_NAME, value, `.${getRootDomain()}`);
}

function switchGoogleCombo(lang: string): boolean {
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (!combo) return false;

    const exists = Array.from(combo.options).some((o) => o.value === lang);
    if (!exists) return false;

    if (combo.value !== lang) {
        combo.value = lang;
        combo.dispatchEvent(new Event('change'));
    }
    return true;
}

export async function setLanguageImmediate(lang: string): Promise<void> {
    applyLanguageCookie(lang);

    if (switchGoogleCombo(lang)) return;

    await ensureGoogleTranslateLoaded();

    const started = Date.now();
    await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
            if (switchGoogleCombo(lang) || Date.now() - started > 3000) {
                clearInterval(timer);
                resolve();
            }
        }, 150);
    });
}

export function ensureGoogleTranslateLoaded(): Promise<void> {
    return new Promise((resolve) => {
        if (window.google?.translate?.TranslateElement) {
            resolve();
            return;
        }
        window.googleTranslateElementInit = () => resolve();

        if (document.querySelector(`script[src*="translate_a/element.js"]`)) return;

        const s = document.createElement('script');
        s.src = GT_SCRIPT_SRC;
        s.async = true;
        document.head.appendChild(s);
    });
}

export async function initTranslator(
    wrapperId: string = 'google_translate_element'
): Promise<void> {
    await ensureGoogleTranslateLoaded();

    const TranslateElement = window.google?.translate?.TranslateElement;
    if (!TranslateElement) return;

    const host = document.getElementById(wrapperId);
    if (host) host.innerHTML = '';

    new TranslateElement(
        {
            pageLanguage: BASE_LANG,
            includedLanguages: 'en,ru,de,pl,uk,fr,es',
            layout: TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
        },
        wrapperId
    );
}
