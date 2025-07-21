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
        if (!userId) {
            console.error('userId не передан в компонент SubscriptionStatus.');
            setError('Пользователь не найден.');
            return;
        }

        const fetchSubscriptionStatus = async () => {
            try {
                console.log('Fetching subscription status for userId:', userId);
                const response = await api.get<SubscriptionStatusResponse>(`/api/${userId}/subscription-status`);
                console.log('Ответ от сервера:', response.data);
                setStatus(response.data.status);
                setMessage(response.data.message);
                setTrialEndDate(response.data.trialEndDate || '');

                console.log('Состояние компонента обновлено:', {
                    status: response.data.status,
                    message: response.data.message,
                    trialEndDate: response.data.trialEndDate || '',
                });
            } catch (e: unknown) {
                if (axios.isAxiosError(e) && e.response) {
                    console.error('Ошибка сервера:', e.response.data);
                    setError(e.response.data.message || 'Ошибка получения данных о подписке.');
                } else {
                    console.error('Неизвестная ошибка:', e);
                    setError('Неизвестная ошибка.');
                }
            }
        };

        fetchSubscriptionStatus();
    }, [userId]);

    const handlePaymentRedirect = async () => {
        try {
            console.log('Создание сессии оплаты для userId:', userId);
            const { data: checkoutUrl } = await api.get(`/payment/create-checkout-session`, {
                params: { userId },
            });
            console.log('URL оплаты:', checkoutUrl);
            window.location.href = checkoutUrl;
        } catch (e) {
            console.error('Ошибка создания сессии оплаты:', e);
            setError('Не удалось создать сессию оплаты.');
        }
    };

    if (error) {
        console.error('Ошибка в компоненте SubscriptionStatus:', error);
        return <div className="subscription-status error">{error}</div>;
    }

    return (
        <div className="subscription-status">
            <h2>Статус подписки</h2>
            {status === 'active' && <p className="success">{message}</p>}
            {status === 'trial' && (
                <>
                    <p className="info">{message}</p>
                    <p>Пробный период действует до: {trialEndDate || 'нет информации'}</p>
                </>
            )}
            {(status === 'trial_ending_soon' || status === 'expired') && (
                <>
                    <p className={status === 'expired' ? 'error' : 'info'}>{message}</p>
                    <p>
                        {status === 'trial_ending_soon'
                            ? `Пробный период действует до: ${trialEndDate || 'нет информации'}`
                            : 'Подписка истекла или отсутствует. Оформите подписку, чтобы продолжить.'}
                    </p>
                    <button onClick={handlePaymentRedirect} className="pay-button">Оформить подписку</button>
                </>
            )}
        </div>
    );
};
export default SubscriptionStatus;