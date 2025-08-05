import React, { useState, useEffect } from "react";
import api from "../api"; // Используем готовый Axios
import { toast } from "react-toastify"; // Нотификации
import "../styles/SubscriptionManager.css"; // Стили компонента

interface SubscriptionManagerProps {
    companyId: number;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ companyId }) => {
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Загрузка статуса подписки
    useEffect(() => {
        const fetchSubscriptionStatus = async () => {
            try {
                const response = await api.get(`/api/companies/${companyId}/subscription-status`);
                setDaysLeft(response.data.daysLeft); // Пример данных от API: { daysLeft: 15 }
            } catch (error) {
                console.error("Ошибка загрузки статуса подписки:", error);
                toast.error("Не удалось загрузить статус подписки.");
            }
        };

        fetchSubscriptionStatus();
    }, [companyId]);

    // Обработка продления подписки
    const handleRenewSubscription = async () => {
        try {
            setLoading(true);
            const response = await api.post(`/api/payments/initiate/${companyId}`);
            window.location.href = response.data.paymentUrl; // Перенаправление на Stripe Checkout
        } catch (error) {
            console.error("Ошибка продления подписки:", error);
            toast.error("Не удалось инициировать продление подписки.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="subscription-manager">
            {daysLeft !== null && (
                <p className="subscription-info">
                    {daysLeft > 0
                        ? `У вас осталось ${daysLeft} дней подписки.`
                        : "Подписка истекла. Пожалуйста, продлите подписку."}
                </p>
            )}
            <button
                className="renew-subscription-btn"
                onClick={handleRenewSubscription}
                disabled={loading || daysLeft === null}
            >
                {loading ? "Загрузка..." : "Продлить подписку"}
            </button>
        </div>
    );
};

export default SubscriptionManager;