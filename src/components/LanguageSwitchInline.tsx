// src/components/LanguageSwitchInline.tsx
import { useEffect, useState } from 'react';
import { applyLanguage, initTranslator } from '../types/translate.ts';
import '../styles/AppTranslate.css'

const langs = [
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
    { code: 'de', label: 'DE' },
    { code: 'pl', label: 'PL' },
    { code: 'uk', label: 'UA' },
];

interface Props {
    compact?: boolean;
}

export default function LanguageSwitchInline({ compact = true }: Props) {
    const [lang, setLang] = useState<string>(() => localStorage.getItem('preferredLang') || 'en');

    useEffect(() => {
        // Инициализируем виджет (контейнер рендерим невидимым)
        initTranslator('gt_widget_silent').catch(() => {});
        // применим сохранённый язык
        applyLanguage(lang);
    }, []);

    const onChange = (code: string) => {
        setLang(code);
        localStorage.setItem('preferredLang', code);
        applyLanguage(code);
        // некоторые комбинации требуют лёгкой перезагрузки,
        // но чаще виджет сам подхватывает изменения cookie.
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
            {/* Невидимый контейнер для Google Translate Element */}
            <div id="gt_widget_silent" style={{ width: 0, height: 0, overflow: 'hidden' }} />
        </div>
    );
}
