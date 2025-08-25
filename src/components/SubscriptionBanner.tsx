import { useEffect, useMemo, useState } from 'react';
import { fetchBillingStatus, createCheckout, openBillingPortal, checkoutOneTime } from '../api';
import { toast } from 'react-toastify';

export interface BillingStatus {
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'ANON' | 'NO_COMPANY';
    trialEnd?: string;
    currentPeriodEnd?: string;
    daysLeft?: number;
    isAdmin?: boolean;
    pendingCheckoutUrl?: string;
    pendingInvoiceUrl?: string;
}

interface Props {
    embedded?: boolean;
}

function getQueryParam(name: string) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
}

function dropQueryParam(name: string) {
    const u = new URL(window.location.href);
    u.searchParams.delete(name);
    window.history.replaceState({}, '', u.pathname + (u.search ? `?${u.searchParams}` : '') + u.hash);
}

export default function SubscriptionBanner({ embedded = true }: Props) {
    const [data, setData] = useState<BillingStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [busy, setBusy] = useState<null | 'sub' | 'one' | 'portal'>(null);

    // единая функция подгрузки
    const reload = async () => {
        try {
            const res = await fetchBillingStatus();
            setData(res);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            setLoading(true);
            await reload();
            if (!cancelled) setLoading(false);

            // если вернулись со Stripe — опросим статус несколько раз (вебхук может запоздать)
            const billingFlag = getQueryParam('billing'); // success | cancel | null
            if (billingFlag) {
                // подчистим URL
                dropQueryParam('billing');

                let tries = 0;
                const maxTries = 8;      // ~40 сек
                const delayMs  = 5000;

                while (!cancelled && tries < maxTries) {
                    tries += 1;
                    // если уже ACTIVE — хватит
                    if (data?.status === 'ACTIVE') break;
                    await new Promise(r => setTimeout(r, delayMs));
                    await reload();
                }
            }
        };

        bootstrap();

        // обновлять при возврате фокуса во вкладку
        const onFocus = () => { reload(); };
        window.addEventListener('focus', onFocus);

        return () => {
            cancelled = true;
            window.removeEventListener('focus', onFocus);
        };
    }, []);

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

    const isEndingSoon = !!data && (data.status === 'TRIAL' || data.status === 'ACTIVE') && safeDaysLeft <= 2;

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
    const hasPendingCheckout = Boolean(data.pendingCheckoutUrl);
    const hasPendingInvoice = Boolean(data.pendingInvoiceUrl);

    const label =
        data.status === 'TRIAL'
            ? `Trial period: remaining ${safeDaysLeft} day(s).`
            : data.status === 'EXPIRED'
                ? 'Subscription has expired'
                : data.status === 'NO_COMPANY'
                    ? 'No company affiliation'
                    : data.status === 'ACTIVE'
                        ? `Subscription is active${safeDaysLeft ? `, ${safeDaysLeft} day(s) left` : ''}`
                        : 'Guest';

    const onPaySubscription = async () => {
        try {
            setBusy('sub');
            const { checkoutUrl } = await createCheckout();
            window.location.href = checkoutUrl;
        } catch {
            toast.error('Failed to create subscription');
        } finally {
            setBusy(null);
        }
    };

    const onPayOneTime = async () => {
        try {
            setBusy('one');
            const url = await checkoutOneTime();
            window.location.href = url;
        } catch {
            toast.error('Failed to create one-time payment');
        } finally {
            setBusy(null);
        }
    };

    const onManage = async () => {
        try {
            setBusy('portal');
            const { portalUrl } = await openBillingPortal();
            window.location.href = portalUrl;
        } catch {
            toast.error('Failed to open billing portal');
        } finally {
            setBusy(null);
        }
    };

    const onContinueCheckout = () => {
        if (data?.pendingCheckoutUrl) window.location.href = data.pendingCheckoutUrl;
    };

    const onCompleteAuth = () => {
        if (data?.pendingInvoiceUrl) window.location.href = data.pendingInvoiceUrl;
    };

    return (
        <div className={`${embedded ? 'sub-card' : 'sub-banner'} ${isEndingSoon ? 'sub-ending' : ''}`}>
            <div className="sub-header">
        <span className={`sub-pill ${data.status.toLowerCase()} ${isEndingSoon ? 'ending' : ''}`}>
          {data.status}
        </span>

                {(data.trialEnd || data.currentPeriodEnd) && (
                    <span className="sub-dates">
            {data.status === 'TRIAL'  && data.trialEnd         && `to ${new Date(data.trialEnd).toLocaleDateString()}`}
                        {data.status === 'EXPIRED'&& data.currentPeriodEnd && `ended ${new Date(data.currentPeriodEnd).toLocaleDateString()}`}
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
                    hasPendingInvoice ? (
                        <button className="sub-btn" onClick={onCompleteAuth}>
                            Complete authentication
                        </button>
                    ) : hasPendingCheckout ? (
                        <button className="sub-btn" onClick={onContinueCheckout}>
                            Continue payment
                        </button>
                    ) : isActive ? (
                        <button className="sub-btn" onClick={onManage} disabled={busy !== null}>
                            {busy === 'portal' ? '...' : 'Manage / Cancel'}
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button className="sub-btn" onClick={onPaySubscription} disabled={busy !== null}>
                                {busy === 'sub' ? '...' : 'Subscribe'}
                            </button>
                            <button className="sub-btn secondary" onClick={onPayOneTime} disabled={busy !== null}>
                                {busy === 'one' ? '...' : 'One-time payment'}
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
