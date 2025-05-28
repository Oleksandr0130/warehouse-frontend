// import React, { useState } from 'react';
// import { Item } from '../types/Item';
// import '../styles/ReserveForm.css';
// import { toast} from "react-toastify";
// import 'react-toastify/dist/ReactToastify.css'
//
// interface ReserveFormProps {
//     items: Item[]; // Список предметов
//     onReserveComplete: () => void; // Функция для обновления списка резерваций
//     onUpdateItems: (itemId: string, reservedQuantity: number) => void; // Функция для обновления количества товаров
// }
//
// const ReserveForm: React.FC<ReserveFormProps> = ({
//                                                      items,
//                                                      onReserveComplete,
//                                                      onUpdateItems,
//                                                  }) => {
//     const [selectedItemId, setSelectedItemId] = useState<string>(''); // ID выбранного элемента
//     const [quantity, setQuantity] = useState<number>(1); // Количество
//     const [week, setWeek] = useState<string>(''); // Выбранная неделя
//     const [orderNumber, setOrderNumber] = useState<string>(''); // Заказ
//
//     const handleSubmit = async (event: React.FormEvent) => {
//         event.preventDefault();
//
//         // Проверка на заполненность полей
//         if (!selectedItemId || !week || quantity <= 0 || !orderNumber) {
//             toast.error('Bitte füllen Sie alle Felder korrekt aus.'); // Ошибка toast вместо alert
//             return;
//         }
//
//         const selectedItem = items.find((item) => item.id === selectedItemId);
//         if (!selectedItem) {
//             toast.error('Der ausgewählte Artikel wurde nicht gefunden.'); // Ошибка toast
//             return;
//         }
//
//         try {
//             // Отправка запроса на сервер для создания резервации
//             await fetch('/api/reservations', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     orderNumber,
//                     itemName: selectedItem.name,
//                     quantity,
//                     reservationWeek: week,
//                 }),
//             });
//
//             // Уменьшаем локальное количество предметов на складе
//             onUpdateItems(selectedItemId, quantity);
//
//             // Обновляем список резерваций
//             onReserveComplete();
//
//             // Уведомление об успехе через toast
//             toast.success('Reservierung erfolgreich erstellt!');
//
//             // Сбрасываем форму
//             setSelectedItemId('');
//             setQuantity(1);
//             setWeek('');
//             setOrderNumber('');
//         } catch (error) {
//             console.error('Fehler beim Erstellen der Reservierung:', error);
//
//             // Уведомление об ошибке через toast
//             toast.error('Fehler beim Erstellen der Reservierung.');
//         }
//     };
//
//     return (
//         <form onSubmit={handleSubmit} className="reserve-form">
//             <h3>Create a Reservation</h3>
//             <div className="form-group">
//                 <label htmlFor="item-select">Artikel auswählen:</label>
//                 <select
//                     id="item-select"
//                     value={selectedItemId}
//                     onChange={(e) => setSelectedItemId(e.target.value)}
//                 >
//                     <option value="">-- Wähle einen Artikel --</option>
//                     {items.map((item) => (
//                         <option key={item.id} value={item.id}>
//                             {item.name} (Available: {item.quantity})
//                         </option>
//                     ))}
//                 </select>
//             </div>
//
//             <div className="form-group">
//                 <label htmlFor="quantity-input">Menge:</label>
//                 <input
//                     type="number"
//                     id="quantity-input"
//                     min="1"
//                     value={quantity}
//                     onChange={(e) => setQuantity(Number(e.target.value))}
//                 />
//             </div>
//
//             <div className="form-group">
//                 <label htmlFor="week-input">Reservierung KW:</label>
//                 <input
//                     type="text"
//                     id="week-input"
//                     placeholder="KW eingeben (z. B. KW42)"
//                     value={week}
//                     onChange={(e) => setWeek(e.target.value)}
//                 />
//             </div>
//
//             <div className="form-group">
//                 <label htmlFor="order-number-input">Auftragsnummer:</label>
//                 <input
//                     type="text"
//                     id="order-number-input"
//                     placeholder="Auftragsnummer eingeben"
//                     value={orderNumber}
//                     onChange={(e) => setOrderNumber(e.target.value)}
//                 />
//             </div>
//
//             <button type="submit" className="btn btn-submit">
//                 Reservierung erstellen
//             </button>
//         </form>
//     );
// };
//
//
// export default ReserveForm;

import React, { useState } from 'react';
import { Item } from '../types/Item';
import '../styles/ReserveForm.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ReserveFormProps {
    items: Item[]; // Список товаров передаётся через пропсы
    onReserveComplete: () => void; // Функция для обновления списка резерваций
    onUpdateItems: (itemId: string, reservedQuantity: number) => void; // Функция для обновления количества товаров
}

const ReserveForm: React.FC<ReserveFormProps> = ({
                                                     items,
                                                     onReserveComplete,
                                                     onUpdateItems,
                                                 }) => {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null); // Выбранный товар
    const [quantity, setQuantity] = useState<number>(1); // Количество
    const [week, setWeek] = useState<string>(''); // Выбранная неделя
    const [orderNumber, setOrderNumber] = useState<string>(''); // Номер заказа
    const [searchQuery, setSearchQuery] = useState<string>(''); // Поле для поиска
    const [suggestions, setSuggestions] = useState<Item[]>([]); // Список подсказок

    // Локальный поиск внутри массива items
    const fetchSuggestions = (query: string) => {
        if (!query) {
            setSuggestions([]);
            return;
        }

        const lowerCaseQuery = query.toLowerCase();

        // Поиск в списке товаров (игнорирует регистр)
        const filteredItems = items.filter((item) =>
            item.name.toLowerCase().includes(lowerCaseQuery)
        );

        setSuggestions(filteredItems);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (value.length > 2) {
            fetchSuggestions(value); // Показываем подсказки только при вводе от 3 символов
        } else {
            setSuggestions([]); // Очищаем подсказки, если ввод слишком короткий
        }
    };

    const handleSelectItem = (item: Item) => {
        setSelectedItem(item); // Устанавливаем выбранный товар в состоянии
        setSearchQuery(item.name); // Показываем его название в поле поиска
        setSuggestions([]); // Закрываем выпадающий список
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        // Проверка на заполненность полей
        if (!selectedItem || !week || quantity <= 0 || !orderNumber) {
            toast.error('Заполните все поля корректно!'); // Ошибка через toast
            return;
        }

        try {
            // Здесь отправляется запрос на создание резервации
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

            // После успешного резервирования обновляем локальные данные
            onUpdateItems(selectedItem.id, quantity); // Уменьшаем количество товара локально
            onReserveComplete(); // Обновляем общий список резерваций

            toast.success('Резервация успешно создана!'); // Успешное уведомление через toast

            // Сбрасываем состояния формы
            setSelectedItem(null);
            setSearchQuery('');
            setQuantity(1);
            setWeek('');
            setOrderNumber('');
        } catch (error) {
            console.error('Ошибка создания резервации:', error);
            toast.error('Ошибка при создании резервации!');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="reserve-form">
            <h3>Erstellen einer Reservierung</h3>

            {/* Поле для поиска товаров */}
            <div className="form-group">
                <label htmlFor="item-input">Geben Sie den Produktnamen ein:</label>
                <input
                    type="text"
                    id="item-input"
                    placeholder="Produktnamen eingeben...(z. B. LK2)"
                    value={searchQuery}
                    onChange={handleInputChange}
                />
                {/* Выпадающий список с подсказками */}
                {suggestions.length > 0 && (
                    <ul className="suggestions">
                        {suggestions.map((item) => (
                            <li
                                key={item.id}
                                onClick={() => handleSelectItem(item)}
                            >
                                {item.name} (Verfügbar: {item.quantity})
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Поле для ввода количества */}
            <div className="form-group">
                <label htmlFor="quantity-input">Menge:</label>
                <input
                    type="number"
                    id="quantity-input"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                />
            </div>

            {/* Поле для ввода недели */}
            <div className="form-group">
                <label htmlFor="week-input">Reservierung KW: </label>
                <input
                    type="text"
                    id="week-input"
                    placeholder="KW eingeben (z. B. 42)"
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                />
            </div>

            {/* Поле для ввода номера заказа */}
            <div className="form-group">
                <label htmlFor="order-number-input">Auftragsnummer:</label>
                <input
                    type="text"
                    id="order-number-input"
                    placeholder="Auftragsnummer eingeben"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                />
            </div>

            {/* Кнопка отправки */}
            <button type="submit" className="btn btn-submit">
                Reservierung erstellen
            </button>
        </form>
    );
};

export default ReserveForm;