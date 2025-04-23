import React, { useState } from 'react';
import { ReservedItem } from '../types/ReservedItem';
import '../styles/ReservedItemList.css';
import QRScanner from './QRScanner'; // Подключаем QR-считатель

interface ReservedItemsListProps {
    reservedItems: ReservedItem[];
    onScan: (orderNumber: string) => void; // Метод для обработки QR-кода (завершение)
}

const ReservedItemsList: React.FC<ReservedItemsListProps> = ({ reservedItems, onScan }) => {
    const [showScanner, setShowScanner] = useState(false);

    const handleScanClose = () => {
        setShowScanner(false); // Скрыть сканер после завершения
    };

    return (
        <div className="reserved-items-list">
            <h3>Reserved Items</h3>
            {reservedItems.length === 0 ? (
                <p>No reserved items found.</p>
            ) : (
                <ul>
                    {reservedItems.map((item) => (
                        <li key={item.id}>
                            <strong>{item.name}</strong> - Order # {item.orderNumber}, Week:{' '}
                            {item.week}, Quantity: {item.quantity}
                            <button
                                onClick={() => setShowScanner(true)} // Открываем сканер QR Code
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
                        onScan(orderNumber); // Вызываем обработчик завершения резервации через QR
                    }}
                    onClose={handleScanClose}
                />
            )}
        </div>
    );
};

export default ReservedItemsList;