import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css';

type Lang = 'en' | 'de' | 'pl' | 'ru';

const LANGS: Record<Lang, { label: string; flag: string }> = {
    en: { label: 'English',  flag: '🇬🇧' },
    de: { label: 'Deutsch',  flag: '🇩🇪' },
    pl: { label: 'Polski',   flag: '🇵🇱' },
    ru: { label: 'Русский',  flag: '🇷🇺' },
};

const STORAGE_KEY = 'flowqr_ui_lang';

const LanguageSwitcher: React.FC = () => {
    const { i18n, t } = useTranslation();
    const [open, setOpen] = useState(false);
    const current = (i18n.language?.split('-')[0] as Lang) || 'en';
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const popRef = useRef<HTMLDivElement | null>(null);

    // Закрытие по клику вне
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!open) return;
            const target = e.target as Node;
            if (btnRef.current?.contains(target)) return;
            if (popRef.current?.contains(target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    // Синхронизация с localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
            if (saved && saved !== current) {
                i18n.changeLanguage(saved);
            }
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const change = async (lng: Lang) => {
        await i18n.changeLanguage(lng);
        try { localStorage.setItem(STORAGE_KEY, lng); } catch {}
        setOpen(false);
    };

    return (
        <div className="langsw" aria-label={t('common.lang.ariaSwitcher', 'Language switcher')}>
            <button
                ref={btnRef}
                className={`langsw__btn ${open ? 'is-open' : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                title={t('common.lang.change', 'Change language')}
            >
                <span className="langsw__flag" aria-hidden>{LANGS[current].flag}</span>
                <span className="langsw__label">{LANGS[current].label}</span>
                <span className="langsw__chev" aria-hidden>▾</span>
            </button>

            <div
                ref={popRef}
                className={`langsw__pop ${open ? 'open' : ''}`}
                role="listbox"
                aria-activedescendant={`lang-${current}`}
            >
                {(Object.keys(LANGS) as Lang[]).map((lng) => (
                    <button
                        key={lng}
                        id={`lang-${lng}`}
                        role="option"
                        aria-selected={lng === current}
                        className={`langsw__opt ${lng === current ? 'is-active' : ''}`}
                        onClick={() => change(lng)}
                    >
                        <span className="langsw__opt-flag" aria-hidden>{LANGS[lng].flag}</span>
                        <span className="langsw__opt-label">{LANGS[lng].label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSwitcher;
