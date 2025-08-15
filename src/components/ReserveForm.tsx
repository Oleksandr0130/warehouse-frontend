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
//
import React, { useState } from 'react';
import { Item } from '../types/Item';
import '../styles/ReserveForm.css';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface ReserveFormProps {
    items: Item[];
    onReserveComplete: () => void;
    onUpdateItems: (itemId: string, reservedQuantity: number) => void;
}

const ReserveForm: React.FC<ReserveFormProps> = ({
                                                     items,
                                                     onReserveComplete,
                                                     onUpdateItems,
                                                 }) => {
    const [inputValue, setInputValue] = useState<string>(''); // Для ввода имени товара
    const [selectedItemId, setSelectedItemId] = useState<string>(''); // ID выбранного товара
    const [suggestions, setSuggestions] = useState<Item[]>([]); // Массив подсказок

    const [quantity, setQuantity] = useState<number>(1);
    const [week, setWeek] = useState<string>('');
    const [orderNumber, setOrderNumber] = useState<string>('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // Фильтруем список товаров для подсказок
        if (value.trim()) {
            const filteredItems = items.filter(item =>
                item.name.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filteredItems);
        } else {
            setSuggestions([]); // Если поле пустое, сбрасываем подсказки
        }
    };

    const handleSuggestionSelect = (item: Item) => {
        setInputValue(item.name); // Устанавливаем имя товара в поле ввода
        setSelectedItemId(item.id); // Сохраняем ID выбранного товара
        setSuggestions([]); // Сбрасываем список подсказок
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedItemId || !week || quantity <= 0 || !orderNumber) {
            toast.error('Please fill in all fields correctly.');
            return;
        }

        const selectedItem = items.find(item => item.id === selectedItemId);
        if (!selectedItem) {
            toast.error('The selected article was not found.');
            return;
        }

        try {
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

            onUpdateItems(selectedItemId, quantity);
            onReserveComplete();
            toast.success('Reservation successfully created!');

            setInputValue('');
            setSelectedItemId('');
            setQuantity(1);
            setWeek('');
            setOrderNumber('');
        } catch (error) {
            console.error('Error creating reservation:', error);
            toast.error('Error creating reservation.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="reserve-form">
            <h3>Create a Reservation</h3>
            <div className="form-group">
                <label htmlFor="item-input">Select or enter item:</label>
                <input
                    type="text"
                    id="item-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Enter article name"
                />
                {suggestions.length > 0 && (
                    <ul className="suggestions">
                        {suggestions.map(item => (
                            <li key={item.id} onClick={() => handleSuggestionSelect(item)}>
                                {item.name} (Available: {item.quantity})
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="quantity-input">Amount:</label>
                <input
                    type="number"
                    id="quantity-input"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                />
            </div>

            <div className="form-group">
                <label htmlFor="week-input">Reservation week:</label>
                <input
                    type="text"
                    id="week-input"
                    placeholder="Enter week number"
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="order-number-input">Order number:</label>
                <input
                    type="text"
                    id="order-number-input"
                    placeholder="Enter order number"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                />
            </div>

            <button type="submit" className="btn btn-submit">
                Create reservation
            </button>
        </form>
    );
};

export default ReserveForm;