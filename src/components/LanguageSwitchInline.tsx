// src/components/LanguageSwitchInline.tsx
import { useEffect, useState } from 'react';
import { initTranslator, setLanguageImmediate, applyLanguageCookie } from '../types/translate.ts';
import '../styles/LanguageSwitchInline.css';

const langs = [
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
    { code: 'de', label: 'DE' },
    { code: 'pl', label: 'PL' },
    { code: 'uk', label: 'UA' },
];

export default function LanguageSwitchInline({ compact = true }: { compact?: boolean }) {
    const [lang, setLang] = useState<string>(() => localStorage.getItem('preferredLang') || 'en');

    useEffect(() => {
        // инициализация виджета и мгновенное применение сохранённого языка
        initTranslator('gt_widget_silent').then(() => {
            setLanguageImmediate(lang);
        }).catch(() => {
            // в крайнем случае хотя бы куку поставим
            applyLanguageCookie(lang);
        });
    }, []);

    const onChange = async (code: string) => {
        setLang(code);
        localStorage.setItem('preferredLang', code);
        await setLanguageImmediate(code); // применяем без перезагрузки
    };

    return (
        <div className={`lang-inline ${compact ? 'compact' : ''}`}>
            <span className="lang-label">Language:</span>
            <div className="lang-buttons">
                {langs.map(l => (
                    <button
                        key={l.code}
                        className={`lang-chip ${lang === l.code ? 'active' : ''}`}
                        onClick={() => onChange(l.code)}
                        type="button"
                    >
                        {l.label}
                    </button>
                ))}
            </div>
            <div id="gt_widget_silent" style={{ width: 0, height: 0, overflow: 'hidden' }} />
        </div>
    );
}
