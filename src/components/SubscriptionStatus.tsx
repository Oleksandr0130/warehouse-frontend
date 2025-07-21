import '../styles/SubscriptionStatus.css';
import { useEffect, useState } from 'react';
import api from '../api';
import axios from "axios";

interface SubscriptionStatusResponse {
    status: string;
    message: string;
    trialEndDate?: string;
}

const SubscriptionStatus = ({ userId }: { userId: number }) => {
    const [status, setStatus] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [trialEndDate, setTrialEndDate] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubscriptionStatus = async () => {
            try {
                const response = await api.get<SubscriptionStatusResponse>(`/${userId}/subscription-status`);
                setStatus(response.data.status);
                setMessage(response.data.message);
                setTrialEndDate(response.data.trialEndDate || '');
            } catch (e: unknown) {
                if (axios.isAxiosError(e) && e.response) {
                    setError(e.response.data.message || 'Ошибка получения данных о подписке.');
                } else {
                    setError('Неизвестная ошибка.');
                }
            }
        };

        fetchSubscriptionStatus();
    }, [userId]);

    const handlePaymentRedirect = async () => {
        try {
            const { data: checkoutUrl } = await api.get(`/payment/create-checkout-session`, {
                params: { userId },
            });
            window.location.href = checkoutUrl; // Перенаправление на URL Stripe CheckOut
        } catch {
            setError('Не удалось создать сессию оплаты.');
        }
    };

    if (error) {
        return <div className="subscription-status error">{error}</div>;
    }

    return (
        <div className="subscription-status">
            <h2>Статус подписки</h2>
            {status === 'active' && (
                <p className="success">{message}</p>
            )}
            {status === 'trial' && (
                <>
                    <p className="info">{message}</p>
                    <p>Пробный период доступен до: {trialEndDate}</p>
                </>
            )}
            {status === 'expired' && (
                <>
                    <p className="error">{message}</p>
                    <button onClick={handlePaymentRedirect} className="pay-button">Продлить подписку</button>
                </>
            )}
        </div>
    );
};

export default SubscriptionStatus;