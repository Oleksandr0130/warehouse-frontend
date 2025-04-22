import React, { useState, useEffect } from 'react';
import api from './api';
import ItemList from './components/ItemList';
import SoldItemsList from './components/SoldItemsList';
import AddItemForm from './components/AddItemForm';
import QRScanner from './components/QRScanner';
import { Item } from './types/Item';
import './styles/App.css';
import './App.css';

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scannerAction, setScannerAction] = useState<'add' | 'remove' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string>('inventory');
  const [sortCriteria, setSortCriteria] = useState<string>(''); // Критерий сортировки

  // Загрузка данных (учитывает сортировку)
  useEffect(() => {
    fetchItems(sortCriteria);
  }, [sortCriteria]);

  const fetchItems = async (sortCriteria?: string) => {
    try {
      setLoading(true);

      // Выбор эндпоинта: со сортировкой или без
      const endpoint = sortCriteria ? '/items/sorted' : '/items';

      const response = await api.get(endpoint, {
        params: sortCriteria ? { sortBy: sortCriteria } : {},
      });

      if (Array.isArray(response.data)) {
        setItems(response.data); // Устанавливаем полученные данные
      } else {
        console.error('Некорректный формат ответа:', response.data);
        alert('Ошибка: некорректный ответ от сервера');
      }
    } catch (error) {
      console.error('Ошибка при запросе данных:', error);
      alert('Ошибка при загрузке данных: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCriteria = event.target.value;
    setSortCriteria(selectedCriteria); // Установить критерий сортировки
  };

  const handleAddItem = async (item: Item) => {
    try {
      setLoading(true);
      await api.post('/items', item);
      await fetchItems(sortCriteria); // Обновляем список с учётом сортировки
    } catch (error) {
      console.error('Ошибка при добавлении товара:', error);
      alert('Не удалось добавить товар: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (id: string) => {
    setShowScanner(false);
    const quantity = prompt(
        `Enter quantity to ${scannerAction === 'add' ? 'add' : 'remove'}:`
    );

    if (!quantity || isNaN(Number(quantity))) return;

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      alert('Количество должно быть больше нуля');
      return;
    }

    if (scannerAction === 'remove') {
      const item = items.find(i => i.id === id);
      if (item && quantityNum > item.quantity) {
        alert(`Нельзя удалить больше, чем доступно (${item.quantity})`);
        return;
      }

      if (!confirm(`Удалить ${quantityNum} товаров из инвентаря?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      await api.put(`/items/${id}/${scannerAction}`, null, {
        params: { quantity: quantityNum },
      });
      await fetchItems(sortCriteria); // Обновляем с учетом сортировки
    } catch (error) {
      console.error('Ошибка при обновлении:', error);
      alert('Ошибка: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
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
          {loading && <div className="loading-overlay">Загрузка...</div>}
          <AddItemForm onAdd={handleAddItem} />

          <div className="sort-dropdown">
            <label htmlFor="sort-menu">Сортировать по:</label>
            <select
                id="sort-menu"
                value={sortCriteria}
                onChange={handleSortChange}
                className="sort-select"
            >
              <option value="">Default</option>
              <option value="name">Name</option>
              <option value="quantity">Quantity</option>
              <option value="sold">Sold</option>
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
              Сканировать для добавления
            </button>
            <button
                className="btn btn-remove"
                onClick={() => {
                  setShowScanner(true);
                  setScannerAction('remove');
                }}
                disabled={loading}
            >
              Сканировать для удаления
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