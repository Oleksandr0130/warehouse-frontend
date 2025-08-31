// src/components/ReservedItemsList.tsx
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ReservedItem } from '../types/ReservedItem';
import '../styles/ReservedItemList.css';

import QRScanner from './QRScanner';

interface ReservedItemsListProps {
    reservedItems: ReservedItem[];
    setReservedItems: (items: ReservedItem[]) => void;
    onScan: (orderNumber: string) => void;
    onReservationRemoved: (updatedItemId: string, returnedQuantity: number) => void;
}

const ReservedItemsList: React.FC<ReservedItemsListProps> = ({
                                                                 reservedItems,
                                                                 onScan,
                                                                 onReservationRemoved,
                                                             }) => {
    const [showScanner, setShowScanner] = useState(false);
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = String(query ?? '').trim().toLowerCase();
        if (!q) return reservedItems;

        const contains = (v?: string | number | null) =>
            String(v ?? '').toLowerCase().includes(q);

        return reservedItems.filter(
            (item) =>
                contains(item.orderNumber) ||
                contains(item.name) ||
                contains(item.week) ||
                contains(item.quantity)
        );
    }, [reservedItems, query]);

    const handleDelete = async (id: string) => {
        if (!confirm('Do you really want to delete this reservation?')) return;
        try {
            const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete reservation');
            const updated = await res.json();
            onReservationRemoved(updated.itemId, updated.returnedQuantity);
            toast.success('Reservation successfully deleted.');
        } catch (err) {
            console.error(err);
            toast.error('Deleting the reservation failed.');
        }
    };

    return (
        <div className="reserved-list">
            <h3 className="reserved-title">Reservations</h3>

            <div className="reserved-search">
                <input
                    className="reserved-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by order number, name, week, or amount"
                />
                <span className="reserved-search-count">
          {filtered.length} / {reservedItems.length}
        </span>
            </div>

            {filtered.length === 0 ? (
                <p className="empty-message">No reserved items found.</p>
            ) : (
                <ul className="reserved-ul">
                    {filtered.map((item) => (
                        <li key={item.id} className="reserved-item fade-in">
                            <div className="reserved-item-details">
                                <span className="reserved-name">{item.name}</span>
                                <span className="reserved-info">
                  Order № <b>{item.orderNumber}</b> | Week: {item.week} | Amount: {item.quantity}
                </span>
                            </div>
                            <div className="reserved-item-actions">
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="reserved-btn scan"
                                >
                                    Complete via QR
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="reserved-btn delete"
                                >
                                    Remove
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {showScanner &&
                createPortal(
                    <div
                        className="ri-modal-overlay"
                        role="dialog"
                        aria-modal="true"
                        onClick={() => setShowScanner(false)}
                    >
                        <div className="ri-modal" onClick={(e) => e.stopPropagation()}>
                            <button
                                className="ri-modal__close"
                                aria-label="Close scanner"
                                onClick={() => setShowScanner(false)}
                                type="button"
                            >
                                ×
                            </button>

                            <div className="ri-modal__title">QR-Code Scanner</div>

                            <div className="ri-modal__viewport">
                                <QRScanner
                                    onScan={(orderNumber) => {
                                        setShowScanner(false);
                                        onScan(orderNumber);
                                        toast.success('Reservation via QR code successfully completed.');
                                    }}
                                    onClose={() => setShowScanner(false)}
                                />
                            </div>

                            <div className="ri-modal__actions">
                                <button
                                    className="ri-modal__btn"
                                    type="button"
                                    onClick={() => setShowScanner(false)}
                                >
                                    Close Scanner
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default ReservedItemsList;
