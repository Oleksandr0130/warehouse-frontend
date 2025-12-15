import { useEffect, useMemo, useState } from 'react';
import '../styles/SubscriptionBanner.css';
import {
    fetchBillingStatus,
    BillingStatusDto,
    getErrorMessage,

    // ✅ REQUIRED (добавишь в api.ts ниже)
    fetchBillingPlans,
    createCheckoutByPlan,
    BillingPlanDto,
} from '../api';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

declare global {
    interface Window {
        billing?: { buy: (basePlanId: string) => void }; // ✅ CHANGED: basePlanId (Google Play basePlanId)
    }
}

interface Props {
    embedded?: boolean;
}

/** ✅ NEW: вынесли модалку в отдельный компонент, чтобы не дублировать */
function PlansModal(props: {
    open: boolean;
    loading: boolean;
    plans: BillingPlanDto[];
    selectedPlanId: string | null;
    onSelect: (id: string) => void;
    onClose: () => void;
    onContinue: () => void;
    continuing: boolean;
    isAndroidApp: boolean;
}) {
    const {
        open,
        loading,
        plans,
        selectedPlanId,
        onSelect,
        onClose,
        onContinue,
        continuing,
        isAndroidApp,
    } = props;

    // ✅ NEW: ESC закрывает модалку
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    // ✅ NEW: блокируем скролл body пока модалка открыта
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="sb-modal-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
            <div className="sb-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="sb-modal-header">
                    <div>
                        <div className="sb-modal-title">Extend Your Subscription</div>
                        <div className="sb-modal-subtitle">Choose a plan to extend your access</div>
                    </div>
                    <button className="sb-modal-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className="sb-modal-body">
                    {loading ? (
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
                                        onClick={() => onSelect(p.id)}
                                    >
                                        <div className="sb-plan-left">
                                            <div className="sb-radio" aria-hidden="true">
                                                {active ? '●' : ''}
                                            </div>
                                            <div>
                                                <div className="sb-plan-title">
                                                    {p.title}
                                                    {p.badge ? <span className="sb-badge">{p.badge}</span> : null}
                                                </div>
                                                {p.subtitle ? <div className="sb-plan-sub">{p.subtitle}</div> : null}
                                            </div>
                                        </div>

                                        <div className="sb-plan-right">
                                            {/* ✅ Важно: цены НЕ хардкодим в фронте — только отображаем что дал бэк */}
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
                        onClick={onContinue}
                        disabled={continuing || loading || !selectedPlanId}
                    >
                        Continue to Payment
                    </button>

                    <div className="sb-provider-hint">
                        {isAndroidApp
                            ? 'Payment will be processed by Google Play.'
                            : 'Payment will be processed by Stripe.'}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SubscriptionBanner({ embedded }: Props) {
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false); // ✅ используется для Continue
    const [status, setStatus] = useState<BillingStatusDto | null>(null);

    // ✅ Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [plans, setPlans] = useState<BillingPlanDto[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    const isAndroidApp = typeof window !== 'undefined' && !!window.billing;

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
        return (status.daysLeft ?? 0) <= 3 && (status.status === 'TRIAL' || status.status === 'ACTIVE');
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

    // ✅ FIX: теперь модалка открывается и грузит планы 1 раз, без гонок/автозакрытия
    const openModal = async () => {
        try {
            setIsModalOpen(true);
            setPlansLoading(true);

            const list = await fetchBillingPlans(); // GET /billing/plans
            setPlans(list);

            const preferred =
                list.find((p) => (p.badge ?? '').toLowerCase().includes('best'))?.id ??
                list[0]?.id ??
                null;

            setSelectedPlanId(preferred);
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
            setIsModalOpen(false);
        } finally {
            setPlansLoading(false);
        }
    };

    const closeModal = () => setIsModalOpen(false);

    // ✅ FIX: Android -> window.billing.buy(basePlanId), Web -> Stripe checkout by planId
    const onContinueToPayment = async () => {
        if (!selectedPlanId) return;

        const selected = plans.find((p) => p.id === selectedPlanId);
        if (!selected) return;

        try {
            setLoading(true);

            if (isAndroidApp) {
                // externalId должен быть basePlanId: basic-monthly | basic-3months | basic-year
                const basePlanId = selected.externalId?.trim();
                if (!basePlanId) {
                    toast.error('Missing basePlanId (externalId) for Android plan');
                    return;
                }
                window.billing?.buy(basePlanId);
                return; // ✅ не закрываем модалку — пользователь увидит Play UI
            }

            // Web: бэк создаёт Checkout URL (логика на бэке, не во фронте)
            const { checkoutUrl } = await createCheckoutByPlan(selected.id);
            window.location.href = checkoutUrl;
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    if (!status) {
        return (
            <div className={embedded ? 'sub-card sub-skeleton' : 'subscription-banner sub-skeleton'}>
                <div className="sub-skel-line" />
                <div className="sub-skel-line short" />
            </div>
        );
    }

    // ===== Embedded card =====
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
                                <div style={{ marginTop: 8 }}>
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

                <PlansModal
                    open={isModalOpen}
                    loading={plansLoading}
                    plans={plans}
                    selectedPlanId={selectedPlanId}
                    onSelect={setSelectedPlanId}
                    onClose={closeModal}
                    onContinue={onContinueToPayment}
                    continuing={loading}
                    isAndroidApp={isAndroidApp}
                />
            </>
        );
    }

    // ===== Top banner =====
    return (
        <>
            <div className={`subscription-banner ${isEnding ? 'sub-ending' : ''}`}>
                <div>
                    <div className="sub-title">{title}</div>
                </div>

                <div className="sub-actions">
                    {status.isAdmin ? (
                        <button className="subscription-banner button" onClick={openModal} disabled={loading}>
                            Extend Subscription
                        </button>
                    ) : (
                        <div className="sub-hint">{t('sub.hint.onlyAdmin')}</div>
                    )}
                </div>
            </div>

            <PlansModal
                open={isModalOpen}
                loading={plansLoading}
                plans={plans}
                selectedPlanId={selectedPlanId}
                onSelect={setSelectedPlanId}
                onClose={closeModal}
                onContinue={onContinueToPayment}
                continuing={loading}
                isAndroidApp={isAndroidApp}
            />
        </>
    );
}
