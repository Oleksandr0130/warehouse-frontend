import React from 'react';
import { Item } from '../types/Item';

interface ItemListProps {
    items: Item[];
    onScanAdd: (id: string) => void;
    onScanRemove: (id: string) => void;
}

const ItemList: React.FC<ItemListProps> = ({ items}) => {
    return (
        <div className="item-list">
            <h3>Warehouse Items</h3>
            {items.length === 0 ? (
                <p>No items found in inventory.</p>
            ) : (
                <ul>
                    {items.map((item) => (
                        <li key={item.id} className="item">
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