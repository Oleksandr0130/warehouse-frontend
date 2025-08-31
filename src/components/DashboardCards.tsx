import React from 'react';
import '../styles/DashboardCards.css';

type Active = 'stock' | 'reserved' | 'qr';

type Props = {
    itemsCount: number;
    reservedCount: number;
    qrCount: number;
    active: Active;                    // <— кто подсвечен
    onGoStock: () => void;
    onGoReserved: () => void;
    onGoQRCodes: () => void;
};

const DashboardCards: React.FC<Props> = ({
                                             itemsCount, reservedCount, qrCount,
                                             active,
                                             onGoStock, onGoReserved, onGoQRCodes
                                         }) => {
    return (
        <div className="dash-cards">
            <button
                className={`dash-card ${active === 'stock' ? 'dash-card--active' : ''}`}
                onClick={onGoStock}
            >
                <div className="dash-card__icon">📦</div>
                <div className="dash-card__title">Stock</div>
                <div className="dash-card__subtitle">{itemsCount} Items</div>
            </button>

            <button
                className={`dash-card ${active === 'reserved' ? 'dash-card--active' : ''}`}
                onClick={onGoReserved}
            >
                <div className="dash-card__icon">🧾</div>
                <div className="dash-card__title">Reserved Items</div>
                <div className="dash-card__subtitle">{reservedCount} active</div>
            </button>

            <button
                className={`dash-card ${active === 'qr' ? 'dash-card--active' : ''}`}
                onClick={onGoQRCodes}
            >
                <div className="dash-card__icon">🔳</div>
                <div className="dash-card__title">QR Codes</div>
                <div className="dash-card__subtitle">{qrCount} generated</div>
            </button>
        </div>
    );
};

export default DashboardCards;
