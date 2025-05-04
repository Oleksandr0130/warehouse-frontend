// src/components/Confirmation.tsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { confirmEmail } from '../api';
import '../styles/Confirmation.css';
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';

const Confirmation: React.FC = () => {
    const location = useLocation();
    const [message, setMessage] = useState<string>('Обработка...');
    const [status, setStatus] = useState<'success' | 'error' | 'processing'>('processing');

    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');

    useEffect(() => {
        if (code) {
            confirmEmail(code)
                .then(() => {
                    setMessage('Почта успешно подтверждена!');
                    setStatus('success');
                })
                .catch(() => {
                    setMessage('Ошибка подтверждения.');
                    setStatus('error');
                });
        } else {
            setMessage('Код подтверждения не найден.');
            setStatus('error');
        }
    }, [code]);

    return (
        <div className="confirmation-container">
            {status === 'success' && <AiOutlineCheckCircle size={50} color="#4caf50" />}
            {status === 'error' && <AiOutlineCloseCircle size={50} color="#f44336" />}
            <h2>Подтверждение почты</h2>
            <p>{message}</p>
        </div>
    );
};


export default Confirmation;