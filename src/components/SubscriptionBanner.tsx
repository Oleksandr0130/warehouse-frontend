import { useEffect, useMemo, useState } from 'react';
import '../styles/SubscriptionBanner.css';
import {
    fetchBillingStatus,
    createOneOffCheckout,
    BillingStatusDto,
    Currency,
    getErrorMessage,
} from '../api';
import { toast } from 'react-toastify';

interface Props {
    embedded?: boolean;
}

function isCurrency(v: unknown): v is Currency {
    return v === 'PLN' || v === 'EUR';
}

export default function SubscriptionBanner({ embedded }: Props) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<BillingStatusDto | null>(null);
    const [currency, setCurrency] = useState<Currency>('EUR');

    const load = async () => {
        try {
            const s = await fetchBillingStatus();
            setStatus(s);

            if (isCurrency(s.billingCurrency)) {
                setCurrency(s.billingCurrency);
            } else if (navigator.language?.toLowerCase().startsWith('pl')) {
                setCurrency('PLN');
            }
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
                return `Access active • ${status.daysLeft ?? 0} days left`;
            case 'EXPIRED':
                return 'Access expired';
            case 'ANON':
                return 'Sign in to purchase';
            case 'NO_COMPANY':
                return 'No company';
        }
    }, [status]);

    const pillClass = useMemo(() => {
        if (!status) return 'sub-pill';
        const map: Record<NonNullable<BillingStatusDto['status']>, string> = {
            TRIAL: 'sub-pill trial',
            ACTIVE: 'sub-pill active',
            EXPIRED: 'sub-pill expired',
            ANON: 'sub-pill anon',
            NO_COMPANY: 'sub-pill no_company',
        };
        const base = map[status.status] ?? 'sub-pill';
        return isEnding ? `${base} ending` : base;
    }, [status, isEnding]);

    // === Расчёт прогресса (для тёмной карточки)
    // Показываем ДОЛЮ оставшихся дней. Базовый период — 30 дн. (fallback).
    const progressPct = useMemo(() => {
        if (!status || (status.status !== 'TRIAL' && status.status !== 'ACTIVE')) return 0;
        const daysLeft = typeof status.daysLeft === 'number' ? status.daysLeft : 0;
        const base = 30; // если API не даёт длительность периода, берём 30
        const pct = Math.max(0, Math.min(100, (daysLeft / base) * 100));
        return pct;
    }, [status]);

    const onPayCurrency = async (cur: Currency) => {
        try {
            setLoading(true);
            const { checkoutUrl } = await createOneOffCheckout(cur);
            window.location.href = checkoutUrl;
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    // Skeleton
    if (!status) {
        return (
            <div className={embedded ? 'sub-card sub-skeleton' : 'subscription-banner sub-skeleton'}>
                <div className="sub-skel-line" />
                <div className="sub-skel-line short" />
            </div>
        );
    }

    // Embedded (тёмная карточка + прогресс)
    if (embedded) {
        return (
            <div className={`sub-card ${isEnding ? 'sub-ending' : ''}`}>
                <div className="sub-header">
                    <div className="sub-title">{title}</div>
                    <span className={pillClass}>
            {status.status === 'TRIAL' && 'Trial'}
                        {status.status === 'ACTIVE' && 'Active'}
                        {status.status === 'EXPIRED' && 'Expired'}
                        {status.status === 'ANON' && 'Anon'}
                        {status.status === 'NO_COMPANY' && 'No company'}
          </span>
                </div>

                {(status.status === 'TRIAL' || status.status === 'ACTIVE') && (
                    <>
                        <div className="sub-dates">
                            {typeof status.daysLeft === 'number' ? `${status.daysLeft} days left` : ''}
                        </div>

                        <div className="sub-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPct)}>
                            <div className="sub-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </>
                )}

                <div className="sub-actions">
                    {status.isAdmin ? (
                        <div className="sub-actions-row">
                            <div className="sub-currency-toggle">
                                <label>
                                    <input
                                        type="radio"
                                        name="currency"
                                        value="EUR"
                                        checked={currency === 'EUR'}
                                        onChange={() => setCurrency('EUR')}
                                    />
                                    EUR
                                </label>
                                <label style={{ marginLeft: 12 }}>
                                    <input
                                        type="radio"
                                        name="currency"
                                        value="PLN"
                                        checked={currency === 'PLN'}
                                        onChange={() => setCurrency('PLN')}
                                    />
                                    PLN
                                </label>
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <button className="sub-btn" onClick={() => onPayCurrency(currency)} disabled={loading}>
                                    {currency === 'EUR' ? 'Buy 1 month (EUR · card)' : 'Zapłać 1 miesiąc (PLN · karta/BLIK)'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="sub-hint">Extension is available to the company administrator</div>
                    )}
                </div>
            </div>
        );
    }

    // Banner (оставил как было)
    return (
        <div className={`subscription-banner ${isEnding ? 'sub-ending' : ''}`}>
            <div>
                <div className="sub-title">{title}</div>
            </div>

            <div className="sub-actions">
                {status.isAdmin ? (
                    <>
                        <div className="sub-currency-toggle" style={{ marginRight: 12 }}>
                            <label>
                                <input
                                    type="radio"
                                    name="currency"
                                    value="EUR"
                                    checked={currency === 'EUR'}
                                    onChange={() => setCurrency('EUR')}
                                />
                                EUR
                            </label>
                            <label style={{ marginLeft: 12 }}>
                                <input
                                    type="radio"
                                    name="currency"
                                    value="PLN"
                                    checked={currency === 'PLN'}
                                    onChange={() => setCurrency('PLN')}
                                />
                                PLN
                            </label>
                        </div>

                        <button className="subscription-banner button" onClick={() => onPayCurrency(currency)} disabled={loading}>
                            {currency === 'EUR' ? 'Buy 1 month (EUR · card)' : 'Zapłać 1 miesiąc (PLN · karta/BLIK)'}
                        </button>
                    </>
                ) : (
                    <div className="sub-hint">Extension is available to the company administrator</div>
                )}
            </div>
        </div>
    );
}
