// src/components/SoldItemsList.tsx
import { useMemo, useState } from 'react';
import { SoldReservation } from '../types/SoldReservation';
import '../styles/SoldItemsList.css';

interface SoldItemsListProps {
    reservations: SoldReservation[];
}

const toSafeDate = (value: unknown): Date | null => {
    const d = new Date(value as any);
    return isNaN(d.getTime()) ? null : d;
};

function SoldItemsList({ reservations }: SoldItemsListProps) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = String(query ?? '').trim().toLowerCase();
        if (!q) return reservations;

        const contains = (v?: string | number | null) =>
            String(v ?? '').toLowerCase().includes(q);

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

    if (reservations.length === 0) {
        return <p className="empty-message">There are no reservations yet.</p>;
    }

    return (
        <div className="sold-items-list">
            <h2 className="sold-title">Sold items</h2>

            <div className="sold-search">
                <input
                    className="sold-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by order number, name, week, or date (e.g. 2025-08-23)"
                />
                <span className="sold-search-count">
          {filtered.length} / {reservations.length}
        </span>
            </div>

            {filtered.length === 0 ? (
                <p className="empty-message">No sold items match your search.</p>
            ) : (
                <ul className="sold-list">
                    {filtered.map((reservation) => {
                        const d = toSafeDate(reservation.saleDate);
                        const saleDateLabel = d ? d.toLocaleString() : '—';
                        return (
                            <li key={reservation.id ?? reservation.orderNumber} className="sold-item fade-in">
                                <div className="sold-item-header">
                                    <span className="sold-order">Order № {reservation.orderNumber}</span>
                                    <span className="sold-date">{saleDateLabel}</span>
                                </div>
                                <div className="sold-item-body">
                                    <span className="sold-name">{reservation.itemName}</span>
                                    <span className="sold-qty">Amount: {reservation.reservedQuantity}</span>
                                    <span className="sold-week">Week: {reservation.reservationWeek}</span>
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
