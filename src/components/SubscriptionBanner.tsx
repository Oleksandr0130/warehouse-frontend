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
import { useTranslation } from 'react-i18next';

declare global {
    interface Window {
        billing?: { buy: (productId: string) => void };
    }
}

interface Props {
    embedded?: boolean;
}

function isCurrency(v: unknown): v is Currency {
    return v === 'PLN' || v === 'EUR';
}

export default function SubscriptionBanner({ embedded }: Props) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<BillingStatusDto | null>(null);
    const [currency, setCurrency] = useState<Currency>('EUR');

    // APK (WebView с JS-мостом)
    const isAndroidApp = typeof window !== 'undefined' && !!window.billing;

    const load = async () => {
        try {
            const s = await fetchBillingStatus();
            setStatus(s);

            if (!isAndroidApp) {
                // Валюты касаются только веб-Stripe
                if (isCurrency(s.billingCurrency)) {
                    setCurrency(s.billingCurrency);
                } else if ((navigator.language || i18n.language)?.toLowerCase().startsWith('pl')) {
                    setCurrency('PLN');
                }
            }
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isEnding = useMemo(() => {
        if (!status?.daysLeft && status?.daysLeft !== 0) return false;
        return (status?.daysLeft ?? 0) <= 3 && (status?.status === 'TRIAL' || status?.status === 'ACTIVE');
    }, [status]);

    const title = useMemo(() => {
        if (!status) return '';
        switch (status.status) {
            case 'TRIAL':
                return t('sub.title.trial', { days: status.daysLeft ?? 0 });
            case 'ACTIVE':
                return t('sub.title.active', { days: status.daysLeft ?? 0 });
            case 'EXPIRED':
                return t('sub.title.expired');
            case 'ANON':
                return t('sub.title.anon');
            case 'NO_COMPANY':
                return t('sub.title.noCompany');
            default:
                return '';
        }
    }, [status, t]);

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

    // Прогресс (для тёмной карточки)
    const progressPct = useMemo(() => {
        if (!status || (status.status !== 'TRIAL' && status.status !== 'ACTIVE')) return 0;
        const daysLeft = typeof status.daysLeft === 'number' ? status.daysLeft : 0;
        const base = 30; // fallback
        const pct = Math.max(0, Math.min(100, (daysLeft / base) * 100));
        return pct;
    }, [status]);

    // Покупка: APK → Google Play; Web → Stripe
    const onPay = async () => {
        try {
            setLoading(true);
            if (isAndroidApp) {
                window.billing?.buy('flowqr_standard');
            } else {
                const { checkoutUrl } = await createOneOffCheckout(currency);
                window.location.href = checkoutUrl;
            }
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
            {status.status === 'TRIAL' && t('sub.badges.trial')}
                        {status.status === 'ACTIVE' && t('sub.badges.active')}
                        {status.status === 'EXPIRED' && t('sub.badges.expired')}
                        {status.status === 'ANON' && t('sub.badges.anon')}
                        {status.status === 'NO_COMPANY' && t('sub.badges.noCompany')}
          </span>
                </div>

                {(status.status === 'TRIAL' || status.status === 'ACTIVE') && (
                    <>
                        <div className="sub-dates">
                            {typeof status.daysLeft === 'number' ? t('sub.daysLeft', { days: status.daysLeft }) : ''}
                        </div>

                        <div
                            className="sub-progress"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(progressPct)}
                        >
                            <div className="sub-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </>
                )}

                <div className="sub-actions">
                    {status.isAdmin ? (
                        <div className="sub-actions-row">
                            {!isAndroidApp && (
                                <div className="sub-currency-toggle" aria-label={t('sub.currency.aria')}>
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
                            )}

                            <div style={{ marginTop: 8 }}>
                                <button className="sub-btn" onClick={onPay} disabled={loading}>
                                    {isAndroidApp
                                        ? t('sub.cta.buyAndroid')
                                        : currency === 'EUR'
                                            ? t('sub.cta.buyWebEur')
                                            : t('sub.cta.buyWebPln')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="sub-hint">{t('sub.hint.onlyAdmin')}</div>
                    )}
                </div>
            </div>
        );
    }

    // Banner (верхний)
    return (
        <div className={`subscription-banner ${isEnding ? 'sub-ending' : ''}`}>
            <div>
                <div className="sub-title">{title}</div>
            </div>

            <div className="sub-actions">
                {status.isAdmin ? (
                    <>
                        {!isAndroidApp && (
                            <div className="sub-currency-toggle" style={{ marginRight: 12 }} aria-label={t('sub.currency.aria')}>
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
                        )}

                        <button className="subscription-banner button" onClick={onPay} disabled={loading}>
                            {isAndroidApp
                                ? t('sub.cta.buyAndroid')
                                : currency === 'EUR'
                                    ? t('sub.cta.buyWebEur')
                                    : t('sub.cta.buyWebPln')}
                        </button>
                    </>
                ) : (
                    <div className="sub-hint">{t('sub.hint.onlyAdmin')}</div>
                )}
            </div>
        </div>
    );
}
