// src/components/SubscriptionBanner.tsx
import { useEffect, useMemo, useState } from 'react';
import {
    fetchBillingStatus,
    createCheckout,
    openBillingPortal,
    createOneOffCheckout,
    BillingStatusDto,
    getErrorMessage,
} from '../api';
import { toast } from 'react-toastify';
import '../styles/SubscriptionBanner.css';

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

    const endingSoon = useMemo(() => {
        if (!status) return false;
        const days = typeof status.daysLeft === 'number' ? status.daysLeft : 9999;
        return (status.status === 'TRIAL' || status.status === 'ACTIVE') && days <= 2;
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
            default:
                return '';
        }
    }, [status]);

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

    // One-off: BLIK/PLN
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

    if (!status) return null;

    return (
        <div className={`subscription-banner ${embedded ? 'embedded' : ''} ${endingSoon ? 'ending' : ''}`}>
            <div className="sub-title">{title}</div>

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
                        <button className="button" onClick={onManage} disabled={loading}>
                            Manage / Cancel
                        </button>
                    ) : (
                        <>
                            <button className="button" onClick={onPay} disabled={loading}>
                                Subscribe
                            </button>
                            <button className="button outline" onClick={onPayBlik} disabled={loading} style={{ marginLeft: 8 }}>
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
