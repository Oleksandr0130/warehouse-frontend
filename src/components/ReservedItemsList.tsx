import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ReservedItem } from '../types/ReservedItem';
import { ReservationData } from '../types/ReservationData';
import '../styles/ReservedItemList.css';

import QRScanner from './QRScanner';
import api, { fetchReservationsByOrderPrefix } from '../api';

interface ReservedItemsListProps {
    reservedItems: ReservedItem[];
    setReservedItems: (items: ReservedItem[]) => void;
    onScan: (orderNumber: string) => void;                // завершить резервацию по QR
    onWeekFilter: (week: string) => void;                 // фильтрация по неделе
    onShowAll: () => void;                                // показать всё
    onReservationRemoved: (updatedItemId: string, returnedQuantity: number) => void;
}

const ReservedItemsList: React.FC<ReservedItemsListProps> = ({
                                                                 reservedItems,
                                                                 setReservedItems,
                                                                 onScan,
                                                                 onWeekFilter,
                                                                 onShowAll,
                                                                 onReservationRemoved,
                                                             }) => {
    const [showScanner, setShowScanner] = useState(false);
    const [filterWeek, setFilterWeek] = useState('');
    const [orderPrefix, setOrderPrefix] = useState('');
    const [loading, setLoading] = useState(false);

    // блокируем прокрутку под модалкой сканера
    useEffect(() => {
        if (showScanner) {
            document.body.classList.add('no-scroll-scanner');
        } else {
            document.body.classList.remove('no-scroll-scanner');
        }
        return () => document.body.classList.remove('no-scroll-scanner');
    }, [showScanner]);

    // ----- фильтр по номеру заказа (префикс)
    const handleFilterByOrderPrefix = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!orderPrefix.trim()) {
            toast.error('Please enter a valid order.');
            return;
        }

        try {
            setLoading(true);
            const filteredReservations = (await fetchReservationsByOrderPrefix(orderPrefix)).filter(
                (item) => !item.isSold
            );
            const mappedReservations = filteredReservations.map((item: ReservationData) => ({
                id: item.id?.toString() || '',
                name: item.itemName || 'N/A',
                orderNumber: item.orderNumber || 'N/A',
                week: item.reservationWeek || 'N/A',
                quantity: item.reservedQuantity || 0,
            }));
            setReservedItems(mappedReservations);
            toast.success(`Order number "${orderPrefix}" found.`);
        } catch (error) {
            console.error('Error filtering reservations:', error);
            toast.error('Order number not found.');
        } finally {
            setLoading(false);
        }
    };

    const handleShowAllReservations = () => {
        setOrderPrefix('');
        onShowAll();
        toast.success('Filter reset. Showing all reservations.');
    };

    // ----- фильтр по неделе
    const handleFilterSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (filterWeek.trim() === '') {
            toast.error('Please enter a valid value for the week.');
            return;
        }
        onWeekFilter(filterWeek);
        toast.success(`Filtered by week: ${filterWeek}`);
    };

    const handleShowAll = () => {
        setFilterWeek('');
        onShowAll();
        toast.success('All articles are displayed.');
    };

    // ----- удаление резервации
    const handleDelete = async (id: string) => {
        if (!confirm('Do you really want to delete this reservation?')) return;

        try {
            const response = await api.delete(`/reservations/${id}`);
            const updatedReservation = response.data as {
                id: string;
                returnedQuantity: number;
                itemId: string;
            };
            const { returnedQuantity, itemId } = updatedReservation;

            onReservationRemoved(itemId, returnedQuantity);
            toast.success('Reservation successfully deleted.');
            onShowAll();
        } catch (err) {
            toast.error('Deleting the reservation failed.');
            console.error(err);
        }
    };

    return (
        <div className="reserved-items-list">
            <h3>Reservations</h3>

            {/* Фильтр по номеру заказа */}
            <form onSubmit={handleFilterByOrderPrefix} className="filter-form">
                <label htmlFor="order-prefix">Filter by order number:</label>
                <input
                    type="text"
                    id="order-prefix"
                    placeholder="Enter the order number"
                    value={orderPrefix}
                    onChange={(e) => setOrderPrefix(e.target.value)}
                    disabled={loading}
                />
                <div className="btn-group">
                    <button type="submit" className="btn btn-filter" disabled={loading}>
                        Apply
                    </button>
                    <button
                        type="button"
                        className="btn btn-check-all"
                        onClick={handleShowAllReservations}
                        disabled={loading}
                    >
                        Reset
                    </button>
                </div>
            </form>

            {/* Фильтр по неделе */}
            <form onSubmit={handleFilterSubmit} className="filter-form">
                <label htmlFor="week-filter">Filter by week:</label>
                <input
                    type="text"
                    id="week-filter"
                    placeholder="Enter week"
                    value={filterWeek}
                    onChange={(e) => setFilterWeek(e.target.value)}
                />
                <button type="submit" className="btn btn-filter">Apply filter</button>
                <button type="button" className="btn btn-check-all" onClick={handleShowAll}>
                    Show all
                </button>
            </form>

            {/* Список резерваций */}
            {reservedItems.length === 0 ? (
                <p>No reserved items found.</p>
            ) : (
                <ul>
                    {reservedItems.map((item) => (
                        <li key={item.id} className="reserved-item">
                            <div className="reserved-item-details">
                                <strong>{item.name}</strong> — Order number # {item.orderNumber}, Week: {item.week}, Amount: {item.quantity}
                            </div>
                            <div className="reserved-item-actions">
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="btn btn-scan"
                                >
                                    Complete reservation via QR code
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="btn btn-delete"
                                >
                                    Remove
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* ==== МОДАЛКА СКАНЕРА (портал в body) ==== */}
            {showScanner &&
                createPortal(
                    <div
                        className="ri-scanner-modal"
                        role="dialog"
                        aria-modal="true"
                        onClick={() => setShowScanner(false)}
                    >
                        <button
                            className="ri-scanner-close"
                            aria-label="Close scanner"
                            onClick={() => setShowScanner(false)}
                            type="button"
                        >
                            ×
                        </button>
                        <div
                            className="ri-scanner-viewport"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <QRScanner
                                onScan={(orderNumber) => {
                                    setShowScanner(false);
                                    onScan(orderNumber);
                                    toast.success('Reservation via QR code successfully completed.');
                                }}
                                onClose={() => setShowScanner(false)}
                            />
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default ReservedItemsList;
