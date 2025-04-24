import React, { useState } from 'react';
import { ReservedItem } from '../types/ReservedItem';
import '../styles/ReservedItemList.css';
import QRScanner from './QRScanner'; // Подключаем QR-считатель

interface ReservedItemsListProps {
    reservedItems: ReservedItem[]; // Список зарезервированных предметов
    onScan: (orderNumber: string) => void; // Метод для завершения резервации
    onWeekFilter: (week: string) => void; // Метод для фильтрации по неделе
    onShowAll: () => void; // Метод для отображения всех товаров
}

const ReservedItemsList: React.FC<ReservedItemsListProps> = ({
                                                                 reservedItems,
                                                                 onScan,
                                                                 onWeekFilter,
                                                                 onShowAll,
                                                             }) => {
    const [showScanner, setShowScanner] = useState(false);
    const [filterWeek, setFilterWeek] = useState(''); // Поле для ввода недели фильтрации

    const handleScanClose = () => {
        setShowScanner(false); // Закрыть сканер после завершения
    };

    const handleFilterSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (filterWeek.trim() === '') {
            alert('Введите корректное значение для недели.');
            return;
        }
        onWeekFilter(filterWeek); // Вызов метода фильтрации
    };

    const handleShowAll = () => {
        setFilterWeek(''); // Сбрасываем поле фильтрации
        onShowAll(); // Показываем все зарезервированные товары
    };

    return (
        <div className="reserved-items-list">
            <h3>Reserved Items</h3>

            {/* Форма для фильтрации по неделе */}
            <form onSubmit={handleFilterSubmit} className="filter-form">
                <label htmlFor="week-filter">Filter by Week:</label>
                <input
                    type="text"
                    id="week-filter"
                    placeholder="Enter week (e.g., Week 42)"
                    value={filterWeek}
                    onChange={(e) => setFilterWeek(e.target.value)}
                />
                <button type="submit" className="btn btn-filter">
                    Apply Filter
                </button>
                <button
                    type="button"
                    className="btn btn-check-all"
                    onClick={handleShowAll} // Обработчик сброса фильтрации
                >
                    Check All
                </button>
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
                        onScan(orderNumber); // Вызываем метод для завершения
                    }}
                    onClose={handleScanClose}
                />
            )}
        </div>
    );
};

export default ReservedItemsList;