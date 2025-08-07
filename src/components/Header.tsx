import React from 'react';
import { useAuth } from '../types/useAuth.ts';
import api from '../api';


export const Header: React.FC = () => {
    const { user, company } = useAuth();
    if (!user || !company) return null;

    const buy = async () => {
        const { data } = await api.post<{ url: string }>('/stripe/create-checkout-session', {
            priceId: process.env.REACT_APP_STRIPE_PRICE_ID
        });
        window.location.href = data.url;
    };

    return (
        <header className="app-header">
            <div className="header-info">
                <span>Вошли как: <b>{user.email}</b></span>
                <span>Компания: <b>{company.name}</b></span>
            </div>
            <div className="header-actions">
                <button onClick={buy}>Купить подписку</button>
                {user.role === 'ADMIN' && (
                    <button onClick={() => {/* открыть модалку добавления */}}>
                        Добавить пользователя
                    </button>
                )}
            </div>
        </header>
    );
};