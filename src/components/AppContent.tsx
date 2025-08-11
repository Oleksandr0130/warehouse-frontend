import React, { useState, useEffect } from 'react';
import '../styles/AppContent.css'; // <-- отдельные стили ДЛЯ ЭТОГО ЭКРАНА
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
import Account from "./Account.tsx";

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
    const [activeMenu, setActiveMenu] = useState<'inventory' | 'reserve' | 'sold' | 'files' | 'about' | 'account'>('inventory');
    const [sortCriteria, setSortCriteria] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false); // <-- для гамбургера

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortCriteria, activeMenu]);

    // закрывать выдвижное меню при выборе пункта (на мобильных)
    useEffect(() => {
        setIsMenuOpen(false);
    }, [activeMenu]);

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
            toast.error('Error loading products.');
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
            toast.error('Error loading reserved items.');
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
            toast.error('Error loading sold items.');
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
            toast.success('Product added successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Error adding product.');
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (id: string) => {
        setShowScanner(false);
        if (!scannerAction) return;

        const input = prompt(`Enter quantity for ${scannerAction === 'add' ? 'add' : 'remove'}:`);
        const quantity = Number(input);
        if (!input || isNaN(quantity) || quantity <= 0) {
            toast.error('Please enter a valid number.');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/items/${id}/${scannerAction}`, null, { params: { quantity } });
            toast.success(`Operation ${scannerAction} completed. Quantity: ${quantity}`);
            fetchItems(sortCriteria);
        } catch (err) {
            console.error(err);
            toast.error('Operation error.');
        } finally {
            setLoading(false);
        }
    };

    const handleReservedItemScan = async (orderNumber: string) => {
        if (!orderNumber) {
            toast.error('Incorrect QR code.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/reservations/scan', null, { params: { orderNumber } });
            fetchReservedItems();
            toast.success('Reservation processed!');
        } catch (err) {
            console.error(err);
            toast.error('Error processing reserve.');
        } finally {
            setLoading(false);
        }
    };

    const handleReservationRemoved = (updatedItemId: string, returnedQuantity: number) => {
        setItems((prev) =>
            prev.map((it) => (it.id === updatedItemId ? { ...it, quantity: it.quantity + returnedQuantity } : it))
        );
        fetchReservedItems();
        fetchItems(sortCriteria);
        toast.success('Reservation deleted.');
    };

    return (
        <div className="app-container">
            {/* ВЕРХНЯЯ ПАНЕЛЬ С ГАМБУРГЕРОМ (видна на планшетах/телефонах) */}
            <header className="topbar">
                <button
                    className={`hamburger-btn ${isMenuOpen ? 'is-open' : ''}`}
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen(v => !v)}
                >
                    <span/><span/><span/>
                </button>
                <h1 className="topbar-title">FlowQR</h1>
            </header>

            {/* БОКОВОЕ МЕНЮ — фикс на десктопе, выезжающее на мобильных */}
            <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
                <h2 className="sidebar-title">FlowQR</h2>
                <ul className="sidebar-menu">
                    <li className={`menu-item ${activeMenu === 'inventory' ? 'active' : ''}`} onClick={() => setActiveMenu('inventory')}>
                        Inventory
                    </li>
                    <li className={`menu-item ${activeMenu === 'reserve' ? 'active' : ''}`} onClick={() => setActiveMenu('reserve')}>
                        Reserved items
                    </li>
                    <li className={`menu-item ${activeMenu === 'sold' ? 'active' : ''}`} onClick={() => setActiveMenu('sold')}>
                        Sold items
                    </li>
                    <li className={`menu-item ${activeMenu === 'files' ? 'active' : ''}`} onClick={() => setActiveMenu('files')}>
                        QR-Codes
                    </li>
                    <li className={`menu-item ${activeMenu === 'about' ? 'active' : ''}`} onClick={() => setActiveMenu('about')}>
                        About App
                    </li>
                    <li className={`menu-item ${activeMenu === 'account' ? 'active' : ''}`} onClick={() => setActiveMenu('account')}>
                        Personal account
                    </li>
                    <li className="logout-item" onClick={onLogout}>Log out</li>
                </ul>
            </aside>

            {/* затемнение при открытом меню на мобильных */}
            {isMenuOpen && <div className="backdrop" onClick={() => setIsMenuOpen(false)} />}

            <main className="app-main">
                {loading && <div className="loading-overlay">Loading...</div>}

                {activeMenu === 'inventory' && (
                    <>
                        <AddItemForm onAdd={handleAddItem} />
                        <div className="scanner-buttons">
                            <button
                                className="btn btn-add"
                                onClick={() => { setScannerAction('add'); setShowScanner(true); }}
                                disabled={loading}
                            >
                                Scan to add
                            </button>
                            <button
                                className="btn btn-remove"
                                onClick={() => { setScannerAction('remove'); setShowScanner(true); }}
                                disabled={loading}
                            >
                                Scan to remove
                            </button>
                        </div>
                        {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

                        <div className="sort-dropdown">
                            <label htmlFor="sort-menu">Sort by:</label>
                            <select
                                id="sort-menu"
                                className="sort-select"
                                value={sortCriteria}
                                onChange={(e) => setSortCriteria(e.target.value)}
                            >
                                <option value="">Standard</option>
                                <option value="name">Name</option>
                                <option value="quantity">Amount</option>
                                <option value="sold">Sold</option>
                            </select>
                        </div>

                        <div className="excel-button-wrapper">
                            <DownloadExcelButton />
                        </div>

                        <ItemList
                            items={items}
                            onScanAdd={() => { setScannerAction('add'); setShowScanner(true); }}
                            onScanRemove={() => { setScannerAction('remove'); setShowScanner(true); }}
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
                                    const response = await api.get<ReservationData[]>('/reservations/sorted', { params: { reservationWeek: week } });
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
                                    toast.success(`Sorted by week ${week}`);
                                } catch (err) {
                                    console.error(err);
                                    toast.error('Failed to filter.');
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
                {activeMenu === 'account' && <Account />}
            </main>
        </div>
    );
};

export default AppContent;
