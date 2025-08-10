// src/translate.ts
// Простая интеграция с Google Website Translator: выставляем cookie 'googtrans' и подгружаем скрипт.

const GT_SCRIPT_SRC = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
const COOKIE_NAME = 'googtrans';
// базовый язык страницы (что у тебя «оригинал»). Если тексты сейчас смешанные — оставь 'auto'
const BASE_LANG = 'auto'; // или 'en'

function setCookie(name: string, value: string, domain?: string) {
    const parts = [`${name}=${value}`, 'path=/'];
    // Ставим куку на текущий домен и на домен второго уровня (чтобы Google видил)
    if (domain) parts.push(`domain=${domain}`);
    document.cookie = parts.join('; ');
}

function getRootDomain() {
    const h = window.location.hostname;
    const parts = h.split('.');
    if (parts.length <= 1) return h;
    // вернём домен второго уровня, типа: example.com, myapp.co.uk -> co.uk не угадать, поэтому обычно hostname тоже ставим
    return parts.slice(-2).join('.');
}

/** Устанавливаем язык перевода в cookies так, как ждет Google Translate */
export function applyLanguage(lang: string) {
    const value = `/${BASE_LANG}/${lang}`;
    // ставим две куки — на текущий хост и на корневой домен
    setCookie(COOKIE_NAME, value);
    setCookie(COOKIE_NAME, value, `.${getRootDomain()}`);
    // небольшой трюк: обновим текст на странице после смены языка
    // иногда требуется перезагрузка, но чаще виджет сам подхватывает
}

/** Подключаем скрипт переводчика, если он ещё не подключен */
export function ensureGoogleTranslateLoaded(): Promise<void> {
    return new Promise((resolve) => {
        // если уже есть глобал — всё ок
        if ((window as any).google?.translate?.TranslateElement) {
            resolve();
            return;
        }
        // Если уже загружается — ждём callback
        (window as any).googleTranslateElementInit = () => {
            resolve();
        };
        // Проверим, не вставлен ли уже тэг
        if (document.querySelector(`script[src*="translate_a/element.js"]`)) {
            // скрипт уже грузится; ждём init
            return;
        }
        const s = document.createElement('script');
        s.src = GT_SCRIPT_SRC;
        s.async = true;
        document.head.appendChild(s);
    });
}

/** Инициализируем сам виджет. Можно вызывать 1 раз при старте приложения */
export async function initTranslator(wrapperId: string = 'google_translate_element') {
    await ensureGoogleTranslateLoaded();
    const g: any = (window as any).google;
    if (!g?.translate?.TranslateElement) return;

    // Удалим предыдущий контейнер, если перегружаем
    const old = document.getElementById(wrapperId);
    if (old) old.innerHTML = '';

    new g.translate.TranslateElement(
        {
            pageLanguage: BASE_LANG, // 'auto' тоже работает
            includedLanguages: 'en,ru,de,pl,uk,fr,es',
            // inline-вид виджета
            layout: g.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
        },
        wrapperId
    );
}
