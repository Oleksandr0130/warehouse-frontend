// src/components/ItemList.tsx
import React, { useMemo, useState } from 'react';
import { Item } from '../types/Item';
import '../styles/ItemList.css';

interface ItemListProps {
    items: Item[];
}

const ItemList: React.FC<ItemListProps> = ({ items }) => {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = String(query ?? '').trim().toLowerCase();
        if (!q) return items;

        const contains = (v?: string | number | null) => String(v ?? '').toLowerCase().includes(q);

        return items.filter(
            (it) => contains(it.name) || contains(it.quantity) || contains(it.sold)
        );
    }, [items, query]);

    return (
        <div className="item-list">
            <h3 className="item-list-title">Stock</h3>

            <div className="item-search">
                <input
                    className="item-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, available amount, or sold"
                />
                <span className="item-search-count">
          {filtered.length} / {items.length}
        </span>
            </div>

            {filtered.length === 0 ? (
                <p className="empty-message">No items match your search.</p>
            ) : (
                <ul className="item-list-ul">
                    {filtered.map((item) => (
                        <li
                            key={item.id}
                            className={`item-list-item fade-in ${
                                item.quantity <= 0 ? 'item-low-stock' : 'item-green-stock'
                            }`}
                        >
                            <div className="item-details">
                                <span className="item-name">{item.name}</span>
                                <span className="item-quantity">Available: {item.quantity}</span>
                                <span className="item-sold">Sold: {item.sold}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ItemList;
