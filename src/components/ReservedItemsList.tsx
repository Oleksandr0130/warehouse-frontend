import React, { useState } from 'react';
import { ReservedItem } from '../types/ReservedItem';
import '../styles/ReservedItemList.css';
import QRScanner from './QRScanner';
import api, {fetchReservationsByOrderPrefix} from '../api';
import {toast} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'

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
            toast.error('Введите корректный префикс заказа.');
            return;
        }

        try {
            setLoading(true);
            const filteredReservations = await fetchReservationsByOrderPrefix(orderPrefix);
            setReservedItems(filteredReservations);
            toast.success(`Auftragsnummer "${orderPrefix}" gefunden.`);
        } catch (error) {
            console.error('Ошибка фильтрации резерваций:', error);
            toast.error('Auftragsnummer nicht gefunden.');
        } finally {
            setLoading(false);
        }
    };

    const handleShowAllReservations = () => {
        setOrderPrefix('');
        onShowAll(); // Загружаем полный список резерваций через родительский метод
        toast.success('Фильтр сброшен. Показаны все резервации.');
    };



    const handleScanClose = () => {
        setShowScanner(false);
    };

    const handleFilterSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (filterWeek.trim() === '') {
            toast.error('Bitte geben Sie einen gültigen Wert für die Woche ein.');
            return;
        }
        onWeekFilter(filterWeek);
        toast.success(`Gefiltert nach Woche: ${filterWeek}`);
    };

    const handleShowAll = () => {
        setFilterWeek('');
        onShowAll();
        toast.success('Alle Artikel werden angezeigt.');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Möchten Sie diese Reservierung wirklich löschen?')) return; // Подтверждение удаления

        try {
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
            toast.success('Reservierung erfolgreich gelöscht.');

            // Обновление списка
            onShowAll();
        } catch (err) {
            toast.error('Das Löschen der Reservierung ist fehlgeschlagen.');
            console.error(err);
        }
    };

    return (
        <div className="reserved-items-list">
            <h3>Reservierungen</h3>

            {/* Форма для фильтрации по префиксу заказа */}
            <form onSubmit={handleFilterByOrderPrefix} className="filter-form">
                <label htmlFor="order-prefix">Filtern nach Auftragsnummer:</label>
                <input
                    type="text"
                    id="order-prefix"
                    placeholder="Geben Sie das Auftragsnummer ein (z. B. 2516024)"
                    value={orderPrefix}
                    onChange={(e) => setOrderPrefix(e.target.value)}
                    disabled={loading}
                />
                <div className="btn-group">
                    <button type="submit" className="btn btn-filter" disabled={loading}>
                        Anwenden
                    </button>
                    <button
                        type="button"
                        className="btn btn-check-all"
                        onClick={handleShowAllReservations}
                        disabled={loading}
                    >
                        Zurücksetzen
                    </button>
                </div>
            </form>


            {/* Форма для фильтрации по неделе */}
            <form onSubmit={handleFilterSubmit} className="filter-form">
                <label htmlFor="week-filter">Filtern nach Woche:</label>
                <input
                    type="text"
                    id="week-filter"
                    placeholder="Woche eingeben (z. B. KW42)"
                    value={filterWeek}
                    onChange={(e) => setFilterWeek(e.target.value)}
                />
                <button type="submit" className="btn btn-filter">
                    Filter anwenden
                </button>
                <button type="button" className="btn btn-check-all" onClick={handleShowAll}>
                    Alle anzeigen
                </button>
            </form>

            {/* Список зарезервированных предметов */}
            {reservedItems.length === 0 ? (
                <p>Keine reservierten Artikel gefunden.</p>
            ) : (
                <ul>
                    {reservedItems.map((item) => (
                        <li key={item.id} className="reserved-item">
                            <div className="reserved-item-details">
                                <strong>{item.name}</strong> - Auftragsnummer # {item.orderNumber}, KW: {item.week}, Menge: {item.quantity}
                            </div>
                            <div className="reserved-item-actions">
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="btn btn-scan"
                                >
                                    Reservierung per QR abschließen
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="btn btn-delete"
                                >
                                    Entfernen
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
                        toast.success('Reservierung über QR erfolgreich abgeschlossen.');
                    }}
                    onClose={handleScanClose}
                />
            )}
        </div>
    );
};


export default ReservedItemsList;