import { useState, useEffect } from 'react';
// import api, { deleteQRCode } from './api';
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
// import { AxiosError } from 'axios';
import './styles/App.css';
import './App.css';
import { SoldReservation } from './types/SoldReservation.ts';
import { logout, validateTokens } from './types/AuthManager.ts';
import DownloadExcelButton from './components/DownloadExelButton.tsx';
import { toast } from 'react-toastify'; // Импортируем toast
import 'react-toastify/dist/ReactToastify.css';
import api from "./api.ts"; // Подключение стилей toast

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
  const [soldReservations, setSoldReservations] = useState<SoldReservation[]>([]);

  // Проверка токена при загрузке
  useEffect(() => {
    const initializeAuth = async () => {
      const isValid = await validateTokens(); // Проверка токенов через AuthManager
      if (isValid) {
        setIsAuthenticated(true);
        setAuthStage('confirmed');
        fetchData(); // Загружаем соответствующие данные
      } else {
        setIsAuthenticated(false);
      }
    };
    initializeAuth();
  }, []);

// Обновление данных при изменении activeMenu или sortCriteria
  useEffect(() => {
    fetchData();
  }, [sortCriteria, activeMenu]);

// Универсальная функция для загрузки данных
  const fetchData = () => {
    if (activeMenu === 'inventory') {
      fetchItems(sortCriteria);
    } else if (activeMenu === 'reserve') {
      fetchReservedItems();
    } else if (activeMenu === 'sold') {
      fetchSoldReservations();
    }
  };


  // // Проверка токена при загрузке
  // useEffect(() => {
  //   const initializeAuth = async () => {
  //     const isValid = await validateTokens(); // Проверка токенов через AuthManager
  //     if (isValid) {
  //       setIsAuthenticated(true);
  //       setAuthStage('confirmed');
  //       fetchData();
  //     } else {
  //       setIsAuthenticated(false);
  //     }
  //   };
  //   initializeAuth();
  // }, []);
  //
  // useEffect(() => {
  //   fetchItems(sortCriteria);
  //   fetchReservedItems();
  // }, [sortCriteria]);
  //
  // useEffect(() => {
  //   if (activeMenu === 'sold') {
  //     fetchSoldReservations(); // Вызов функции для загрузки данных
  //   }
  // }, [activeMenu]);
  //
  // const fetchData = () => {
  //   fetchItems(sortCriteria);
  //   fetchReservedItems();
  // };

  // Загрузка товаров
  const fetchItems = async (sortCriteria?: string) => {
    try {
      setLoading(true);
      const endpoint = sortCriteria ? '/items/sorted' : '/items';
      const response = await api.get(endpoint, {
        params: sortCriteria ? { sortBy: sortCriteria } : {},
      });
      setItems(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке товаров:', error);
      setItems([]);
      toast.error('Ошибка при загрузке списка товаров.');
    } finally {
      setLoading(false);
    }
  };


  // // Загрузка зарезервированных товаров
  // const fetchReservedItems = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await api.get('/reservations');
  //     const data = response.data.map((item: ReservationData) => ({
  //       id: item.id?.toString() || '',
  //       name: item.itemName || '',
  //       quantity: item.reservedQuantity || 0,
  //       orderNumber: item.orderNumber || '',
  //       week: item.reservationWeek || '',
  //     }));
  //     setReservedItems(data);
  //   } catch (error) {
  //     console.error('Ошибка загрузки зарезервированных товаров:', error);
  //     toast.error('Ошибка загрузки зарезервированных товаров.');
  //     setReservedItems([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchReservedItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/folders/reservation/qrcodes');
      const data = response.data.map((file: string) => ({
        id: file, // ID резервации
        qrCodeUrl: `/folders/reservation/${file}/qrcode` // Генерируем URL для QR-кода
      }));
      setReservedItems(data);
    } catch (error) {
      console.error('Ошибка загрузки зарезервированных товаров:', error);
      toast.error('Ошибка загрузки зарезервированных товаров.');
    } finally {
      setLoading(false);
    }
  };


  // Загрузка продаж
  const fetchSoldReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get<SoldReservation[]>('/reservations/sold');
      setSoldReservations(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки проданных резерваций:', error);
      toast.error('Ошибка при загрузке проданных товаров.');
    } finally {
      setLoading(false);
    }
  };

  // Обработка добавления товара
  const handleAddItem = async (item: Item) => {
    try {
      setLoading(true);
      await api.post('/items', item);
      fetchItems(sortCriteria);
      toast.success('Товар успешно добавлен!');
    } catch (error) {
      console.error('Ошибка добавления товара:', error);
      toast.error('Ошибка при добавлении товара.');
    } finally {
      setLoading(false);
    }
  };

  // // Обработка QR-кодов
  // const handleScan = async (id: string) => {
  //   setShowScanner(false);
  //   if (!scannerAction) return;
  //
  //   const quantityStr = prompt(`Введите количество для ${scannerAction === 'add' ? 'добавления' : 'удаления'}:`);
  //   if (!quantityStr || isNaN(Number(quantityStr))) {
  //     toast.error('Введите корректное числовое значение.');
  //     return;
  //   }
  //
  //   const quantity = parseInt(quantityStr);
  //   if (quantity <= 0) {
  //     toast.error('Количество должно быть больше 0.');
  //     return;
  //   }
  //
  //   try {
  //     setLoading(true);
  //     await api.put(`/items/${id}/${scannerAction}`, null, { params: { quantity } });
  //     toast.success(
  //         `Операция "${scannerAction === 'add' ? 'Добавление' : 'Удаление'}" успешно завершена. Количество: ${quantity}.`
  //     );
  //     fetchItems(sortCriteria);
  //   } catch (error) {
  //     console.error('Ошибка при выполнении операции:', error);
  //     toast.error('Ошибка при выполнении операции.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleScan = async (id: string) => {
    setShowScanner(false);
    if (!scannerAction) return;

    try {
      setLoading(true);
      // Воспользуемся эндпоинтом по ID
      const endpoint = scannerAction === 'add'
          ? `/folders/item/${id}/qrcode`
          : `/folders/reservation/${id}/qrcode`;

      const response = await api.get(endpoint, { responseType: 'arraybuffer' });

      // Преобразование файла QR-кода в Blob для загрузки
      const qrBlob = new Blob([response.data], { type: 'image/png' });
      const qrUrl = window.URL.createObjectURL(qrBlob);

      // Сохранение QR-кода (опционально)
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `qr-${id}.png`;
      link.click();

      toast.success(`QR-код успешно обработан для ${scannerAction === 'add' ? 'добавления' : 'удаления'}.`);
    } catch (error) {
      console.error('Ошибка при обработке QR-кода:', error);
      toast.error('Ошибка при обработке QR-кода.');
    } finally {
      setLoading(false);
    }
  };


  // Обработка сканирования для резерваций
  const handleReservedItemScan = async (orderNumber: string) => {
    try {
      if (!orderNumber) {
        toast.error('Некорректный QR-код.');
        return;
      }

      setLoading(true);
      await api.post('/reservations/scan', null, { params: { orderNumber } });
      fetchReservedItems();
      toast.success('Резерв успешно обработан!');
    } catch (error) {
      console.error('Ошибка обработки резервации:', error);
      toast.error('Не удалось обработать резерв.');
    } finally {
      setLoading(false);
    }
  };

  // Обработка удаления резервации
  const handleReservationRemoved = (updatedItemId: string, returnedQuantity: number) => {
    setItems((prevItems) =>
        prevItems.map((item) =>
            item.id === updatedItemId ? { ...item, quantity: item.quantity + returnedQuantity } : item
        )
    );
    fetchReservedItems();

    fetchItems(sortCriteria)

    toast.success('Резервация удалена.');
  };

  // Авторизация
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setAuthStage('confirmed');
    fetchData();
    toast.success('Вы успешно вошли в систему!');
  };

  // Logout
  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setAuthStage('login');
    toast.info('Вы вышли из системы.');
  };

  if (!isAuthenticated) {
    return (
        <div className="auth-container">
          {authStage === 'login' && (
              <>
                <Login onSuccess={handleAuthSuccess} />
                <p>
                  Neues Konto{' '}
                  <button onClick={() => setAuthStage('register')}>Registrieren</button>
                </p>
              </>
          )}
          {authStage === 'register' && (
              <>
                <Register onSuccess={() => setAuthStage('login')} />
                <p>
                  Hast du schon ein Konto? <button onClick={() => setAuthStage('login')}>Einloggen</button>
                </p>
              </>
          )}
          {authStage === 'confirmed' && <Confirmation />}
        </div>
    );
  }

  return (
      <div className="app-container">
        <aside className="fixed-sidebar">
          <h2 className="sidebar-title">Warehouse QR</h2>
          <ul className="sidebar-menu">
            <li
                className={`menu-item ${activeMenu === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveMenu('inventory')}
            >
              Lagerbestand
            </li>
            <li
                className={`menu-item ${activeMenu === 'reserve' ? 'active' : ''}`}
                onClick={() => setActiveMenu('reserve')}
            >
              Reservierte Artikel
            </li>
            <li
                className={`menu-item ${activeMenu === 'sold' ? 'active' : ''}`}
                onClick={() => setActiveMenu('sold')}
            >
              Verkaufte Artikel
            </li>
            <li
                className={`menu-item ${activeMenu === 'files' ? 'active' : ''}`}
                onClick={() => setActiveMenu('files')}
            >
              Dateibetrachter
            </li>
            <li className="menu-item logout-item" onClick={handleLogout}>
              Abmelden
            </li>
          </ul>
        </aside>
        <main className="app-main">
          {loading && <div className="loading-overlay">Laden...</div>}

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
                    Zum Hinzufügen scannen
                  </button>
                  <button
                      className="btn btn-remove"
                      onClick={() => {
                        setShowScanner(true);
                        setScannerAction('remove');
                      }}
                      disabled={loading}
                  >
                    Zum Entfernen scannen
                  </button>
                </div>
                {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

                <div className="sort-dropdown">
                  <label htmlFor="sort-menu">Sortieren nach:</label>
                  <select
                      id="sort-menu"
                      value={sortCriteria}
                      onChange={(e) => setSortCriteria(e.target.value)}
                      className="sort-select"
                  >
                    <option value="">Standard</option>
                    <option value="name">Name</option>
                    <option value="quantity">Menge</option>
                    <option value="sold">Verkauft</option>
                  </select>
                </div>
                <div style={{ margin: '20px 0' }}>
                  <DownloadExcelButton />
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
                    setReservedItems={setReservedItems} // Передаём метод для обновления списка
                    onScan={handleReservedItemScan}
                    onWeekFilter={async (week: string) => {
                      try {
                        setLoading(true);
                        const response = await api.get('/reservations/sorted', { params: { reservationWeek: week } });
                        const data = response.data.map((item: ReservationData) => ({
                          id: item.id?.toString() || '',
                          name: item.itemName || '',
                          quantity: item.reservedQuantity || 0,
                          orderNumber: item.orderNumber || '',
                          week: item.reservationWeek || '',
                        }));
                        setReservedItems(data);
                        toast.success(`Товары отсортированы по неделе: ${week}`);
                      } catch (error) {
                        console.error('Ошибка сортировки зарезервированных товаров:', error);
                        toast.error('Не удалось загрузить зарезервированные товары.');
                        setReservedItems([]);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onShowAll={fetchReservedItems}
                    onReservationRemoved={handleReservationRemoved}
                />
              </>
          )}

          {activeMenu === 'sold' && <SoldItemsList reservations={soldReservations} />}

          {activeMenu === 'files' && <FileViewer />}
        </main>
      </div>
  );
}

export default App;
