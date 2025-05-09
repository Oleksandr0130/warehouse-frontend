import React, { useState } from 'react';
import { ReservedItem } from '../types/ReservedItem';
import '../styles/ReservedItemList.css';
import QRScanner from './QRScanner';
import api from '../api';

interface ReservedItemsListProps {
    reservedItems: ReservedItem[]; // Список зарезервированных предметов
    onScan: (orderNumber: string) => void; // Метод для завершения резервации
    onWeekFilter: (week: string) => void; // Метод для фильтрации по неделе
    onShowAll: () => void; // Метод для отображения всех товаров
    onReservationRemoved: (updatedItemId: string, returnedQuantity: number) => void; // Новый callback для обновления Warehouse Item
}

const ReservedItemsList: React.FC<ReservedItemsListProps> = ({
                                                                 reservedItems,
                                                                 onScan,
                                                                 onWeekFilter,
                                                                 onShowAll,
                                                                 onReservationRemoved,
                                                             }) => {
    const [showScanner, setShowScanner] = useState(false);
    const [filterWeek, setFilterWeek] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScanClose = () => {
        setShowScanner(false);
    };

    const handleFilterSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (filterWeek.trim() === '') {
            alert('Bitte geben Sie einen gültigen Wert für die Woche ein.');
            return;
        }
        onWeekFilter(filterWeek);
    };

    const handleShowAll = () => {
        setFilterWeek('');
        onShowAll();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Möchten Sie diese Reservierung wirklich löschen?')) return;

        try {
            // Выполняем DELETE запрос
            const response = await api.delete(`/reservations/${id}`);
            setMessage(response.data); // Вывод сообщения об успешном удалении
            setError(null);

            // Получение данных из ответа (например, возвращённое количество)
            const updatedReservation = response.data as {
                id: string;
                returnedQuantity: number;
                itemId: string;
            };
            const { returnedQuantity, itemId } = updatedReservation;

            // Вызываем callback для обновления Warehouse Item в App.tsx
            onReservationRemoved(itemId, returnedQuantity);

            // Удаляем резервацию из списка
            onShowAll();
        } catch (err) {
            setError('Das Löschen der Reservierung ist fehlgeschlagen.');
            setMessage(null);
            console.error(err);
        }
    };

    return (
        <div className="reserved-items-list">
            <h3>Reservierungen</h3>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

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
                    Alle auswählen
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
                                <button onClick={() => setShowScanner(true)} className="btn btn-scan">
                                    Reservierung per QR abschließen
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-delete">
                                    Entfernen
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* QR-считатель */}
            {showScanner && (
                <QRScanner
                    onScan={(orderNumber) => {
                        setShowScanner(false);
                        onScan(orderNumber);
                    }}
                    onClose={handleScanClose}
                />
            )}
        </div>
    );
};

export default ReservedItemsList;