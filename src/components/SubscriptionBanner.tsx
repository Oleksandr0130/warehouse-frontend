// src/components/SubscriptionBanner.tsx
import { useEffect, useMemo, useState } from 'react';
import '../styles/SubscriptionBanner.css';
import {
    fetchBillingStatus,
    createCheckout,
    openBillingPortal,
    createOneOffCheckout,
    BillingStatusDto,
    getErrorMessage,
} from '../api';
import { toast } from 'react-toastify';

interface Props {
    embedded?: boolean;
}

export default function SubscriptionBanner({ embedded }: Props) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<BillingStatusDto | null>(null);

    const load = async () => {
        try {
            const s = await fetchBillingStatus();
            setStatus(s);
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const isEnding = useMemo(() => {
        if (!status?.daysLeft && status?.daysLeft !== 0) return false;
        return (status?.daysLeft ?? 0) <= 3 && (status?.status === 'TRIAL' || status?.status === 'ACTIVE');
    }, [status]);

    const title = useMemo(() => {
        if (!status) return '';
        switch (status.status) {
            case 'TRIAL':
                return `Trial • ${status.daysLeft ?? 0} days left`;
            case 'ACTIVE':
                return `Subscription active • ${status.daysLeft ?? 0} days left`;
            case 'EXPIRED':
                return 'Subscription expired';
            case 'ANON':
                return 'Sign in to subscribe';
            case 'NO_COMPANY':
                return 'No company';
        }
    }, [status]);

    const pillClass = useMemo(() => {
        if (!status) return 'sub-pill';
        const map: Record<NonNullable<BillingStatusDto['status']>, string> = {
            TRIAL: 'sub-pill trial',
            ACTIVE: 'sub-pill',
            EXPIRED: 'sub-pill expired',
            ANON: 'sub-pill anon',
            NO_COMPANY: 'sub-pill no_company',
        };
        const base = map[status.status] ?? 'sub-pill';
        return isEnding ? `${base} ending` : base;
    }, [status, isEnding]);

    const onPay = async () => {
        try {
            setLoading(true);
            const { checkoutUrl } = await createCheckout();
            window.location.href = checkoutUrl;
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    // One-off: BLIK/PLN (и Przelewy24)
    const onPayBlik = async () => {
        try {
            setLoading(true);
            const { checkoutUrl } = await createOneOffCheckout();
            window.location.href = checkoutUrl;
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    const onManage = async () => {
        try {
            setLoading(true);
            const { portalUrl } = await openBillingPortal(window.location.href);
            window.location.href = portalUrl;
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    // Skeleton пока статус грузится
    if (!status) {
        return (
            <div className={embedded ? 'sub-card sub-skeleton' : 'subscription-banner sub-skeleton'}>
                <div className="sub-skel-line" />
                <div className="sub-skel-line short" />
            </div>
        );
    }

    // === EMBEDDED ВАРИАНТ (карточка) ===
    if (embedded) {
        return (
            <div className={`sub-card ${isEnding ? 'sub-ending' : ''}`}>
                <div className="sub-header">
          <span className={pillClass}>
            {status.status === 'TRIAL' && 'Trial'}
              {status.status === 'ACTIVE' && 'Active'}
              {status.status === 'EXPIRED' && 'Expired'}
              {status.status === 'ANON' && 'Anon'}
              {status.status === 'NO_COMPANY' && 'No company'}
          </span>
                    <div className="sub-title">{title}</div>
                </div>

                {(status.status === 'TRIAL' || status.status === 'ACTIVE') && (
                    <div className="sub-dates">
                        {typeof status.daysLeft === 'number' ? `${status.daysLeft} days left` : ''}
                    </div>
                )}

                {!!status.pendingInvoiceUrl && (
                    <div className="sub-warning">
                        Payment requires additional confirmation.&nbsp;
                        <a href={status.pendingInvoiceUrl} target="_blank" rel="noreferrer">
                            Complete authentication
                        </a>
                    </div>
                )}

                <div className="sub-actions">
                    {status.isAdmin ? (
                        status.status === 'ACTIVE' ? (
                            <button className="sub-btn" onClick={onManage} disabled={loading}>
                                Manage / Cancel
                            </button>
                        ) : (
                            <div>
                                <button className="sub-btn" onClick={onPay} disabled={loading}>
                                    Subscribe
                                </button>
                                <button className="sub-btn" onClick={onPayBlik} disabled={loading} style={{ marginLeft: 8 }}>
                                    Pay with BLIK (PLN)
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="sub-hint">Extension is available to the company administrator</div>
                    )}
                </div>
            </div>
        );
    }

    // === КОМПАКТНЫЙ БАННЕР ===
    return (
        <div className={`subscription-banner ${isEnding ? 'sub-ending' : ''}`}>
            <div>
                <div className="sub-title">{title}</div>
                {!!status.pendingInvoiceUrl && (
                    <div className="sub-warning" style={{ marginBottom: 0 }}>
                        Payment requires additional confirmation.&nbsp;
                        <a href={status.pendingInvoiceUrl} target="_blank" rel="noreferrer">
                            Complete authentication
                        </a>
                    </div>
                )}
            </div>

            <div className="sub-actions">
                {status.isAdmin ? (
                    status.status === 'ACTIVE' ? (
                        <button className="subscription-banner button" onClick={onManage} disabled={loading}>
                            Manage / Cancel
                        </button>
                    ) : (
                        <>
                            <button className="subscription-banner button" onClick={onPay} disabled={loading}>
                                Subscribe
                            </button>
                            <button className="subscription-banner button" onClick={onPayBlik} disabled={loading}>
                                Pay with BLIK (PLN)
                            </button>
                        </>
                    )
                ) : (
                    <div className="sub-hint">Extension is available to the company administrator</div>
                )}
            </div>
        </div>
    );
}
