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
        billing?: {
            /** (как было) */
            buy: (productOrPlanId: string) => void;

            /**
             * ✅ ДОБАВЛЕНО: вернуть список доступных базовых планов/офферов Google Play
             * Цены НЕ хардкодим — их должен вернуть APK из Google Play Billing.
             *
             * Ожидаемый формат: JSON.stringify(PlayPlan[])
             * Можно вернуть строку синхронно или Promise<string>.
             */
            getPlans?: () => string | Promise<string>;
        };
    }
}

interface Props {
    embedded?: boolean;
}

function isCurrency(v: unknown): v is Currency {
    return v === 'PLN' || v === 'EUR';
}

/** ✅ ДОБАВЛЕНО: модель плана, приходящая из APK (Google Play Billing) */
type PlayPlan = {
    /**
     * Уникальный ключ (например: "flowqr_standard:basic-monthly"
     * или offerToken/basePlanId — как решишь на стороне APK)
     */
    id: string;

    /** Заголовок (например "1 Month") */
    title: string;

    /** Цена уже локализована Google Play (например "€29.00") */
    price: string;

    /** Подзаголовок (например "Best for trying out") */
    subtitle?: string;

    /** Бейдж (например "Best Value") */
    badge?: string;

    /** Текст экономии (например "Save 30%") */
    savingsText?: string;

    /** Старая цена, если нужна (например "€348") */
    originalPrice?: string;
};

export default function SubscriptionBanner({ embedded }: Props) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<BillingStatusDto | null>(null);
    const [currency, setCurrency] = useState<Currency>('EUR');

    // APK (WebView с JS-мостом)
    const isAndroidApp = typeof window !== 'undefined' && !!window.billing;

    // ✅ ДОБАВЛЕНО: модалка выбора плана (только для Android/Google Play)
    const [modalOpen, setModalOpen] = useState(false);
    const [plansLoading, setPlansLoading] = useState(false);
    const [playPlans, setPlayPlans] = useState<PlayPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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

    /** ✅ ДОБАВЛЕНО: загрузка планов из APK (Google Play Billing) */
    const loadPlayPlans = async () => {
        if (!isAndroidApp) return;

        try {
            setPlansLoading(true);

            // Если APK ещё не обновлён и getPlans не существует — покажем 1 вариант
            if (!window.billing?.getPlans) {
                const fallback: PlayPlan[] = [
                    {
                        id: 'flowqr_standard',
                        title: t('sub.play.fallbackTitle', 'Subscription'),
                        price: '',
                        subtitle: t('sub.play.fallbackSubtitle', 'Continue in Google Play'),
                    },
                ];
                setPlayPlans(fallback);
                setSelectedPlanId(fallback[0].id);
                return;
            }

            const raw = await window.billing.getPlans();
            const parsed = JSON.parse(raw) as PlayPlan[];

            if (!Array.isArray(parsed) || parsed.length === 0) {
                throw new Error('No plans returned from Google Play');
            }

            setPlayPlans(parsed);
            setSelectedPlanId(parsed[0]?.id ?? null);
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setPlansLoading(false);
        }
    };

    /** Покупка: APK → Google Play; Web → Stripe */
    const onPay = async () => {
        try {
            setLoading(true);

            if (isAndroidApp) {
                // ✅ ИЗМЕНЕНО: Android — открываем модалку, грузим планы из Google Play
                setModalOpen(true);
                await loadPlayPlans();
                return;
            }

            // WEB: Stripe — как было (НЕ трогаем)
            const { checkoutUrl } = await createOneOffCheckout(currency);
            window.location.href = checkoutUrl;
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    /** ✅ ДОБАВЛЕНО: продолжить оплату в Google Play по выбранному плану */
    const continuePlayPayment = () => {
        if (!selectedPlanId) return;
        window.billing?.buy(selectedPlanId);
        setModalOpen(false);
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

    /** ✅ ДОБАВЛЕНО: рендер модалки */
    const renderModal = () => {
        if (!modalOpen || !isAndroidApp) return null;

        return (
            <div
                className="sb-modal-backdrop"
                role="dialog"
                aria-modal="true"
                aria-label={t('sub.play.modalTitle', 'Extend your subscription')}
                onMouseDown={(e) => {
                    // закрытие по клику на фон
                    if (e.target === e.currentTarget) setModalOpen(false);
                }}
            >
                <div className="sb-modal">
                    <button
                        className="sb-modal-close"
                        onClick={() => setModalOpen(false)}
                        aria-label={t('common.close', 'Close')}
                        type="button"
                    >
                        ×
                    </button>

                    <div className="sb-modal-title">{t('sub.play.modalTitle', 'Extend Your Subscription')}</div>
                    <div className="sb-modal-subtitle">
                        {t('sub.play.modalSubtitle', 'Choose a plan to extend your access')}
                    </div>

                    <div className="sb-modal-list" aria-busy={plansLoading}>
                        {plansLoading ? (
                            <div className="sb-modal-loading">{t('common.loading', 'Loading...')}</div>
                        ) : (
                            playPlans.map((p) => {
                                const selected = p.id === selectedPlanId;
                                return (
                                    <label key={p.id} className={`sb-plan ${selected ? 'selected' : ''}`}>
                                        <input
                                            className="sb-plan-radio"
                                            type="radio"
                                            name="playPlan"
                                            checked={selected}
                                            onChange={() => setSelectedPlanId(p.id)}
                                        />

                                        <div className="sb-plan-main">
                                            <div className="sb-plan-top">
                                                <div className="sb-plan-title">
                                                    {p.title}{' '}
                                                    {p.badge ? <span className="sb-plan-badge">{p.badge}</span> : null}
                                                </div>

                                                <div className="sb-plan-price">
                                                    {p.price}
                                                    {p.originalPrice ? (
                                                        <span className="sb-plan-original">{p.originalPrice}</span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="sb-plan-bottom">
                                                <div className="sb-plan-sub">{p.subtitle}</div>
                                                {p.savingsText ? (
                                                    <div className="sb-plan-save">{p.savingsText}</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })
                        )}
                    </div>

                    <button
                        className="sb-modal-cta"
                        onClick={continuePlayPayment}
                        disabled={plansLoading || !selectedPlanId}
                        type="button"
                    >
                        {t('sub.play.continue', 'Continue to Payment')}
                    </button>
                </div>
            </div>
        );
    };

    // Embedded (тёмная карточка + прогресс)
    if (embedded) {
        return (
            <>
                {renderModal()}

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
            </>
        );
    }

    // Banner (верхний)
    return (
        <>
            {renderModal()}

            <div className={`subscription-banner ${isEnding ? 'sub-ending' : ''}`}>
                <div>
                    <div className="sub-title">{title}</div>
                </div>

                <div className="sub-actions">
                    {status.isAdmin ? (
                        <>
                            {!isAndroidApp && (
                                <div
                                    className="sub-currency-toggle"
                                    style={{ marginRight: 12 }}
                                    aria-label={t('sub.currency.aria')}
                                >
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
        </>
    );
}
