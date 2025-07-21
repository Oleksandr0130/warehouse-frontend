import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/SubscriptionStatus.css';

interface SubscriptionStatusProps {
    userId: number; // ID текущего пользователя
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ userId }) => {
    const [status, setStatus] = useState({
        trialEndDate: '',
        isPaid: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscriptionStatus = async () => {
            try {
                const response = await api.get(`/${userId}/subscription-status`);
                setStatus(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Ошибка при загрузке статуса подписки:', error);
                setLoading(false);
            }
        };
        fetchSubscriptionStatus();
    }, [userId]);

    const handlePayClick = async () => {
        try {
            const response = await api.get(`/payment/create-checkout-session`, {
                params: { userId },
            });
            window.location.href = response.data; // Перенаправление на страницу оплаты Stripe
        } catch (error) {
            console.error('Ошибка при создании платежной сессии:', error);
            alert('Произошла ошибка при создании платежа. Попробуйте еще раз.');
        }
    };

    if (loading) return <p>Загрузка...</p>;

    const isTrialExpired =
        status.trialEndDate &&
        new Date(status.trialEndDate) < new Date() &&
        !status.isPaid;

    return (
        <div className="subscription-status">
            <h2>Подписка</h2>
            {status.isPaid ? (
                <p className="success">Ваша подписка активна!</p>
            ) : isTrialExpired ? (
                <p className="error">Пробный период истёк. Пожалуйста, оплатите, чтобы продолжить.</p>
            ) : (
                <p>
                    Пробный период истекает:{" "}
                    <strong>{new Date(status.trialEndDate).toLocaleDateString()}</strong>
                </p>
            )}
            {!status.isPaid && (
                <button className="pay-button" onClick={handlePayClick}>
                    Оплатить
                </button>
            )}
        </div>
    );
};

export default SubscriptionStatus;