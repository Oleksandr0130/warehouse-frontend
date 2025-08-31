import React from 'react';
import '../styles/DashboardCards.css';

type Props = {
    itemsCount: number;
    reservedCount: number;
    qrCount: number;
    onGoStock: () => void;
    onGoReserved: () => void;
    onGoQRCodes: () => void;
};

const DashboardCards: React.FC<Props> = ({
                                             itemsCount, reservedCount, qrCount,
                                             onGoStock, onGoReserved, onGoQRCodes
                                         }) => {
    return (
        <div className="dash-cards">
            <button className="dash-card dash-card--primary" onClick={onGoStock}>
                <div className="dash-card__icon">📦</div>
                <div className="dash-card__title">Stock</div>
                <div className="dash-card__subtitle">{itemsCount} Items</div>
            </button>

            <button className="dash-card" onClick={onGoReserved}>
                <div className="dash-card__icon">🧾</div>
                <div className="dash-card__title">Reserved Items</div>
                <div className="dash-card__subtitle">{reservedCount} active</div>
            </button>

            <button className="dash-card" onClick={onGoQRCodes}>
                <div className="dash-card__icon">🔳</div>
                <div className="dash-card__title">QR Codes</div>
                <div className="dash-card__subtitle">{qrCount} generated</div>
            </button>
        </div>
    );
};

export default DashboardCards;
