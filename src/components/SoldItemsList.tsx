import { useMemo, useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { SoldReservation } from '../types/SoldReservation';
import '../styles/SoldItemsList.css';

interface SoldItemsListProps {
    reservations: SoldReservation[];
}

function SoldItemsList({ reservations }: SoldItemsListProps) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return reservations;

        const contains = (v?: string) => (v ?? '').toLowerCase().includes(q);

        return reservations.filter((r) => {
            const dateISO = new Date(r.saleDate).toISOString().slice(0, 10); // YYYY-MM-DD
            const dateLocal = new Date(r.saleDate).toLocaleDateString();      // локальный формат
            return (
                contains(r.orderNumber) ||
                contains(r.itemName) ||
                contains(r.reservationWeek?.toString()) ||
                dateISO.includes(q) ||
                dateLocal.toLowerCase().includes(q)
            );
        });
    }, [reservations, query]);

    if (reservations.length === 0) {
        return <p className="empty-message">There are no reservations yet.</p>;
    }

    return (
        <div className="sold-items-list">
            <h2>Sold items</h2>

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
                <TransitionGroup component="ul" className="sold-list">
                    {filtered.map((reservation) => (
                        <CSSTransition key={reservation.id} classNames="fade" timeout={200}>
                            <li className="sold-item">
                                <span className="item-order-number">Order number: {reservation.orderNumber}</span>
                                <span className="item-name">Name: {reservation.itemName}</span>
                                <span className="item-quantity">Amount: {reservation.reservedQuantity}</span>
                                <span className="item-sold-week">Week: {reservation.reservationWeek}</span>
                                <span className="item-sale-date">
                  Date: {new Date(reservation.saleDate).toLocaleString()}
                </span>
                            </li>
                        </CSSTransition>
                    ))}
                </TransitionGroup>
            )}
        </div>
    );
}

export default SoldItemsList;
