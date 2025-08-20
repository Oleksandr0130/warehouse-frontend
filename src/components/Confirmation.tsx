// src/components/Confirmation.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Confirmation.css';
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';

const Confirmation: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [message, setMessage] = useState<string>('Проверяем статус подтверждения…');
    const [status, setStatus] = useState<'success' | 'error'>('error');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const statusParam = params.get('status');

        if (statusParam === 'success') {
            setMessage('Почта успешно подтверждена!');
            setStatus('success');
            setTimeout(() => navigate('/login', { replace: true }), 5000);
        } else {
            setMessage('Не удалось подтвердить почту. Попробуйте ещё раз.');
            setStatus('error');
        }
    }, [location.search, navigate]);

    return (
        <div className="confirmation-page">
            <div className="confirmation-card">
                <div className="confirmation-icon">
                    {status === 'success' && <AiOutlineCheckCircle size={56} />}
                    {status === 'error' && <AiOutlineCloseCircle size={56} />}
                </div>

                <h2 className="confirmation-title">Подтверждение почты</h2>
                <p className="confirmation-text">{message}</p>

                <div className="confirmation-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/app/account')}>
                        Перейти в аккаунт
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate('/login')}>
                        Войти
                    </button>
                </div>

                {status === 'success' && (
                    <p className="confirmation-hint">
                        Сейчас автоматически перейдём на страницу входа…
                    </p>
                )}
            </div>
        </div>
    );
};

export default Confirmation;
