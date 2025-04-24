import React, { useState } from 'react';
import { ReservedItem } from '../types/ReservedItem';
import '../styles/ReservedItemList.css';
import QRScanner from './QRScanner'; // Подключаем QR-считатель

interface ReservedItemsListProps {
    reservedItems: ReservedItem[]; // Список зарезервированных предметов
    onScan: (orderNumber: string) => void; // Метод для завершения резервации
    onWeekFilter: (week: string) => void; // Метод для фильтрации по неделе (новый проп)
}

const ReservedItemsList: React.FC<ReservedItemsListProps> = ({ reservedItems, onScan, onWeekFilter }) => {
    const [showScanner, setShowScanner] = useState(false);
    const [filterWeek, setFilterWeek] = useState(''); // Поле для ввода недели фильтрации

    const handleScanClose = () => {
        setShowScanner(false);
    };

    const handleFilterSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (filterWeek.trim() === '') {
            alert('Введите корректное значение для недели.');
            return;
        }
        onWeekFilter(filterWeek); // Вызов функции фильтрации, переданной через пропы
    };

    return (
        <div className="reserved-items-list">
            <h3>Reserved Items</h3>

            {/* Фильтрация по неделе */}
            <form onSubmit={handleFilterSubmit} className="filter-form">
                <label htmlFor="week-filter">Filter by Week:</label>
                <input
                    type="text"
                    id="week-filter"
                    placeholder="Enter week (e.g., Week 42)"
                    value={filterWeek}
                    onChange={(e) => setFilterWeek(e.target.value)}
                />
                <button type="submit" className="btn btn-filter">Apply Filter</button>
            </form>

            {/* Список зарезервированных предметов */}
            {reservedItems.length === 0 ? (
                <p>No reserved items found.</p>
            ) : (
                <ul>
                    {reservedItems.map((item) => (
                        <li key={item.id}>
                            <strong>{item.name}</strong> - Order # {item.orderNumber}, Week: {item.week}, Quantity: {item.quantity}
                            <button
                                onClick={() => setShowScanner(true)}
                                className="btn btn-scan"
                            >
                                Complete Reservation via QR
                            </button>
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