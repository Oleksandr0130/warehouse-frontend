import React, { useState } from 'react';
import { Item } from '../types/Item';
import '../styles/ReserveForm.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    // Автодополнение по названию
    const [inputValue, setInputValue] = useState<string>('');
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [suggestions, setSuggestions] = useState<Item[]>([]);

    // Поля формы
    const [quantity, setQuantity] = useState<number>(1);
    const [week, setWeek] = useState<string>('');
    const [orderNumber, setOrderNumber] = useState<string>('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (value.trim()) {
            const filtered = items.filter((it) =>
                it.name.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionSelect = (item: Item) => {
        setInputValue(item.name);
        setSelectedItemId(item.id);
        setSuggestions([]);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedItemId || !week || quantity <= 0 || !orderNumber) {
            toast.error(t('reserveForm.errors.fillAll'));
            return;
        }

        const selectedItem = items.find((it) => it.id === selectedItemId);
        if (!selectedItem) {
            toast.error(t('reserveForm.errors.notFound'));
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
            toast.success(t('reserveForm.toasts.created'));

            // reset
            setInputValue('');
            setSelectedItemId('');
            setQuantity(1);
            setWeek('');
            setOrderNumber('');
        } catch (error) {
            console.error('Error creating reservation:', error);
            toast.error(t('reserveForm.errors.createError'));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="reserve-form" aria-label={t('reserveForm.aria.form')}>
            <h3>{t('reserveForm.title')}</h3>

            <div className="form-group">
                <label htmlFor="item-input">{t('reserveForm.labels.item')}</label>
                <input
                    type="text"
                    id="item-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={t('reserveForm.placeholders.item')}
                    aria-autocomplete="list"
                    aria-controls="item-suggestions"
                    aria-expanded={suggestions.length > 0}
                />
                {suggestions.length > 0 && (
                    <ul id="item-suggestions" className="suggestions" role="listbox">
                        {suggestions.map((item) => (
                            <li
                                key={item.id}
                                role="option"
                                onClick={() => handleSuggestionSelect(item)}
                                tabIndex={0}
                            >
                                {item.name} ({t('reserveForm.suggestions.available', { qty: item.quantity })})
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="quantity-input">{t('reserveForm.labels.quantity')}</label>
                <input
                    type="number"
                    id="quantity-input"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                />
            </div>

            <div className="form-group">
                <label htmlFor="week-input">{t('reserveForm.labels.week')}</label>
                <input
                    type="text"
                    id="week-input"
                    placeholder={t('reserveForm.placeholders.week')}
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="order-number-input">{t('reserveForm.labels.order')}</label>
                <input
                    type="text"
                    id="order-number-input"
                    placeholder={t('reserveForm.placeholders.order')}
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                />
            </div>

            <button type="submit" className="btn btn-submit">
                {t('reserveForm.cta.submit')}
            </button>
        </form>
    );
};

export default ReserveForm;
