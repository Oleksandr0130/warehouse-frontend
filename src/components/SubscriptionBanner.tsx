import { useEffect, useState } from 'react';
import { fetchBillingStatus, createCheckout, openBillingPortal } from '../api';
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
                // тихо игнорируем — не хотим спамить ошибками
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

    if (!data) return null;

    const daysLeft = data.daysLeft ?? 0;
    const isAdmin = Boolean(data.isAdmin);
    const isActive = data.status === 'ACTIVE';

    const label =
        data.status === 'TRIAL'
            ? `Trial period: remaining ${daysLeft} days left.`
            : data.status === 'EXPIRED'
                ? 'Subscription has expired'
                : data.status === 'NO_COMPANY'
                    ? 'No company affiliation'
                    : data.status === 'ACTIVE'
                        ? 'Subscription is active'
                        : 'Guest';

    const onPay = async () => {
        try {
            const { checkoutUrl } = await createCheckout();
            window.location.href = checkoutUrl;
        } catch {
            toast.error('Failed to create payment');
        }
    };

    const onManage = async () => {
        try {
            const { portalUrl } = await openBillingPortal(); // GET /billing/portal
            window.location.href = portalUrl;
        } catch {
            toast.error('Failed to open billing portal');
        }
    };

    return (
        <div className={embedded ? 'sub-card' : 'sub-banner'}>
            <div className="sub-header">
        <span className={`sub-pill ${data.status.toLowerCase()}`}>
          {data.status === 'TRIAL' && 'TRIAL'}
            {data.status === 'ACTIVE' && 'ACTIVE'}
            {data.status === 'EXPIRED' && 'EXPIRED'}
            {data.status === 'NO_COMPANY' && 'NO COMPANY'}
            {data.status === 'ANON' && 'ANON'}
        </span>

                {(data.trialEnd || data.currentPeriodEnd) && (
                    <span className="sub-dates">
            {data.status === 'TRIAL' && data.trialEnd && `to ${new Date(data.trialEnd).toLocaleDateString()}`}
                        {data.status === 'EXPIRED' && data.currentPeriodEnd && `ended ${new Date(data.currentPeriodEnd).toLocaleDateString()}`}
                        {data.status === 'ACTIVE' && data.currentPeriodEnd && `to ${new Date(data.currentPeriodEnd).toLocaleDateString()}`}
          </span>
                )}
            </div>

            <div className="sub-title">{label}</div>

            <div className="sub-actions">
                {isAdmin ? (
                    isActive ? (
                        <button className="sub-btn" onClick={onManage}>
                            Manage / Cancel
                        </button>
                    ) : (
                        <button className="sub-btn" onClick={onPay}>
                            Subscribe
                        </button>
                    )
                ) : (
                    <div className="sub-hint">Extension is available to the company administrator</div>
                )}
            </div>
        </div>
    );
}
