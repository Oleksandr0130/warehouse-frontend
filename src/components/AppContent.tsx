import React, { useState, useEffect } from 'react';
import '../App.css';
import ItemList from './ItemList';
import ReservedItemsList from './ReservedItemsList';
import AddItemForm from './AddItemForm';
import ReserveForm from './ReserveForm';
import SoldItemsList from './SoldItemsList';
import QRScanner from './QRScanner';
import FileViewer from './FileViewer';
import AboutApp from './AboutApp';
import DownloadExcelButton from './DownloadExelButton';
import { toast } from 'react-toastify';
import api from '../api';
import { Item } from '../types/Item';
import { ReservedItem } from '../types/ReservedItem';
import { ReservationData } from '../types/ReservationData';
import { SoldReservation } from '../types/SoldReservation';

interface AppContentProps {
    onLogout: () => void;
}

const AppContent: React.FC<AppContentProps> = ({ onLogout }) => {
    const [items, setItems] = useState<Item[]>([]);
    const [reservedItems, setReservedItems] = useState<ReservedItem[]>([]);
    const [soldReservations, setSoldReservations] = useState<SoldReservation[]>([]);
    const [showScanner, setShowScanner] = useState(false);
    const [scannerAction, setScannerAction] = useState<'add' | 'remove' | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeMenu, setActiveMenu] = useState<'inventory' | 'reserve' | 'sold' | 'files' | 'about'>('inventory');
    const [sortCriteria, setSortCriteria] = useState('');

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortCriteria, activeMenu]);

    const fetchData = () => {
        switch (activeMenu) {
            case 'inventory':
                fetchItems(sortCriteria);
                break;
            case 'reserve':
                fetchReservedItems();
                break;
            case 'sold':
                fetchSoldReservations();
                break;
        }
    };

    const fetchItems = async (sortBy?: string) => {
        setLoading(true);
        try {
            const endpoint = sortBy ? '/items/sorted' : '/items';
            const response = await api.get<Item[]>(endpoint, { params: sortBy ? { sortBy } : {} });
            setItems(response.data);
        } catch (err) {
            console.error(err);
            toast.error('Ошибка при загрузке товаров.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchReservedItems = async () => {
        setLoading(true);
        try {
            const response = await api.get<ReservationData[]>('/reservations');
            const data: ReservedItem[] = response.data
                .filter((it) => !it.isSold)
                .map((it) => ({
                    id: it.id?.toString() ?? '',
                    name: it.itemName ?? '',
                    quantity: it.reservedQuantity ?? 0,
                    orderNumber: it.orderNumber ?? '',
                    week: it.reservationWeek ?? '',
                }));
            setReservedItems(data);
        } catch (err) {
            console.error(err);
            toast.error('Ошибка при загрузке зарезервированных товаров.');
            setReservedItems([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSoldReservations = async () => {
        setLoading(true);
        try {
            const response = await api.get<SoldReservation[]>('/reservations/sold');
            setSoldReservations(response.data ?? []);
        } catch (err) {
            console.error(err);
            toast.error('Ошибка при загрузке проданных товаров.');
            setSoldReservations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (item: Item) => {
        setLoading(true);
        try {
            await api.post('/items', item);
            fetchItems(sortCriteria);
            toast.success('Товар успешно добавлен!');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка добавления товара.');
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (id: string) => {
        setShowScanner(false);
        if (!scannerAction) return;

        const input = prompt(
            `Введите количество для ${scannerAction === 'add' ? 'добавления' : 'удаления'}:`
        );
        const quantity = Number(input);
        if (!input || isNaN(quantity) || quantity <= 0) {
            toast.error('Введите корректное число.');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/items/${id}/${scannerAction}`, null, { params: { quantity } });
            toast.success(`Операция ${scannerAction} выполнена. Количество: ${quantity}`);
            fetchItems(sortCriteria);
        } catch (err) {
            console.error(err);
            toast.error('Ошибка при выполнении операции.');
        } finally {
            setLoading(false);
        }
    };

    const handleReservedItemScan = async (orderNumber: string) => {
        if (!orderNumber) {
            toast.error('Некорректный QR-код.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/reservations/scan', null, { params: { orderNumber } });
            fetchReservedItems();
            toast.success('Резерв обработан!');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка при обработке резерва.');
        } finally {
            setLoading(false);
        }
    };

    const handleReservationRemoved = (updatedItemId: string, returnedQuantity: number) => {
        setItems((prev) =>
            prev.map((it) =>
                it.id === updatedItemId ? { ...it, quantity: it.quantity + returnedQuantity } : it
            )
        );
        fetchReservedItems();
        fetchItems(sortCriteria);
        toast.success('Резервация удалена.');
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
                    <li
                        className={`menu-item ${activeMenu === 'about' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('about')}
                    >
                        Über die App
                    </li>
                    <li className="logout-item" onClick={onLogout}>
                        Abmelden
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
                                    setScannerAction('add');
                                    setShowScanner(true);
                                }}
                                disabled={loading}
                            >
                                Zum Hinzufügen scannen
                            </button>
                            <button
                                className="btn btn-remove"
                                onClick={() => {
                                    setScannerAction('remove');
                                    setShowScanner(true);
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
                                className="sort-select"
                                value={sortCriteria}
                                onChange={(e) => setSortCriteria(e.target.value)}
                            >
                                <option value="">Standard</option>
                                <option value="name">Name</option>
                                <option value="quantity">Menge</option>
                                <option value="sold">Verkauft</option>
                            </select>
                        </div>
                        <div className="excel-button-wrapper">
                            <DownloadExcelButton />
                        </div>
                        <ItemList
                            items={items}
                            onScanAdd={() => {
                                setScannerAction('add');
                                setShowScanner(true);
                            }}
                            onScanRemove={() => {
                                setScannerAction('remove');
                                setShowScanner(true);
                            }}
                        />
                    </>
                )}

                {activeMenu === 'reserve' && (
                    <>
                        <ReserveForm
                            items={items}
                            onReserveComplete={fetchReservedItems}
                            onUpdateItems={(id, qty) =>
                                setItems((prev) =>
                                    prev.map((it) => (it.id === id ? { ...it, quantity: it.quantity - qty } : it))
                                )
                            }
                        />
                        <ReservedItemsList
                            reservedItems={reservedItems}
                            setReservedItems={setReservedItems}
                            onScan={handleReservedItemScan}
                            onWeekFilter={async (week) => {
                                setLoading(true);
                                try {
                                    const response = await api.get<ReservationData[]>('/reservations/sorted', {
                                        params: { reservationWeek: week },
                                    });
                                    const data = response.data
                                        .filter((it) => !it.isSold)
                                        .map((it) => ({
                                            id: it.id?.toString() ?? '',
                                            name: it.itemName ?? '',
                                            quantity: it.reservedQuantity ?? 0,
                                            orderNumber: it.orderNumber ?? '',
                                            week: it.reservationWeek ?? '',
                                        }));
                                    setReservedItems(data);
                                    toast.success(`Отфильтровано по неделе ${week}`);
                                } catch (err) {
                                    console.error(err);
                                    toast.error('Не удалось отфильтровать.');
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
                {activeMenu === 'about' && <AboutApp />}
            </main>
        </div>
    );
};

export default AppContent;
