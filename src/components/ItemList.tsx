// src/components/ItemList.tsx
import React, { useMemo, useState } from 'react';
import { Item } from '../types/Item';
import '../styles/ItemList.css';

interface ItemListProps {
    items: Item[];
    onDelete: (id: string) => void;
}

const ItemList: React.FC<ItemListProps> = ({ items, onDelete }) => {
    const [query, setQuery] = useState('');
    const [openId, setOpenId] = useState<string | null>(null); // раскрытие/скрытие

    const filtered = useMemo(() => {
        const q = String(query ?? '').trim().toLowerCase();
        if (!q) return items;
        const contains = (v?: string | number | null) => String(v ?? '').toLowerCase().includes(q);
        return items.filter(
            (it) =>
                contains(it.name) ||
                contains(it.quantity) ||
                contains(it.sold) ||
                contains(it.description) ||
                contains(it.price)
        );
    }, [items, query]); // базовую фильтрацию я сохранил и расширил на описание/цену, остальное без изменений. :contentReference[oaicite:4]{index=4}

    const toggle = (id: string) => {
        setOpenId(prev => (prev === id ? null : id));
    };

    return (
        <div className="item-list">
            <h3 className="item-list-title">Stock</h3>

            <div className="item-search">
                <input
                    className="item-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, available amount, sold, price, or description"
                />
                <span className="item-search-count">{filtered.length} / {items.length}</span>
            </div>

            {filtered.length === 0 ? (
                <p className="empty-message">No items match your search.</p>
            ) : (
                <ul className="item-list-ul">
                    {filtered.map((item) => {
                        const isOpen = openId === item.id;
                        const avatar = item.images?.[0];

                        return (
                            <li
                                key={item.id}
                                className={`item-list-item fade-in ${item.quantity <= 0 ? 'item-low-stock' : 'item-green-stock'}`}
                            >
                                <button className="row" onClick={() => toggle(item.id)} aria-expanded={isOpen}>
                                    <div className="avatar">
                                        {avatar ? <img src={avatar} alt={`${item.name} cover`} /> : <div className="avatar-placeholder" />}
                                    </div>

                                    <div className="item-details">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-quantity">Available: {item.quantity}</span>
                                        <span className="item-sold">Sold: {item.sold}</span>
                                        {typeof item.price === 'number' && item.currency && (
                                            <span className="item-price">
                        Price: {item.price.toFixed(2)} {item.currency}
                      </span>
                                        )}
                                    </div>

                                    <div className={`chevron ${isOpen ? 'up' : ''}`} aria-hidden />
                                </button>

                                <div className={`collapse ${isOpen ? 'open' : ''}`}>
                                    {(item.description || (item.images && item.images.length > 1) || typeof onDelete === 'function') ? (
                                        <div className="collapse-inner">
                                            {item.description && (
                                                <div className="desc">{item.description}</div>
                                            )}

                                            {item.images && item.images.length > 1 && (
                                                <div className="gallery">
                                                    {item.images.slice(1).map((src, i) => (
                                                        <img key={i} src={src} alt={`${item.name} ${i + 2}`} />
                                                    ))}
                                                </div>
                                            )}

                                            {onDelete && (
                                                <div className="actions-row">
                                                    <button
                                                        type="button"
                                                        className="btn-delete"
                                                        onClick={() => onDelete(item.id)}
                                                    >
                                                        Delete item
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="collapse-inner empty">No extra info.</div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default ItemList;
