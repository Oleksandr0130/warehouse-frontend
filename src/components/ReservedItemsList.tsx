// src/components/ReservedItemsList.tsx
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ReservedItem } from '../types/ReservedItem';
import '../styles/ReservedItemList.css';
import QRScanner from './QRScanner';
import { useTranslation } from 'react-i18next';

interface ReservedItemsListProps {
    reservedItems: ReservedItem[];
    setReservedItems: (items: ReservedItem[]) => void;
    onScan: (orderNumber: string) => void;
    onReservationRemoved: (updatedItemId: string, returnedQuantity: number) => void;
}

const ReservedItemsList: React.FC<ReservedItemsListProps> = ({
                                                                 reservedItems,
                                                                 setReservedItems,
                                                                 onScan,
                                                                 onReservationRemoved,
                                                             }) => {
    const { t } = useTranslation();
    const [showScanner, setShowScanner] = useState(false);
    const [query, setQuery] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null); // id для модалки

    const filtered = useMemo(() => {
        const q = String(query ?? '').trim().toLowerCase();
        if (!q) return reservedItems;

        const contains = (v?: string | number | null) => String(v ?? '').toLowerCase().includes(q);

        return reservedItems.filter((item) =>
            contains(item.orderNumber) ||
            contains(item.name) ||
            contains(item.week) ||
            contains(item.quantity)
        );
    }, [reservedItems, query]);

    // ---- удаление резервации (устойчивое к 204/текстовым ответам)
    const handleDeleteConfirmed = async () => {
        if (!pendingDeleteId) return;
        const id = pendingDeleteId;
        setPendingDeleteId(null);

        try {
            const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });

            if (!res.ok) {
                const maybeText = await res.text().catch(() => '');
                throw new Error(maybeText || t('reservedList.errors.deleteFailed'));
            }

            const ct = res.headers.get('content-type') || '';

            if (res.status === 204 || !ct.includes('application/json')) {
                const newList = reservedItems.filter((r) => r.id !== id);
                setReservedItems(newList);
                toast.success(t('reservedList.toasts.deleted'));
                return;
            }

            const updated = await res.json();
            if (updated?.itemId != null && updated?.returnedQuantity != null) {
                onReservationRemoved(updated.itemId, updated.returnedQuantity);
            }
            const newList = reservedItems.filter((r) => r.id !== id);
            setReservedItems(newList);
            toast.success(t('reservedList.toasts.deleted'));
        } catch (err) {
            console.error(err);
            toast.error(t('reservedList.errors.deleteFailed'));
        }
    };

    return (
        <div className="reserved-list">
            <h3 className="reserved-title">{t('reservedList.title')}</h3>

            <div className="reserved-search">
                <input
                    className="reserved-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('reservedList.search.placeholder')}
                    aria-label={t('reservedList.search.aria')}
                />
                <span className="reserved-search-count">
                    {t('reservedList.search.count', {
                        filtered: filtered.length,
                        total: reservedItems.length,
                    })}
                </span>
            </div>

            {filtered.length === 0 ? (
                <p className="empty-message">{t('reservedList.empty')}</p>
            ) : (
                <ul className="reserved-ul">
                    {filtered.map((item) => (
                        <li key={item.id} className="reserved-item fade-in">
                            <div className="reserved-item-details">
                                <span className="reserved-name">{item.name}</span>
                                <span className="reserved-info">
                                    {t('reservedList.labels.order')} <b>{item.orderNumber}</b> |{' '}
                                    {t('reservedList.labels.week')} {item.week} |{' '}
                                    {t('reservedList.labels.amount')} {item.quantity}
                                </span>
                            </div>
                            <div className="reserved-item-actions">
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="reserved-btn scan"
                                >
                                    {t('reservedList.actions.completeViaQR')}
                                </button>
                                <button
                                    onClick={() => setPendingDeleteId(item.id)}
                                    className="reserved-btn delete"
                                >
                                    {t('reservedList.actions.remove')}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Модалка сканера QR */}
            {showScanner &&
                createPortal(
                    <div
                        className="ri-modal-overlay"
                        role="dialog"
                        aria-modal="true"
                        onClick={() => setShowScanner(false)}
                    >
                            <div className="ri-modal__title">
                                {t('reservedList.modal.title')}
                            </div>

                            <div className="ri-modal__viewport">
                                <QRScanner
                                    onScan={(orderNumber) => {
                                        setShowScanner(false);
                                        onScan(orderNumber);
                                        toast.success(
                                            t('reservedList.toasts.completedViaQR')
                                        );
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
                                    {t('reservedList.modal.close')}
                                </button>
                            </div>
                    </div>,
                    document.body
                )}

            {/* Красивая модалка подтверждения удаления резервации */}
            {pendingDeleteId &&
                createPortal(
                    <div
                        className="reserved-confirm-overlay"
                        role="dialog"
                        aria-modal="true"
                        onClick={() => setPendingDeleteId(null)}
                    >
                        <div
                            className="reserved-confirm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="reserved-confirm__icon">!</div>
                            <h2 className="reserved-confirm__title">
                                {t('reservedList.confirm.title', 'Delete reservation?')}
                            </h2>
                            <p className="reserved-confirm__text">
                                {t(
                                    'reservedList.confirm.delete',
                                    'Do you really want to delete this reservation?'
                                )}
                            </p>

                            <div className="reserved-confirm__actions">
                                <button
                                    type="button"
                                    className="reserved-confirm__btn reserved-confirm__btn--secondary"
                                    onClick={() => setPendingDeleteId(null)}
                                >
                                    {t('itemList.actions.cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="reserved-confirm__btn reserved-confirm__btn--danger"
                                    onClick={handleDeleteConfirmed}
                                >
                                    {t('reservedList.actions.remove')}
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
