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
import DashboardCards from './DashboardCards';

import { toast } from 'react-toastify';
import api from '../api';
import { Item } from '../types/Item';
import { ReservedItem } from '../types/ReservedItem';
import { ReservationData } from '../types/ReservationData';
import { SoldReservation } from '../types/SoldReservation';
import logo from '../assets/flowqr-logo.png';

type MenuKey = 'inventory'|'createItem'|'reserve'|'createReservation'|'sold'|'files'|'route';

interface AppContentProps { onLogout: () => void; }

const AppContent: React.FC<AppContentProps> = ({ onLogout }) => {
    const [items, setItems] = useState<Item[]>([]);
    const [reservedItems, setReservedItems] = useState<ReservedItem[]>([]);
    const [soldReservations, setSoldReservations] = useState<SoldReservation[]>([]);
    const [showScanner, setShowScanner] = useState(false);
    const [scannerAction, setScannerAction] = useState<'add'|'remove'|null>(null);
    const [loading, setLoading] = useState(false);
    const [activeMenu, setActiveMenu] = useState<MenuKey>('inventory');
    const [sortCriteria, setSortCriteria] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [supportsBlur] = useState<boolean>(true);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const p = location.pathname;
        if (p.startsWith('/app/about') || p.startsWith('/app/account')) {
            setActiveMenu('route');
        } else if (p === '/app' && activeMenu === 'route') {
            setActiveMenu('inventory');
        }
    }, [location.pathname]);

    useEffect(() => { fetchData(); }, [sortCriteria, activeMenu]);
    useEffect(() => { setIsMenuOpen(false); }, [activeMenu, location.pathname]);

    const fetchData = () => {
        if (activeMenu === 'inventory') {
            fetchItems(sortCriteria);
            fetchReservedItems();              // нужно для счётчика
        }
        if (activeMenu === 'reserve') {
            fetchReservedItems();
            fetchItems();                      // нужно для QR-count
        }
        if (activeMenu === 'files') {
            fetchItems();
            fetchReservedItems();              // оба для QR-count
        }
        if (activeMenu === 'createReservation') fetchItems();
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

    const handleDeleteItem = async (id: string) => {
        setLoading(true);
        try {
            await api.delete(`/items/${encodeURIComponent(id)}`);
            setItems(prev => prev.filter(i => i.id !== id));
            toast.success('Product deleted.');
        } catch (e) {
            console.error(e);
            toast.error('Error deleting product.');
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
        setItems((prev) => prev.map((it) => (it.id === updatedItemId ? { ...it, quantity: it.quantity + returnedQuantity } : it)));
        fetchReservedItems();
        fetchItems(sortCriteria);
        toast.success('Reservation deleted.');
    };

    const handleReservedItemScan = async (orderNumber: string) => {
        if (!orderNumber) { toast.error('Incorrect QR code.'); return; }
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

    // навигация
    const goInternal = (key: Exclude<MenuKey,'route'>) => { navigate('/app'); setActiveMenu(key); };
    const goRoute = (path: 'about'|'account') => { setIsMenuOpen(false); setActiveMenu('route'); navigate(`/app/${path}`); };

    const qrTotalCount = items.length + reservedItems.length;

    return (
        <div className="app-container">
            <header className="topbar">
                <button className={`hamburger-btn ${isMenuOpen ? 'is-open' : ''}`} onClick={() => setIsMenuOpen((v) => !v)}>
                    <span/><span/><span/>
                </button>
                <h1 className="topbar-title">FLOWQR</h1>
            </header>

            <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
                <img src={logo} alt="FLOWQR" className="sidebar-logo" />
                <ul className="sidebar-menu">
                    <li className={`menu-item ${activeMenu === 'inventory' ? 'active' : ''}`} onClick={() => goInternal('inventory')}>
                        <span className="mi-icon">📦</span><span className="mi-label">Stock</span>
                    </li>
                    <li className={`menu-item ${activeMenu === 'createItem' ? 'active' : ''}`} onClick={() => goInternal('createItem')}>
                        <span className="mi-icon">➕</span><span className="mi-label">Create item</span>
                    </li>
                    <li className={`menu-item ${activeMenu === 'reserve' ? 'active' : ''}`} onClick={() => goInternal('reserve')}>
                        <span className="mi-icon">🧾</span><span className="mi-label">Reserved items</span>
                    </li>
                    <li className={`menu-item ${activeMenu === 'createReservation' ? 'active' : ''}`} onClick={() => goInternal('createReservation')}>
                        <span className="mi-icon">📝</span><span className="mi-label">Create a reservation</span>
                    </li>
                    <li className={`menu-item ${activeMenu === 'sold' ? 'active' : ''}`} onClick={() => goInternal('sold')}>
                        <span className="mi-icon">🏷️</span><span className="mi-label">Sold items</span>
                    </li>
                    <li className={`menu-item ${activeMenu === 'files' ? 'active' : ''}`} onClick={() => goInternal('files')}>
                        <span className="mi-icon">🔳</span><span className="mi-label">QR-Codes</span>
                    </li>
                    <li className={`menu-item ${location.pathname.startsWith('/app/about') ? 'active' : ''}`} onClick={() => goRoute('about')}>
                        <span className="mi-icon">ℹ️</span><span className="mi-label">About App</span>
                    </li>
                    <li className={`menu-item ${location.pathname.startsWith('/app/account') ? 'active' : ''}`} onClick={() => goRoute('account')}>
                        <span className="mi-icon">👤</span><span className="mi-label">Personal account</span>
                    </li>
                    <li className="logout-item" onClick={() => { onLogout(); navigate('/login'); }}>
                        <span className="mi-icon">🚪</span><span className="mi-label">Log out</span>
                    </li>
                </ul>
            </aside>

            <main className="app-main">
                {loading && <div className="loading-overlay">Loading...</div>}

                {activeMenu !== 'route' && (
                    <>
                        {activeMenu === 'inventory' && (
                            <>
                                <DashboardCards
                                    active="stock"
                                    itemsCount={items.length}
                                    reservedCount={reservedItems.length}
                                    qrCount={qrTotalCount}
                                    onGoStock={() => goInternal('inventory')}
                                    onGoReserved={() => goInternal('reserve')}
                                    onGoQRCodes={() => goInternal('files')}
                                />

                                <div className="app-toolbar">
                                    <div className="sort-dropdown" role="group" aria-label="Sort items">
                                        <span className="sort-label">Sort by</span>
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
                                </div>

                                <ItemList items={items} onDelete={handleDeleteItem} />

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
                            <>
                                <DashboardCards
                                    active="reserved"
                                    itemsCount={items.length}
                                    reservedCount={reservedItems.length}
                                    qrCount={qrTotalCount}
                                    onGoStock={() => goInternal('inventory')}
                                    onGoReserved={() => goInternal('reserve')}
                                    onGoQRCodes={() => goInternal('files')}
                                />
                                <ReservedItemsList
                                    reservedItems={reservedItems}
                                    setReservedItems={setReservedItems}
                                    onScan={handleReservedItemScan}
                                    onReservationRemoved={handleReservationRemoved}
                                />
                            </>
                        )}

                        {activeMenu === 'createReservation' && (
                            <div className="reservation-page">
                                <div className="reservation-card">
                                    <ReserveForm
                                        items={items}
                                        onReserveComplete={fetchReservedItems}
                                        onUpdateItems={(id, qty) =>
                                            setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity: it.quantity - qty } : it)))
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {activeMenu === 'sold' && <SoldItemsList reservations={soldReservations} />}
                        {activeMenu === 'files' && (
                            <>
                                <DashboardCards
                                    active="qr"
                                    itemsCount={items.length}
                                    reservedCount={reservedItems.length}
                                    qrCount={qrTotalCount}
                                    onGoStock={() => goInternal('inventory')}
                                    onGoReserved={() => goInternal('reserve')}
                                    onGoQRCodes={() => goInternal('files')}
                                />
                                <FileViewer />
                            </>
                        )}
                    </>
                )}

                <Outlet />
            </main>

            {isMenuOpen && createPortal(
                <div className={`backdrop ${supportsBlur ? 'backdrop--blur' : ''}`} onClick={() => setIsMenuOpen(false)}/>,
                document.body
            )}

            {showScanner && createPortal(
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
