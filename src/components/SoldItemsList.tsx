import { Item } from '../types/Item';
import '../styles/SoldItemsList.css';

interface SoldItemsListProps {
    items: Item[];
}

function SoldItemsList({ items }: SoldItemsListProps) {
    const soldItems = items.filter((item) => item.sold && item.sold > 0);

    if (soldItems.length === 0) {
        return <p className="empty-message">No items have been sold yet.</p>;
    }

    return (
        <div className="sold-items-list">
            <h2>Sold Items</h2>
            <ul>
                {soldItems.map((item) => (
                    <li key={item.id} className="sold-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-sold">Sold: {item.sold}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SoldItemsList;