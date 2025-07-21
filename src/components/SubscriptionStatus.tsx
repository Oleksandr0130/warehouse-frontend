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
            console.error('userId не установлен или равен 0'); // Лог отсутствующего userId
            setError('Пользователь не найден.');
            return;
        }

        const fetchSubscriptionStatus = async () => {
            try {
                console.log('Fetching subscription status for userId:', userId); // Лог начала запроса
                const response = await api.get<SubscriptionStatusResponse>(`/api/${userId}/subscription-status`);
                console.log('Ответ от сервера:', response.data); // Лог ответа сервера
                setStatus(response.data.status);
                setMessage(response.data.message);
                setTrialEndDate(response.data.trialEndDate || '');
                console.log('Обновленное состояние:', {
                    status: response.data.status,
                    message: response.data.message,
                    trialEndDate: response.data.trialEndDate || '',
                });
            } catch (e: unknown) {
                if (axios.isAxiosError(e) && e.response) {
                    console.error('Ошибка сервера:', e.response.data); // Лог ошибки ответа
                    setError(e.response.data.message || 'Ошибка получения данных о подписке.');
                } else {
                    console.error('Неизвестная ошибка:', e); // Лог других ошибок
                    setError('Неизвестная ошибка.');
                }
            }
        };

        fetchSubscriptionStatus();
    }, [userId]);

    const handlePaymentRedirect = async () => {
        try {
            console.log('Создание сессии оплаты для userId:', userId); // Лог перед запросом
            const { data: checkoutUrl } = await api.get(`/api/payment/create-checkout-session`, {
                params: { userId },
            });
            console.log('URL оплаты:', checkoutUrl); // Лог успешного URL
            window.location.href = checkoutUrl; // Перенаправление на URL Stripe
        } catch (e) {
            console.error('Ошибка создания сессии оплаты:', e); // Лог ошибки
            setError('Не удалось создать сессию оплаты.');
        }
    };

    if (error) {
        console.error('Ошибка в компоненте SubscriptionStatus:', error); // Лог ошибки
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
                    {console.log('Rendering trial block with message:', message, 'trialEndDate:', trialEndDate)}
                </>
            )}
            {status === 'expired' && (
                <>
                    <p className="error">{message}</p>
                    <p>Подписка истекла или отсутствует. Оформите подписку, чтобы продолжить.</p>
                    <button onClick={handlePaymentRedirect} className="pay-button">Оформить подписку</button>
                    {console.log('Rendering expired block with message:', message, 'trialEndDate:', trialEndDate)}
                </>
            )}
        </div>
    );
};

export default SubscriptionStatus;