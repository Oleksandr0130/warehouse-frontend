// src/components/Confirmation.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Confirmation.css';
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';

const Confirmation: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [message, setMessage] = useState<string>('Checking the confirmation status…');
    const [status, setStatus] = useState<'success' | 'error'>('error');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const statusParam = params.get('status');

        if (statusParam === 'success') {
            setMessage('Email successfully confirmed!');
            setStatus('success');
            setTimeout(() => navigate('/login', { replace: true }), 5000);
        } else {
            setMessage('Failed to confirm email. Try again.');
            setStatus('error');
        }
    }, [location.search, navigate]);

    return (
        <div className="confirmation-page">
            <div className="confirmation-card">
                <div className={`confirmation-icon ${status}`}>
                    {status === 'success' && <AiOutlineCheckCircle size={64} />}
                    {status === 'error' && <AiOutlineCloseCircle size={64} />}
                </div>

                <h2 className="confirmation-title">Email confirmation</h2>
                <p className="confirmation-text">{message}</p>

                <div className="confirmation-actions">
                    {/*<button*/}
                    {/*    className="confirmation-btn primary"*/}
                    {/*    onClick={() => navigate('/app/account')}*/}
                    {/*>*/}
                    {/*    Перейти в аккаунт*/}
                    {/*</button>*/}
                    <button
                        className="confirmation-btn outline"
                        onClick={() => navigate('/login')}
                    >
                        Login
                    </button>
                </div>

                {status === 'success' && (
                    <p className="confirmation-hint">
                        Now you will be automatically redirected to the login page...
                    </p>
                )}
            </div>
        </div>
    );
};

export default Confirmation;
