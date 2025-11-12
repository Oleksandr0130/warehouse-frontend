import React from 'react';
import '../styles/DashboardCards.css';
import { useTranslation } from 'react-i18next';

type Active = 'stock' | 'reserved' | 'qr';

type Props = {
    itemsCount: number;
    reservedCount: number;
    qrCount: number;
    active: Active;
    onGoStock: () => void;
    onGoReserved: () => void;
    onGoQRCodes: () => void;
};

const DashboardCards: React.FC<Props> = ({
                                             itemsCount, reservedCount, qrCount,
                                             active,
                                             onGoStock, onGoReserved, onGoQRCodes
                                         }) => {
    const { t } = useTranslation();

    return (
        <div className="dash-cards">
            <button
                className={`dash-card ${active === 'stock' ? 'dash-card--active' : ''}`}
                onClick={onGoStock}
            >
                <div className="dash-card__icon">📦</div>
                <div className="dash-card__title">{t('dashboard.stock.title')}</div>
                <div className="dash-card__subtitle">
                    {t('dashboard.stock.subtitle', { count: itemsCount })}
                </div>
            </button>

            <button
                className={`dash-card ${active === 'reserved' ? 'dash-card--active' : ''}`}
                onClick={onGoReserved}
            >
                <div className="dash-card__icon">🧾</div>
                <div className="dash-card__title">{t('dashboard.reserved.title')}</div>
                <div className="dash-card__subtitle">
                    {t('dashboard.reserved.subtitle', { count: reservedCount })}
                </div>
            </button>

            <button
                className={`dash-card ${active === 'qr' ? 'dash-card--active' : ''}`}
                onClick={onGoQRCodes}
            >
                <div className="dash-card__icon">🔳</div>
                <div className="dash-card__title">{t('dashboard.qr.title')}</div>
                <div className="dash-card__subtitle">
                    {t('dashboard.qr.subtitle', { count: qrCount })}
                </div>
            </button>
        </div>
    );
};

export default DashboardCards;
