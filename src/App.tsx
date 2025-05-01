import React, { useState, useEffect } from 'react';
import api from './api';
import ItemList from './components/ItemList';
import ReservedItemsList from './components/ReservedItemsList';
import AddItemForm from './components/AddItemForm';
import ReserveForm from './components/ReserveForm';
import SoldItemsList from './components/SoldItemsList';
import QRScanner from './components/QRScanner';
import FileViewer from './components/FileViewer';
import Register from './components/Register';
import Login from './components/Login';
import Confirmation from './components/Confirmation';
import { Item } from './types/Item';
import { ReservedItem } from './types/ReservedItem';
import { ReservationData } from './types/ReservationData';
import { AxiosError } from 'axios';
import './styles/App.css';
import './App.css';

function App() {
  // Управление состоянием режима авторизации
  const [authStage, setAuthStage] = useState<'login' | 'register' | 'confirmed'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Основные состояния
  const [items, setItems] = useState<Item[]>([]);
  const [reservedItems, setReservedItems] = useState<ReservedItem[]>([]);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scannerAction, setScannerAction] = useState<'add' | 'remove' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<'inventory' | 'reserve' | 'sold' | 'files'>('inventory');
  const [sortCriteria, setSortCriteria] = useState<string>('');

  // Проверка токена при загрузке
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setAuthStage('confirmed');
      fetchData();
    }
  }, []);

  useEffect(() => {
    fetchItems(sortCriteria);
    fetchReservedItems();
  }, [sortCriteria]);

  useEffect(() => {
    // Проверяем пункт меню и обновляем список товаров
    if (activeMenu === 'inventory' || activeMenu === 'sold') {
      fetchItems(); // Обновляем товары на складе при нажатии на "Warehouse Inventory"
    }
  }, [activeMenu]);

  const fetchData = () => {
    fetchItems(sortCriteria);
    fetchReservedItems();
  };

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

  // Обновленная функция по неделе для зарезервированных
  const fetchSortedReservedItemsByWeek = async (week: string) => {
    try {
      setLoading(true);
      const response = await api.get('/reservations/sorted', {
        params: { reservationWeek: week },
      });
      const data = response.data.map((item: ReservationData) => ({
        id: item.id?.toString() || '',
        name: item.itemName || '',
        quantity: item.reservedQuantity || 0,
        orderNumber: item.orderNumber || '',
        week: item.reservationWeek || '',
      }));
      setReservedItems(data);
    } catch (error) {
      console.error('Ошибка загрузки зарезервированных товаров по неделе:', error);
      alert('Не удалось загрузить зарезервированные товары для указанной недели.');
      setReservedItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Добавление товара
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

  // Обработка скана QR-кода
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

  // Обработка скана для резервирования
  const handleReservedItemScan = async (orderNumber: string) => {
    try {
      if (!orderNumber || orderNumber.trim() === '') {
        alert('QR-код не содержит действительного номера заказа.');
        return;
      }

      setLoading(true);
      await api.post('/reservations/scan', null, {
        params: { orderNumber },
      });

      setReservedItems((prevItems) =>
          prevItems.filter((item) => item.orderNumber !== orderNumber)
      );

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

  // Обработка изменения сортировки
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortCriteria(event.target.value);
  };

  // Обновление данных при выходе из резервирования
  const handleReservationRemoved = (updatedItemId: string, returnedQuantity: number) => {
    setItems(prevItems =>
        prevItems.map(item =>
            item.id === updatedItemId
                ? { ...item, quantity: item.quantity + returnedQuantity }
                : item
        )
    );
  };

  // Обработка выхода из системы
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setAuthStage('login');
  };

  // Обработка успешной авторизации
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setAuthStage('confirmed');
    fetchData();
  };

  // РЕНДЕРИМ форму авторизации
  if (!isAuthenticated) {
    return (
        <div className="auth-container">
          {authStage === 'login' && (
              <>
                <Login onSuccess={handleAuthSuccess} />
                <p>
                  Нет аккаунта?{' '}
                  <button onClick={() => setAuthStage('register')}>Регистрация</button>
                </p>
              </>
          )}
          {authStage === 'register' && (
              <>
                <Register onSuccess={() => setAuthStage('login')} />
                <p>
                  Уже есть аккаунт? <button onClick={() => setAuthStage('login')}>Войти</button>
                </p>
              </>
          )}
          {authStage === 'confirmed' && <Confirmation />}
        </div>
    );
  }

  // Основной интерфейс после входа
  return (
      <div className="app-container">
        {/* меню */}
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
            <li
                className={`menu-item ${activeMenu === 'files' ? 'active' : ''}`}
                onClick={() => setActiveMenu('files')}
            >
              File Viewer
            </li>
            <li
                className="menu-item logout-item"
                onClick={handleLogout}
            >
              LogOut
            </li>

          </ul>
        </aside>
        {/* основной контент */}
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
                    <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
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
                <ReserveForm
                    items={items}
                    onReserveComplete={fetchReservedItems}
                    onUpdateItems={(updatedItemId, reservedQuantity) => {
                      setItems((prevItems) =>
                          prevItems.map((item) =>
                              item.id === updatedItemId
                                  ? { ...item, quantity: item.quantity - reservedQuantity }
                                  : item
                          )
                      );
                    }}
                />
                <ReservedItemsList
                    reservedItems={reservedItems}
                    onScan={handleReservedItemScan}
                    onWeekFilter={fetchSortedReservedItemsByWeek}
                    onShowAll={fetchReservedItems}
                    onReservationRemoved={handleReservationRemoved}
                />
              </>
          )}

          {activeMenu === 'sold' && <SoldItemsList items={items} />}

          {activeMenu === 'files' && <FileViewer />}
        </main>
      </div>
  );
}

export default App;