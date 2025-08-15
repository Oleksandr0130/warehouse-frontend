import React, { useEffect, useState } from 'react';
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
import AboutApp from './AboutApp';
import DownloadExcelButton from './DownloadExelButton';
import Account from './Account';

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
    | 'about'
    | 'account';

type CSSWithSupports = {
    supports?: (prop: string, value?: string) => boolean;
};

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
    const [supportsBlur, setSupportsBlur] = useState<boolean>(true);

    useEffect(() => {
        const cssObj = (window as Window & { CSS?: CSSWithSupports }).CSS;
        const ok =
            !!cssObj?.supports &&
            (cssObj.supports('backdrop-filter', 'blur(3px)') ||
                cssObj.supports('-webkit-backdrop-filter', 'blur(3px)'));
        setSupportsBlur(ok);
        document.body.classList.toggle('no-blur', !ok);
    }, []);

    // блокируем скролл под открытым меню
    useEffect(() => {
        document.body.classList.toggle('no-scroll-menu', isMenuOpen);
        return () => document.body.classList.remove('no-scroll-menu');
    }, [isMenuOpen]);

    // автозакрытие меню при переходе
    useEffect(() => {
        setIsMenuOpen(false);
    }, [activeMenu]);

    // блокируем скролл под открытым сканером + ESC закрывает
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowScanner(false); };
        if (showScanner) {
            document.body.classList.add('no-scroll-scanner');
            window.addEventListener('keydown', onKey);
        }
        return () => {
            document.body.classList.remove('no-scroll-scanner');
            window.removeEventListener('keydown', onKey);
        };
    }, [showScanner]);

    useEffect(() => { fetchData(); }, [sortCriteria, activeMenu]);

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

    return (
        <div className="app-container">
            {/* topbar (mobile) */}
            <header className="topbar">
                <button
                    className={`hamburger-btn ${isMenuOpen ? 'is-open' : ''}`}
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((v) => !v)}
                >
                    <span />
                    <span />
                    <span />
                </button>
                <h1 className="topbar-title">FLOWQR</h1>
            </header>

            {/* sidebar */}
            <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
                <h2 className="sidebar-title">FLOWQR</h2>
                <ul className="sidebar-menu">
                    <li className={`menu-item ${activeMenu === 'inventory' ? 'active' : ''}`} onClick={() => setActiveMenu('inventory')}>Inventory</li>
                    <li className={`menu-item ${activeMenu === 'createItem' ? 'active' : ''}`} onClick={() => setActiveMenu('createItem')}>Create item</li>
                    <li className={`menu-item ${activeMenu === 'reserve' ? 'active' : ''}`} onClick={() => setActiveMenu('reserve')}>Reserved items</li>
                    <li className={`menu-item ${activeMenu === 'createReservation' ? 'active' : ''}`} onClick={() => setActiveMenu('createReservation')}>Create a reservation</li>
                    <li className={`menu-item ${activeMenu === 'sold' ? 'active' : ''}`} onClick={() => setActiveMenu('sold')}>Sold items</li>
                    <li className={`menu-item ${activeMenu === 'files' ? 'active' : ''}`} onClick={() => setActiveMenu('files')}>QR-Codes</li>
                    <li className={`menu-item ${activeMenu === 'about' ? 'active' : ''}`} onClick={() => setActiveMenu('about')}>About App</li>
                    <li className={`menu-item ${activeMenu === 'account' ? 'active' : ''}`} onClick={() => setActiveMenu('account')}>Personal account</li>
                    <li className="logout-item" onClick={onLogout}>Log out</li>
                </ul>
            </aside>

            {/* overlay меню (портал): кликом закрываем */}
            {isMenuOpen && createPortal(
                <div className={`backdrop ${supportsBlur ? 'backdrop--blur' : ''}`} onClick={() => setIsMenuOpen(false)} />,
                document.body
            )}

            <main className="app-main">
                {loading && <div className="loading-overlay">Loading...</div>}

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
                                    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity: it.quantity - qty } : it)))
                                }
                            />
                        </div>
                    </div>
                )}

                {activeMenu === 'sold' && <SoldItemsList reservations={soldReservations} />}
                {activeMenu === 'files' && <FileViewer />}
                {activeMenu === 'about' && <AboutApp />}
                {activeMenu === 'account' && <Account />}
            </main>

            {/* === СКАНЕР: модалка через портал === */}
            {showScanner && createPortal(
                <div className="scanner-modal" role="dialog" aria-modal="true" onClick={() => setShowScanner(false)}>
                    <div className="scanner-dialog" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="scanner-close"
                            aria-label="Close scanner"
                            onClick={() => setShowScanner(false)}
                            type="button"
                        >
                            ×
                        </button>

                        {/* ВАЖНО: явный viewport, чтобы библиотека получила размеры */}
                        <div className="scanner-viewport">
                            <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* === /SCANNER === */}
        </div>
    );
};

export default AppContent;
