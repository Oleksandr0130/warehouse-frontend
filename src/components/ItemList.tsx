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
            <h3>Lager</h3>
            {items.length === 0 ? (
                <p className="empty-message">Keine Artikel im Inventar gefunden.</p>
            ) : (
                <ul className="item-list-ul">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className={`item-list-item ${
                                item.quantity <= 0 ? 'item-low-stock' : 'item-green-stock'
                            }`}
                        >
                            <div className="item-details">
                <span className="item-name">
                  <strong>{item.name}</strong>
                </span>
                                <span className="item-quantity">
                  Verfügbar: {item.quantity}
                </span>
                                <span className="item-sold">
                  Verkauft: {item.sold}
                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


export default ItemList;