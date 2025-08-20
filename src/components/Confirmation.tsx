// src/components/Confirmation.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmEmail } from '../api';
import '../styles/Confirmation.css';
import { AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineLoading3Quarters } from 'react-icons/ai';

const Confirmation: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [message, setMessage] = useState<string>('Подтверждаем вашу почту…');
    const [status, setStatus] = useState<'success' | 'error' | 'processing'>('processing');

    // безопасно парсим код только один раз
    const code = useMemo(() => new URLSearchParams(location.search).get('code'), [location.search]);

    useEffect(() => {
        let timer: ReturnType<typeof window.setTimeout> | null = null;

        const run = async () => {
            if (!code) {
                setMessage('Код подтверждения не найден.');
                setStatus('error');
                return;
            }
            try {
                await confirmEmail(code);
                setMessage('Почта успешно подтверждена!');
                setStatus('success');

                // мягкий авто-редирект на логин через 5 секунд
                timer = window.setTimeout(() => navigate('/login', { replace: true }), 5000);
            } catch {
                setMessage('Не удалось подтвердить почту. Попробуйте ещё раз.');
                setStatus('error');
            }
        };

        run();
        timer = window.setTimeout(() => navigate('/login', {replace: true}), 5000)
        return () => {
            if (timer !== null) {
                window.clearTimeout(timer);
            }
        }
    }, [code, navigate]);

    return (
        <div className="confirmation-page">
            <div className="confirmation-card">
                <div className="confirmation-icon">
                    {status === 'processing' && <AiOutlineLoading3Quarters className="spin" size={56} />}
                    {status === 'success' && <AiOutlineCheckCircle size={56} />}
                    {status === 'error' && <AiOutlineCloseCircle size={56} />}
                </div>

                <h2 className="confirmation-title">Подтверждение почты</h2>
                <p className="confirmation-text">{message}</p>

                <div className="confirmation-actions">
                    {/* Кнопка в аккаунт (приватный роут). Если нет токена — твой guard перекинет на /login */}
                    <button className="btn btn-primary" onClick={() => navigate('/app/account')}>Перейти в аккаунт</button>

                    {/* Всегда есть быстрый путь на логин */}
                    <button className="btn btn-outline" onClick={() => navigate('/login')}>Войти</button>
                </div>

                {status === 'success' && (
                    <p className="confirmation-hint">Сейчас автоматически перейдём на страницу входа…</p>
                )}
            </div>
        </div>
    );
};

export default Confirmation;
