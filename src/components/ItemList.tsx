import React from 'react';
import { Item } from '../types/Item';
import '../styles/ItemList.css';
interface ItemListProps {
    items: Item[];
    onScanAdd: (id: string) => void;
    onScanRemove: (id: string) => void;
}

const ItemList: React.FC<ItemListProps> = ({ items }) => {
    return (
        <div className="item-list">
            <h3>Warehouse Items</h3>
            {items.length === 0 ? (
                <p className="empty-message">No items found in inventory.</p>
            ) : (
                <ul className="item-list-ul">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className={`item-list-item ${
                                item.quantity <= 0
                                    ? 'item-low-stock'
                                    : 'item-green-stock'
                            }`}
                        >
                            <div className="item-details">
                                <strong>{item.name}</strong> (Available: {item.quantity})
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ItemList;