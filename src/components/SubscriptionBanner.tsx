import { useEffect, useState } from 'react';
import { fetchBillingStatus, createCheckout } from '../api';
import { toast } from 'react-toastify';
import '../styles/SubscriptionBanner.css'

interface BillingStatus {
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'ANON' | 'NO_COMPANY';
    trialEnd?: string;
    currentPeriodEnd?: string;
    daysLeft?: number;
    isAdmin?: boolean;
}

export default function SubscriptionBanner() {
    const [data, setData] = useState<BillingStatus | null>(null);

    useEffect(() => {
        fetchBillingStatus().then(setData).catch(() => {});
    }, []);

    if (!data || data.status === 'ACTIVE') return null;

    const daysLeft = data.daysLeft ?? 0;
    const isAdmin = !!data.isAdmin;

    const onPay = async () => {
        try {
            const { checkoutUrl } = await createCheckout();
            window.location.href = checkoutUrl;
        } catch {
            toast.error('Не удалось создать оплату');
        }
    };

    const label =
        data.status === 'TRIAL'
            ? `Пробный период: осталось ${daysLeft} дн.`
            : 'Подписка истекла';

    return (
        <div className="subscription-banner">
            <b>{label}</b>
            {isAdmin ? (
                <button onClick={onPay}>Продлить</button>
            ) : (
                <span style={{ marginLeft: 12 }}>Обратитесь к администратору компании</span>
            )}
        </div>
    );
}
