import { useState, useEffect } from 'react';
import api from './api';
import ItemList from './components/ItemList';
import SoldItemsList from './components/SoldItemsList';
import AddItemForm from './components/AddItemForm';
import QRScanner from './components/QRScanner';
import { Item } from './types/Item';
import './styles/App.css';
import './App.css'

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scannerAction, setScannerAction] = useState<'add' | 'remove' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string>('inventory');
  const [sortCriteria, setSortCriteria] = useState<string>('name');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/items');
      if (Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        alert('Ошибка при получении данных: Неверный формат ответа от сервера');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('Failed to fetch items: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (item: Item) => {
    try {
      setLoading(true);
      await api.post('/items', item);
      await fetchItems();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (id: string) => {
    setShowScanner(false);
    const quantity = prompt(`Enter quantity to ${scannerAction === 'add' ? 'add' : 'remove'}:`);

    if (!quantity || isNaN(Number(quantity))) return;

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      alert('Quantity must be positive');
      return;
    }

    if (scannerAction === 'remove') {
      const item = items.find(i => i.id === id);
      if (item && quantityNum > item.quantity) {
        alert(`Cannot remove more than available (${item.quantity})`);
        return;
      }

      if (!confirm(`Remove ${quantityNum} items from inventory?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      
      await api.put(`/items/${id}/${scannerAction}`, null, {
        params: { quantity: quantityNum },
      });
      
      await fetchItems();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sortItems = (criteria: string) => {
    const sortedItems = [...items];
    if (criteria === 'name') {
      sortedItems.sort((a, b) => a.name.localeCompare(b.name));
    } else if (criteria === 'quantity') {
      sortedItems.sort((a, b) => a.quantity - b.quantity);
    }
    setItems(sortedItems);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCriteria = event.target.value;
    setSortCriteria(selectedCriteria);
    sortItems(selectedCriteria);
  };

  return (
    <div className="app-container">
      <aside className="fixed-sidebar">
        <h2 className="sidebar-title">Warehouse QR</h2>
        <ul className="sidebar-menu">
          <li
            className={`menu-item ${activeMenu === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveMenu('inventory')}
          >
            Warehouse Inventory
          </li>
          <li
            className={`menu-item ${activeMenu === 'sold' ? 'active' : ''}`}
            onClick={() => setActiveMenu('sold')}
          >
            Sold Items
          </li>
          <li className="menu-item" onClick={() => alert('Print Reports Coming Soon!')}>
            Print Reports
          </li>
        </ul>
      </aside>

      <main className="app-main">
        {loading && <div className="loading-overlay">Loading...</div>}
        <AddItemForm onAdd={handleAddItem} />

        <div className="sort-dropdown">
          <label htmlFor="sort-menu">Sort Items By:</label>
          <select
            id="sort-menu"
            value={sortCriteria}
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="">Select...</option>
            <option value="name">Name</option>
            <option value="quantity">Quantity</option>
          </select>
        </div>

        <div className="scanner-buttons">
          <button
            className="btn btn-add"
            onClick={() => {
              setShowScanner(true);
              setScannerAction('add');
            }}
            disabled={loading}
          >
            Scan to Add Quantity
          </button>
          <button
            className="btn btn-remove"
            onClick={() => {
              setShowScanner(true);
              setScannerAction('remove');
            }}
            disabled={loading}
          >
            Scan to Remove Quantity
          </button>
        </div>
        {showScanner && <QRScanner onScan={handleScan} />}
        {activeMenu === 'inventory' && <ItemList items={items} />}
        {activeMenu === 'sold' && <SoldItemsList items={items} />}
      </main>
    </div>
  );
}

export default App;