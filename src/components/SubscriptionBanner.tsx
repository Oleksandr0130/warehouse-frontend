import { useEffect, useMemo, useState } from 'react';
import '../styles/SubscriptionBanner.css';
import {
    fetchBillingStatus,
    BillingStatusDto,
    Currency,
    getErrorMessage,
    // ✅ ADDED:
    fetchBillingPlans,
    createCheckoutByPlan,
    BillingPlanDto,
} from '../api';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

declare global {
    interface Window {
        billing?: { buy: (externalId: string) => void }; // ✅ CHANGED: generic externalId
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

    // Валюта нужна только для web one-off/stripe, но если ты перейдёшь на planId — можно убрать позже
    const [currency, setCurrency] = useState<Currency>('EUR');

    // ✅ ADDED: modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [plans, setPlans] = useState<BillingPlanDto[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    const isAndroidApp = typeof window !== 'undefined' && !!window.billing;

    const load = async () => {
        try {
            const s = await fetchBillingStatus();
            setStatus(s);

            if (!isAndroidApp) {
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

    const progressPct = useMemo(() => {
        if (!status || (status.status !== 'TRIAL' && status.status !== 'ACTIVE')) return 0;
        const daysLeft = typeof status.daysLeft === 'number' ? status.daysLeft : 0;
        const base = 30;
        return Math.max(0, Math.min(100, (daysLeft / base) * 100));
    }, [status]);

    // ✅ ADDED: open modal & load plans from backend (no hardcode)
    const openModal = async () => {
        try {
            setIsModalOpen(true);
            setPlansLoading(true);

            const list = await fetchBillingPlans(); // GET /billing/plans
            setPlans(list);

            // preselect (best value / first)
            const preferred = list.find(p => p.badge?.toLowerCase().includes('best'))?.id ?? list[0]?.id ?? null;
            setSelectedPlanId(preferred);
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
            setIsModalOpen(false);
        } finally {
            setPlansLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    // ✅ ADDED: pay action based on selected plan
    const onContinueToPayment = async () => {
        if (!selectedPlanId) return;

        const selected = plans.find(p => p.id === selectedPlanId);
        if (!selected) return;

        try {
            setLoading(true);

            // Android → native Google Play billing (APK decides price/offer in Play Console)
            if (isAndroidApp) {
                if (!selected.externalId) {
                    toast.error('Missing externalId for Android billing plan');
                    return;
                }
                window.billing?.buy(selected.externalId);
                return;
            }

            // Web → backend creates Stripe Checkout based on planId (no plan logic on frontend)
            const { checkoutUrl } = await createCheckoutByPlan(selected.id);
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

    // Embedded card (as before)
    if (embedded) {
        return (
            <>
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

                            <div className="sub-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPct)}>
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
                                            <input type="radio" name="currency" value="EUR" checked={currency === 'EUR'} onChange={() => setCurrency('EUR')} />
                                            EUR
                                        </label>
                                        <label style={{ marginLeft: 12 }}>
                                            <input type="radio" name="currency" value="PLN" checked={currency === 'PLN'} onChange={() => setCurrency('PLN')} />
                                            PLN
                                        </label>
                                    </div>
                                )}

                                <div style={{ marginTop: 8 }}>
                                    {/* ✅ CHANGED: button opens modal */}
                                    <button className="sub-btn" onClick={openModal} disabled={loading}>
                                        {t('Extend Subscription')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="sub-hint">{t('sub.hint.onlyAdmin')}</div>
                        )}
                    </div>
                </div>

                {/* ✅ ADDED: modal */}
                {isModalOpen && (
                    <div className="sb-modal-overlay" onMouseDown={closeModal}>
                        <div className="sb-modal" onMouseDown={(e) => e.stopPropagation()}>
                            <div className="sb-modal-header">
                                <div>
                                    <div className="sb-modal-title">Extend Your Subscription</div>
                                    <div className="sb-modal-subtitle">Choose a plan to extend your access</div>
                                </div>
                                <button className="sb-modal-close" onClick={closeModal} aria-label="Close">×</button>
                            </div>

                            <div className="sb-modal-body">
                                {plansLoading ? (
                                    <div className="sb-modal-loading">Loading plans…</div>
                                ) : plans.length === 0 ? (
                                    <div className="sb-modal-empty">No plans available.</div>
                                ) : (
                                    <div className="sb-plan-list">
                                        {plans.map((p) => {
                                            const active = p.id === selectedPlanId;
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className={`sb-plan ${active ? 'active' : ''}`}
                                                    onClick={() => setSelectedPlanId(p.id)}
                                                >
                                                    <div className="sb-plan-left">
                                                        <div className="sb-radio" aria-hidden="true">{active ? '●' : ''}</div>
                                                        <div>
                                                            <div className="sb-plan-title">
                                                                {p.title}
                                                                {p.badge ? <span className="sb-badge">{p.badge}</span> : null}
                                                            </div>
                                                            {p.subtitle ? <div className="sb-plan-sub">{p.subtitle}</div> : null}
                                                        </div>
                                                    </div>

                                                    <div className="sb-plan-right">
                                                        <div className="sb-plan-price">{p.priceText}</div>
                                                        {p.oldPriceText ? <div className="sb-plan-old">{p.oldPriceText}</div> : null}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <button
                                    className="sb-continue"
                                    onClick={onContinueToPayment}
                                    disabled={loading || plansLoading || !selectedPlanId}
                                >
                                    Continue to Payment
                                </button>

                                <div className="sb-provider-hint">
                                    {isAndroidApp ? 'Payment will be processed by Google Play.' : 'Payment will be processed by Stripe.'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Top banner (light)
    return (
        <>
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
                                        <input type="radio" name="currency" value="EUR" checked={currency === 'EUR'} onChange={() => setCurrency('EUR')} />
                                        EUR
                                    </label>
                                    <label style={{ marginLeft: 12 }}>
                                        <input type="radio" name="currency" value="PLN" checked={currency === 'PLN'} onChange={() => setCurrency('PLN')} />
                                        PLN
                                    </label>
                                </div>
                            )}

                            {/* ✅ CHANGED: open modal */}
                            <button className="subscription-banner button" onClick={openModal} disabled={loading}>
                                Extend Subscription
                            </button>
                        </>
                    ) : (
                        <div className="sub-hint">{t('sub.hint.onlyAdmin')}</div>
                    )}
                </div>
            </div>

            {/* ✅ ADDED: same modal for banner */}
            {isModalOpen && (
                <div className="sb-modal-overlay" onMouseDown={closeModal}>
                    <div className="sb-modal" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="sb-modal-header">
                            <div>
                                <div className="sb-modal-title">Extend Your Subscription</div>
                                <div className="sb-modal-subtitle">Choose a plan to extend your access</div>
                            </div>
                            <button className="sb-modal-close" onClick={closeModal} aria-label="Close">×</button>
                        </div>

                        <div className="sb-modal-body">
                            {plansLoading ? (
                                <div className="sb-modal-loading">Loading plans…</div>
                            ) : plans.length === 0 ? (
                                <div className="sb-modal-empty">No plans available.</div>
                            ) : (
                                <div className="sb-plan-list">
                                    {plans.map((p) => {
                                        const active = p.id === selectedPlanId;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                className={`sb-plan ${active ? 'active' : ''}`}
                                                onClick={() => setSelectedPlanId(p.id)}
                                            >
                                                <div className="sb-plan-left">
                                                    <div className="sb-radio" aria-hidden="true">{active ? '●' : ''}</div>
                                                    <div>
                                                        <div className="sb-plan-title">
                                                            {p.title}
                                                            {p.badge ? <span className="sb-badge">{p.badge}</span> : null}
                                                        </div>
                                                        {p.subtitle ? <div className="sb-plan-sub">{p.subtitle}</div> : null}
                                                    </div>
                                                </div>

                                                <div className="sb-plan-right">
                                                    <div className="sb-plan-price">{p.priceText}</div>
                                                    {p.oldPriceText ? <div className="sb-plan-old">{p.oldPriceText}</div> : null}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <button
                                className="sb-continue"
                                onClick={onContinueToPayment}
                                disabled={loading || plansLoading || !selectedPlanId}
                            >
                                Continue to Payment
                            </button>

                            <div className="sb-provider-hint">
                                {isAndroidApp ? 'Payment will be processed by Google Play.' : 'Payment will be processed by Stripe.'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
