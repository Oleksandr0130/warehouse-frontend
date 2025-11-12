import { useMemo, useState, useEffect } from 'react';
import { SoldReservation } from '../types/SoldReservation';
import '../styles/SoldItemsList.css';
import { useTranslation } from 'react-i18next';

interface SoldItemsListProps {
    reservations: SoldReservation[];
}

const toSafeDate = (value: unknown): Date | null => {
    const d = new Date(value as any);
    return isNaN(d.getTime()) ? null : d;
};

function SoldItemsList({ reservations }: SoldItemsListProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = String(query ?? '').trim().toLowerCase();
        if (!q) return reservations;

        const contains = (v?: string | number | null) => String(v ?? '').toLowerCase().includes(q);

        return reservations.filter((res) => {
            const d = toSafeDate(res.saleDate);
            const dateISO = d ? d.toISOString().slice(0, 10) : '';
            const dateLocalLower = d ? d.toLocaleDateString().toLowerCase() : '';
            return (
                contains(res.orderNumber) ||
                contains(res.itemName) ||
                contains(res.reservationWeek) ||
                dateISO.includes(q) ||
                dateLocalLower.includes(q)
            );
        });
    }, [reservations, query]);

    useEffect(() => {
        // Патч: принудительно растягиваем фон на весь экран для старых WebView
        const appContainer = document.querySelector('.app-container') as HTMLElement | null;
        if (appContainer) {
            appContainer.style.minHeight = `${window.innerHeight}px`;
        }
    }, []);

    if (reservations.length === 0) {
        return <p className="empty-message">{t('sold.emptyAll')}</p>;
    }

    return (
        <div className="sold-items-list">
            <h2 className="sold-title">{t('sold.title')}</h2>

            <div className="sold-search">
                <input
                    className="sold-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('sold.search.placeholder')}
                    aria-label={t('sold.search.aria')}
                />
                <span className="sold-search-count">
          {t('sold.search.count', { filtered: filtered.length, total: reservations.length })}
        </span>
            </div>

            {filtered.length === 0 ? (
                <p className="empty-message">{t('sold.emptyFiltered')}</p>
            ) : (
                <ul className="sold-list">
                    {filtered.map((reservation) => {
                        const d = toSafeDate(reservation.saleDate);
                        const saleDateLabel = d ? d.toLocaleString() : '—';
                        return (
                            <li key={reservation.id ?? reservation.orderNumber} className="sold-item fade-in">
                                <div className="sold-item-header">
                  <span className="sold-order">
                    {t('sold.labels.order')} {reservation.orderNumber}
                  </span>
                                    <span className="sold-date">{saleDateLabel}</span>
                                </div>
                                <div className="sold-item-body">
                                    <span className="sold-name">{reservation.itemName}</span>
                                    <span className="sold-qty">
                    {t('sold.labels.amount')} {reservation.reservedQuantity}
                  </span>
                                    <span className="sold-week">
                    {t('sold.labels.week')} {reservation.reservationWeek}
                  </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default SoldItemsList;
