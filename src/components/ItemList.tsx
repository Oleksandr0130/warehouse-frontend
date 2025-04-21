import { Item } from '../types/Item';
import '../styles/ItemList.css';

interface ItemListProps {
  items: Item[];
}

function ItemList({ items }: ItemListProps) {
  if (!Array.isArray(items)) {
    console.error('Expected items to be an array, but got:', items);
    return <p className="error-message">Error: Items data is invalid</p>;
  }

  return (
    <div className="item-list">
      <h2>Warehouse Inventory</h2>
      {items.length === 0 ? (
        <p className="empty-message">Warehouse is empty.</p>
      ) : (
        <div className="item-grid">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-info">
                <span className="item-id"> ID: {item.id}</span>
                <span className="item-name">  {item.name}</span>
                <span className="item-quantity"> In stock: {item.quantity}</span>
                {/*<span className="item-sold"> Sold: {item.sold}</span>*/}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ItemList;