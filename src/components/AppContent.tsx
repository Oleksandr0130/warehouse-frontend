// src/components/AppContent.tsx
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import '../styles/AppContent.css';
import '../styles/CreateReservationPage.css';
import '../styles/CreateItemPage.css';

import ItemList from './ItemList';
import ReservedItemsList from './ReservedItemsList';
import AddItemForm from './AddItemForm';
import ReserveForm from './ReserveForm';
import SoldItemsList from './SoldItemsList';
import QRScanner from './QRScanner';
import FileViewer from './FileViewer';
import DownloadExcelButton from './DownloadExelButton';

import { toast } from 'react-toastify';
import api from '../api';
import { Item } from '../types/Item';
import { ReservedItem } from '../types/ReservedItem';
import { ReservationData } from '../types/ReservationData';
import { SoldReservation } from '../types/SoldReservation';

type MenuKey =
    | 'inventory'
    | 'createItem'
    | 'reserve'
    | 'createReservation'
    | 'sold'
    | 'files'
    | 'route';

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
    const [activeMenu, setActiveMenu] = useState<MenuKey>('inventory');
    const [sortCriteria, setSortCriteria] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [supportsBlur] = useState<boolean>(true);

    const navigate = useNavigate();
    const location = useLocation();

    // переключение между internal и route-вкладками
    useEffect(() => {
        const p = location.pathname;
        if (p.startsWith('/app/about') || p.startsWith('/app/account')) {
            setActiveMenu('route');
        } else if (p === '/app' && activeMenu === 'route') {
            setActiveMenu('inventory');
        }
    }, [location.pathname]);

    useEffect(() => {
        fetchData();
    }, [sortCriteria, activeMenu]);

    useEffect(() => {
        // закрываем меню при смене активной вкладки ИЛИ пути
        setIsMenuOpen(false);
    }, [activeMenu, location.pathname]);

    const fetchData = () => {
        if (activeMenu === 'inventory') fetchItems(sortCriteria);
        if (activeMenu === 'createReservation') fetchItems();
        if (activeMenu === 'reserve') fetchReservedItems();
        if (activeMenu === 'sold') fetchSoldReservations();
    };

    const fetchItems = async (sortBy?: string) => {
        setLoading(true);
        try {
            const endpoint = sortBy ? '/items/sorted' : '/items';
            const res = await api.get<Item[]>(endpoint, { params: sortBy ? { sortBy } : {} });
            setItems(res.data);
        } catch (e) {
            console.error(e);
            toast.error('Error loading products.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchReservedItems = async () => {
        setLoading(true);
        try {
            const res = await api.get<ReservationData[]>('/reservations');
            const data: ReservedItem[] = res.data
                .filter((it) => !it.isSold)
                .map((it) => ({
                    id: it.id?.toString() ?? '',
                    name: it.itemName ?? '',
                    quantity: it.reservedQuantity ?? 0,
                    orderNumber: it.orderNumber ?? '',
                    week: it.reservationWeek ?? '',
                }));
            setReservedItems(data);
        } catch (e) {
            console.error(e);
            toast.error('Error loading reserved items.');
            setReservedItems([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSoldReservations = async () => {
        setLoading(true);
        try {
            const res = await api.get<SoldReservation[]>('/reservations/sold');
            setSoldReservations(res.data ?? []);
        } catch (e) {
            console.error(e);
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
        } catch (e) {
            console.error(e);
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
        if (!input || Number.isNaN(quantity) || quantity <= 0) {
            toast.error('Please enter a valid number.');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/items/${id}/${scannerAction}`, null, { params: { quantity } });
            toast.success(`Operation ${scannerAction} completed. Quantity: ${quantity}`);
            fetchItems(sortCriteria);
        } catch (e) {
            console.error(e);
            toast.error('Operation error.');
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
        } catch (e) {
            console.error(e);
            toast.error('Error processing reserve.');
        } finally {
            setLoading(false);
        }
    };

    // переключатели
    const goInternal = (key: Exclude<MenuKey, 'route'>) => {
        navigate('/app');
        setActiveMenu(key);
    };

    const goRoute = (path: 'about' | 'account') => {
        setIsMenuOpen(false);
        setActiveMenu('route');
        navigate(`/app/${path}`);
    };

    return (
        <div className="app-container">
            <header className="topbar">
                <button
                    className={`hamburger-btn ${isMenuOpen ? 'is-open' : ''}`}
                    onClick={() => setIsMenuOpen((v) => !v)}
                >
                    <span />
                    <span />
                    <span />
                </button>
                <h1 className="topbar-title">FLOWQR</h1>
            </header>

            <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
                <h2 className="sidebar-title">FLOWQR</h2>
                <ul className="sidebar-menu">
                    <li
                        className={`menu-item ${activeMenu === 'inventory' ? 'active' : ''}`}
                        onClick={() => goInternal('inventory')}
                    >
                        Stock
                    </li>
                    <li
                        className={`menu-item ${activeMenu === 'createItem' ? 'active' : ''}`}
                        onClick={() => goInternal('createItem')}
                    >
                        Create item
                    </li>
                    <li
                        className={`menu-item ${activeMenu === 'reserve' ? 'active' : ''}`}
                        onClick={() => goInternal('reserve')}
                    >
                        Reserved items
                    </li>
                    <li
                        className={`menu-item ${activeMenu === 'createReservation' ? 'active' : ''}`}
                        onClick={() => goInternal('createReservation')}
                    >
                        Create a reservation
                    </li>
                    <li
                        className={`menu-item ${activeMenu === 'sold' ? 'active' : ''}`}
                        onClick={() => goInternal('sold')}
                    >
                        Sold items
                    </li>
                    <li
                        className={`menu-item ${activeMenu === 'files' ? 'active' : ''}`}
                        onClick={() => goInternal('files')}
                    >
                        QR-Codes
                    </li>
                    <li
                        className={`menu-item ${location.pathname.startsWith('/app/about') ? 'active' : ''}`}
                        onClick={() => goRoute('about')}
                    >
                        About App
                    </li>
                    <li
                        className={`menu-item ${location.pathname.startsWith('/app/account') ? 'active' : ''}`}
                        onClick={() => goRoute('account')}
                    >
                        Personal account
                    </li>
                    <li className="logout-item" onClick={() => { onLogout(); navigate('/login'); }}>
                        Log out
                    </li>
                </ul>
            </aside>

            <main className="app-main">
                {loading && <div className="loading-overlay">Loading...</div>}

                {activeMenu !== 'route' && (
                    <>
                        {activeMenu === 'inventory' && (
                            <>
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

                                <ItemList items={items} />
                            </>
                        )}

                        {activeMenu === 'createItem' && (
                            <div className="item-page">
                                <div className="item-card">
                                    <AddItemForm onAdd={handleAddItem} />
                                    <div className="scanner-buttons">
                                        <button className="btn btn-add" onClick={() => { setScannerAction('add'); setShowScanner(true); }}>Scan to add</button>
                                        <button className="btn btn-remove" onClick={() => { setScannerAction('remove'); setShowScanner(true); }}>Scan to remove</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeMenu === 'reserve' && (
                            <ReservedItemsList
                                reservedItems={reservedItems}
                                setReservedItems={setReservedItems}
                                onScan={handleReservedItemScan}
                                onReservationRemoved={handleReservationRemoved}
                                onWeekFilter={async (week) => {
                                    setLoading(true);
                                    try {
                                        const res = await api.get<ReservationData[]>('/reservations/sorted', { params: { reservationWeek: week } });
                                        const data = res.data
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
                            />
                        )}

                        {activeMenu === 'createReservation' && (
                            <div className="reservation-page">
                                <div className="reservation-card">
                                    <ReserveForm
                                        items={items}
                                        onReserveComplete={fetchReservedItems}
                                        onUpdateItems={(id, qty) =>
                                            setItems((prev) =>
                                                prev.map((it) => (it.id === id ? { ...it, quantity: it.quantity - qty } : it))
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {activeMenu === 'sold' && <SoldItemsList reservations={soldReservations} />}
                        {activeMenu === 'files' && <FileViewer />}
                    </>
                )}

                <Outlet />
            </main>

            {/* backdrop для меню */}
            {isMenuOpen &&
                createPortal(
                    <div
                        className={`backdrop ${supportsBlur ? 'backdrop--blur' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                    />,
                    document.body
                )}

            {showScanner &&
                createPortal(
                    <div className="scanner-modal" onClick={() => setShowScanner(false)}>
                        <div className="scanner-dialog" onClick={(e) => e.stopPropagation()}>
                            <button className="scanner-close" onClick={() => setShowScanner(false)}>×</button>
                            <div className="scanner-body">
                                <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default AppContent;
