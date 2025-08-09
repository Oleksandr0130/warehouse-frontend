import { useEffect, useState } from 'react';
import { fetchBillingStatus, createCheckout } from '../api';
import { toast } from 'react-toastify';

export interface BillingStatus {
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'ANON' | 'NO_COMPANY';
    trialEnd?: string;
    currentPeriodEnd?: string;
    daysLeft?: number;
    isAdmin?: boolean;
}

interface Props {
    /** Встроенный компактный режим для личного кабинета */
    embedded?: boolean;
}

export default function SubscriptionBanner({ embedded = true }: Props) {
    const [data, setData] = useState<BillingStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetchBillingStatus();
                setData(res);
            } catch {
                // Тихо, чтобы не спамить — в аккаунте мы можем не показывать баннер при ошибке
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className={embedded ? 'sub-card sub-skeleton' : 'sub-banner sub-skeleton'}>
                <div className="sub-skel-line" />
                <div className="sub-skel-line short" />
            </div>
        );
    }

    if (!data || data.status === 'ACTIVE') return null;

    const daysLeft = data.daysLeft ?? 0;
    const isAdmin = Boolean(data.isAdmin);

    const label =
        data.status === 'TRIAL'
            ? `Пробный период: осталось ${daysLeft} дн.`
            : data.status === 'EXPIRED'
                ? 'Подписка истекла'
                : data.status === 'NO_COMPANY'
                    ? 'Нет привязки к компании'
                    : 'Гость';

    const onPay = async () => {
        try {
            const { checkoutUrl } = await createCheckout();
            window.location.href = checkoutUrl;
        } catch {
            toast.error('Не удалось создать оплату');
        }
    };

    return (
        <div className={embedded ? 'sub-card' : 'sub-banner'}>
            <div className="sub-header">
        <span className={`sub-pill ${data.status.toLowerCase()}`}>
          {data.status === 'TRIAL' && 'TRIAL'}
            {data.status === 'EXPIRED' && 'EXPIRED'}
            {data.status === 'NO_COMPANY' && 'NO COMPANY'}
            {data.status === 'ANON' && 'ANON'}
        </span>
                {(data.trialEnd || data.currentPeriodEnd) && (
                    <span className="sub-dates">
            {data.status === 'TRIAL' && data.trialEnd && `до ${new Date(data.trialEnd).toLocaleDateString()}`}
                        {data.status === 'EXPIRED' && data.currentPeriodEnd && `завершилась ${new Date(data.currentPeriodEnd).toLocaleDateString()}`}
          </span>
                )}
            </div>

            <div className="sub-title">{label}</div>

            <div className="sub-actions">
                {isAdmin ? (
                    <button className="sub-btn" onClick={onPay}>
                        Продлить подписку
                    </button>
                ) : (
                    <div className="sub-hint">Продление доступно администратору компании</div>
                )}
            </div>
        </div>
    );
}
