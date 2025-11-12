// src/components/Confirmation.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Confirmation.css';
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import { useTranslation } from 'react-i18next';

const Confirmation: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const [message, setMessage] = useState<string>(t('confirmation.checking'));
    const [status, setStatus] = useState<'success' | 'error'>('error');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const statusParam = params.get('status');

        if (statusParam === 'success') {
            setMessage(t('confirmation.success'));
            setStatus('success');
            setTimeout(() => navigate('/login', { replace: true }), 5000);
        } else {
            setMessage(t('confirmation.fail'));
            setStatus('error');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, navigate]);

    return (
        <div className="confirmation-page">
            <div className="confirmation-card">
                <div className={`confirmation-icon ${status}`}>
                    {status === 'success' && <AiOutlineCheckCircle size={64} />}
                    {status === 'error' && <AiOutlineCloseCircle size={64} />}
                </div>

                <h2 className="confirmation-title">{t('confirmation.title')}</h2>
                <p className="confirmation-text">{message}</p>

                <div className="confirmation-actions">
                    <button
                        className="confirmation-btn outline"
                        onClick={() => navigate('/login')}
                    >
                        {t('confirmation.login')}
                    </button>
                </div>

                {status === 'success' && (
                    <p className="confirmation-hint">
                        {t('confirmation.redirectHint')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Confirmation;
