import React, { useState } from 'react';
import { ReservedItem } from '../types/ReservedItem';
import '../styles/ReservedItemList.css';
import QRScanner from './QRScanner';
import api, {fetchReservationsByOrderPrefix} from '../api';
import {toast} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'
import {ReservationData} from "../types/ReservationData.ts";

interface ReservedItemsListProps {
    reservedItems: ReservedItem[]; // Список зарезервированных предметов
    setReservedItems: (items: ReservedItem[]) => void; // Метод для обновления списка резерваций
    onScan: (orderNumber: string) => void; // Метод для завершения резервации
    onWeekFilter: (week: string) => void; // Метод для фильтрации по неделе
    onShowAll: () => void; // Метод для отображения всех товаров
    onReservationRemoved: (updatedItemId: string, returnedQuantity: number) => void; // Новый callback для обновления Warehouse Item

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
    const [orderPrefix, setOrderPrefix] = useState(''); // Локальное состояние для фильтра префикса
    const [loading, setLoading] = useState(false); // Локальное состояние для загрузки


    // Метод для фильтрации по префиксу заказа
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
            // Преобразование данных для правильного сопоставления полей
            const mappedReservations = filteredReservations.map((item: ReservationData) => {
                return {
                    id: item.id?.toString() || '', // Идентификатор
                    name: item.itemName || 'Не указано', // Вывод названия товара (itemName -> name)
                    orderNumber: item.orderNumber || 'Не указан', // Номер заказа
                    week: item.reservationWeek || 'N/A', // Неделя (reservationWeek -> week)
                    quantity: item.reservedQuantity || 0, // Количество (reservedQuantity -> quantity)
                };
            });

            setReservedItems(mappedReservations); // Устанавливаем преобразованный список резерваций

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
        onShowAll(); // Загружаем полный список резерваций через родительский метод
        toast.success('Filter reset. Showing all reservations.');
    };



    const handleScanClose = () => {
        setShowScanner(false);
    };

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

    const handleDelete = async (id: string) => {
        if (!confirm('Do you really want to delete this reservation?')) return; // Подтверждение удаления

        try {
            console.log("Deleting a reservation with ID:", id);

            // Выполняем DELETE запрос
            const response = await api.delete(`/reservations/${id}`);

            // Получение данных из ответа
            const updatedReservation = response.data as {
                id: string;
                returnedQuantity: number;
                itemId: string;
            };
            const { returnedQuantity, itemId } = updatedReservation;

            // Вызываем callback для обновления в App.tsx
            onReservationRemoved(itemId, returnedQuantity);
            // Уведомление об успехе
            toast.success('Reservation successfully deleted.');

            // Обновление списка
            onShowAll();
        } catch (err) {
            toast.error('Deleting the reservation failed.');
            console.error(err);
        }
    };

    return (
        <div className="reserved-items-list">
            <h3>Reservations</h3>

            {/* Форма для фильтрации по префиксу заказа */}
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


            {/* Форма для фильтрации по неделе */}
            <form onSubmit={handleFilterSubmit} className="filter-form">
                <label htmlFor="week-filter">Filter by week:</label>
                <input
                    type="text"
                    id="week-filter"
                    placeholder="Enter week"
                    value={filterWeek}
                    onChange={(e) => setFilterWeek(e.target.value)}
                />
                <button type="submit" className="btn btn-filter">
                    Apply filter
                </button>
                <button type="button" className="btn btn-check-all" onClick={handleShowAll}>
                    Show all
                </button>
            </form>

            {/* Список зарезервированных предметов */}
            {reservedItems.length === 0 ? (
                <p>No reserved items found.</p>
            ) : (
                <ul>
                    {reservedItems.map((item) => (
                        <li key={item.id} className="reserved-item">
                            <div className="reserved-item-details">
                                <strong>{item.name}</strong> - Order number # {item.orderNumber}, Week: {item.week}, Amount: {item.quantity}
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

            {/* QR-считыватель */}
            {showScanner && (
                <QRScanner
                    onScan={(orderNumber) => {
                        setShowScanner(false);
                        onScan(orderNumber);
                        toast.success('Reservation via QR code successfully completed.');
                    }}
                    onClose={handleScanClose}
                />
            )}
        </div>
    );
};


export default ReservedItemsList;