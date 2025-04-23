import React, { useState, useEffect } from 'react';
import api from './api';
import ItemList from './components/ItemList';
import ReservedItemsList from './components/ReservedItemsList';
import AddItemForm from './components/AddItemForm';
import ReserveForm from './components/ReserveForm';
import SoldItemsList from './components/SoldItemsList';
import QRScanner from './components/QRScanner';
import { Item } from './types/Item';
import { ReservedItem } from './types/ReservedItem';
import { ReservationData } from './types/ReservationData';
import './styles/App.css';
import './App.css';
import {AxiosError} from "axios";

function App() {
  // Основные состояния
  const [items, setItems] = useState<Item[]>([]);
  const [reservedItems, setReservedItems] = useState<ReservedItem[]>([]);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scannerAction, setScannerAction] = useState<'add' | 'remove' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<'inventory' | 'reserve' | 'sold'>('inventory');
  const [sortCriteria, setSortCriteria] = useState<string>('');

  // Загрузка данных при изменении сортировки
  useEffect(() => {
    fetchItems(sortCriteria);
    fetchReservedItems();
  }, [sortCriteria]);

  // Загрузка товаров
  const fetchItems = async (sortCriteria?: string) => {
    try {
      setLoading(true);
      const endpoint = sortCriteria ? '/items/sorted' : '/items';
      const response = await api.get(endpoint, {
        params: sortCriteria ? { sortBy: sortCriteria } : {},
      });
      setItems(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка зарезервированных товаров
  const fetchReservedItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservations');
      const data = response.data.map((item: ReservationData) => ({
        id: item.id?.toString() || '',
        name: item.itemName || '',
        quantity: item.reservedQuantity || 0,
        orderNumber: item.orderNumber || '',
        week: item.reservationWeek || '',
      }));
      setReservedItems(data);
    } catch (error) {
      console.error('Ошибка загрузки зарезервированных товаров:', error);
      setReservedItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Добавление нового товара
  const handleAddItem = async (item: Item) => {
    try {
      setLoading(true);
      await api.post('/items', item);
      fetchItems(sortCriteria);
    } catch (error) {
      console.error('Ошибка добавления товара:', error);
      alert('Не удалось добавить товар.');
    } finally {
      setLoading(false);
    }
  };

  // Обработка сканирования (добавление или удаление количества)
  const handleScan = async (id: string) => {
    setShowScanner(false);
    if (!scannerAction) return;

    const quantityStr = prompt(
        `Введите количество для ${scannerAction === 'add' ? 'добавления' : 'удаления'}:`
    );

    if (!quantityStr || isNaN(Number(quantityStr))) return;
    const quantity = parseInt(quantityStr);
    if (quantity <= 0) {
      alert('Количество должно быть больше 0.');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/items/${id}/${scannerAction}`, null, {
        params: { quantity },
      });
      fetchItems(sortCriteria);
    } catch (error) {
      console.error('Ошибка при обновлении:', error);
      alert('Не удалось обновить товар.');
    } finally {
      setLoading(false);
    }
  };

  // Сканирование QR-кода Reserved Items
  const handleReservedItemScan = async (orderNumber: string) => {
    try {
      if (!orderNumber || orderNumber.trim() === '') {
        alert('QR-код не содержит действительного номера заказа.');
        return;
      }

      setLoading(true);

      // Отправка orderNumber для завершения резервирования
      await api.post('/reservations/scan', null, {
        params: { orderNumber },
      });

      // Успешно завершено - обновляем состояние, удаляя элемент
      setReservedItems((prevItems) => prevItems.filter(item => item.orderNumber !== orderNumber));

      alert('Reservation processed successfully!');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error('Ошибка обработана Axios:', error.response?.data || error.message);
        alert(`Ошибка: ${error.response?.data?.message || 'Не удалось обработать QR-код.'}`);
      } else if (error instanceof Error) {
        console.error('Ошибка обработки QR-кода для резервированных предметов:', error.message);
        alert(`Ошибка: ${error.message}`);
      } else {
        console.error('Неизвестная ошибка:', error);
        alert('Произошла неизвестная ошибка.');
      }
    } finally {
      setLoading(false);
    }
  };





  // // Завершение резервации
  // const handleReserveComplete = async (id: string) => {
  //   try {
  //     await api.post(`/reservations/${id}/complete`);
  //     alert('Резервация завершена!');
  //     fetchReservedItems();
  //   } catch (error) {
  //     console.error('Ошибка завершения резервации:', error);
  //     alert('Не удалось завершить резервацию.');
  //   }
  // };

  // Изменение сортировки
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortCriteria(event.target.value);
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
                className={`menu-item ${activeMenu === 'reserve' ? 'active' : ''}`}
                onClick={() => setActiveMenu('reserve')}
            >
              Reserved Items
            </li>
            <li
                className={`menu-item ${activeMenu === 'sold' ? 'active' : ''}`}
                onClick={() => setActiveMenu('sold')}
            >
              Sold Items
            </li>
          </ul>
        </aside>
        <main className="app-main">
          {loading && <div className="loading-overlay">Загрузка...</div>}

          {activeMenu === 'inventory' && (
              <>
                <AddItemForm onAdd={handleAddItem} />

                <div className="scanner-buttons">
                  <button
                      className="btn btn-add"
                      onClick={() => {
                        setShowScanner(true);
                        setScannerAction('add');
                      }}
                      disabled={loading}
                  >
                    Scan to Add
                  </button>
                  <button
                      className="btn btn-remove"
                      onClick={() => {
                        setShowScanner(true);
                        setScannerAction('remove');
                      }}
                      disabled={loading}
                  >
                    Scan to Remove
                  </button>
                </div>
                {showScanner && (
                    <QRScanner
                        onScan={handleScan}
                        onClose={() => setShowScanner(false)}
                    />
                )}

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
                <ItemList
                    items={items}
                    onScanAdd={() => {
                      setShowScanner(true);
                      setScannerAction('add');
                    }}
                    onScanRemove={() => {
                      setShowScanner(true);
                      setScannerAction('remove');
                    }}
                />
              </>
          )}

          {activeMenu === 'reserve' && (
              <>
                <ReserveForm items={items} onReserveComplete={fetchReservedItems} />
                <ReservedItemsList
                    reservedItems={reservedItems}
                    onScan={handleReservedItemScan}
                />
              </>
          )}

          {activeMenu === 'sold' && <SoldItemsList items={items} />}
        </main>
      </div>
  );
}

export default App;