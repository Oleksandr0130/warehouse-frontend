// src/components/Confirmation.tsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { confirmEmail } from '../api';
import '../styles/Confirmation.css';

const Confirmation: React.FC = () => {
    const location = useLocation();
    const [message, setMessage] = useState<string>('Обработка...');
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');

    useEffect(() => {
        if (code) {
            confirmEmail(code)
                .then(() => setMessage('Почта успешно подтверждена!'))
                .catch(() => setMessage('Ошибка подтверждения.'));
        } else {
            setMessage('Код подтверждения не найден.');
        }
    }, [code]);

    return (
        <div className="confirmation-container">
            <h2>Подтверждение почты</h2>
            <p>{message}</p>
        </div>
    );
};

export default Confirmation;