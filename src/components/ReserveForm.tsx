import React, { useState } from 'react';
import { Item } from '../types/Item';
import '../styles/ReserveForm.css';

interface ReserveFormProps {
    items: Item[]; // Список предметов
    onReserveComplete: () => void; // Функция для обновления списка резерваций
    onUpdateItems: (itemId: string, reservedQuantity: number) => void; // Функция для обновления количества товаров
}

const ReserveForm: React.FC<ReserveFormProps> = ({
                                                     items,
                                                     onReserveComplete,
                                                     onUpdateItems,
                                                 }) => {
    const [selectedItemId, setSelectedItemId] = useState<string>(''); // ID выбранного элемента
    const [quantity, setQuantity] = useState<number>(1); // Количество
    const [week, setWeek] = useState<string>(''); // Выбранная неделя
    const [orderNumber, setOrderNumber] = useState<string>(''); // Заказ

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedItemId || !week || quantity <= 0 || !orderNumber) {
            alert('Please fill out all fields correctly.');
            return;
        }

        const selectedItem = items.find((item) => item.id === selectedItemId);
        if (!selectedItem) {
            alert('Selected item not found.');
            return;
        }

        try {
            // Отправка запроса на сервер для создания резервации
            await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderNumber,
                    itemName: selectedItem.name,
                    quantity,
                    reservationWeek: week,
                }),
            });

            // Уменьшаем локальное количество предметов на складе
            onUpdateItems(selectedItemId, quantity);

            // Запускаем обновление зарезервированных товаров
            onReserveComplete();

            alert('Reservation created successfully!');

            // Сбрасываем форму
            setSelectedItemId('');
            setQuantity(1);
            setWeek('');
            setOrderNumber('');
        } catch (error) {
            console.error('Error creating reservation:', error);
            alert('Failed to create reservation.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="reserve-form">
            <h3>Create a Reservation</h3>
            <div className="form-group">
                <label htmlFor="item-select">Select Item:</label>
                <select
                    id="item-select"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                >
                    <option value="">-- Choose an item --</option>
                    {items.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name} (Available: {item.quantity})
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="quantity-input">Quantity:</label>
                <input
                    type="number"
                    id="quantity-input"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                />
            </div>

            <div className="form-group">
                <label htmlFor="week-input">Reservation Week:</label>
                <input
                    type="text"
                    id="week-input"
                    placeholder="Enter week (e.g., Week 42)"
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="order-number-input">Order Number:</label>
                <input
                    type="text"
                    id="order-number-input"
                    placeholder="Enter Order Number"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                />
            </div>

            <button type="submit" className="btn btn-submit">
                Create Reservation
            </button>
        </form>
    );
};

export default ReserveForm;