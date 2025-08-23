import { useEffect, useMemo, useState } from 'react';
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
                /* ignore */
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // безопасный расчёт daysLeft, если бэк не прислал
    const safeDaysLeft = useMemo(() => {
        if (!data) return 0;
        if (typeof data.daysLeft === 'number') return Math.max(0, data.daysLeft);

        const endRaw =
            data.status === 'TRIAL' ? data.trialEnd :
                data.status === 'ACTIVE' ? data.currentPeriodEnd : undefined;
        if (!endRaw) return 0;

        const diffMs = new Date(endRaw).getTime() - Date.now();
        return Math.max(0, Math.ceil(diffMs / 86_400_000));
    }, [data]);

    const isEndingSoon =
        !!data && (data.status === 'TRIAL' || data.status === 'ACTIVE') && safeDaysLeft <= 2;

    if (loading) {
        return (
            <div className={embedded ? 'sub-card sub-skeleton' : 'sub-banner sub-skeleton'}>
                <div className="sub-skel-line" />
                <div className="sub-skel-line short" />
            </div>
        );
    }
    if (!data) return null;

    const isAdmin = Boolean(data.isAdmin);
    const isActive = data.status === 'ACTIVE';

    const label =
        data.status === 'TRIAL'
            ? `Trial period: remaining ${safeDaysLeft} days left.`
            : data.status === 'EXPIRED'
                ? 'Subscription has expired'
                : data.status === 'NO_COMPANY'
                    ? 'No company affiliation'
                    : data.status === 'ACTIVE'
                        ? `Subscription is active${safeDaysLeft ? `, ${safeDaysLeft} day(s) left` : ''}`
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
            const { portalUrl } = await openBillingPortal();
            window.location.href = portalUrl;
        } catch {
            toast.error('Failed to open billing portal');
        }
    };

    return (
        <div className={`${embedded ? 'sub-card' : 'sub-banner'} ${isEndingSoon ? 'sub-ending' : ''}`}>
            <div className="sub-header">
        <span className={`sub-pill ${data.status.toLowerCase()} ${isEndingSoon ? 'ending' : ''}`}>
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

            {isEndingSoon && (
                <div className="sub-warning">
                    {data.status === 'TRIAL'
                        ? 'Your trial is ending soon. To keep using the app without interruption, please subscribe.'
                        : 'Your subscription period ends soon. You can manage or renew it to avoid interruption.'}
                </div>
            )}

            <div className="sub-actions">
                {isAdmin ? (
                    isActive ? (
                        <button className="sub-btn" onClick={onManage}>Manage / Cancel</button>
                    ) : (
                        <button className="sub-btn" onClick={onPay}>Subscribe</button>
                    )
                ) : (
                    <div className="sub-hint">Extension is available to the company administrator</div>
                )}
            </div>
        </div>
    );
}
