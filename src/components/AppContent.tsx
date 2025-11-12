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
import LanguageSwitcher from './LanguageSwitcher';

import { toast } from 'react-toastify';
import api from '../api';
import { Item } from '../types/Item';
import { ReservedItem } from '../types/ReservedItem';
import { ReservationData } from '../types/ReservationData';
import { SoldReservation } from '../types/SoldReservation';
import logo from '../assets/flowqr-logo.png';
import { useTranslation } from 'react-i18next';

type MenuKey = 'inventory'|'createItem'|'reserve'|'createReservation'|'sold'|'files'|'route';

interface AppContentProps { onLogout: () => void; }

const AppContent: React.FC<AppContentProps> = ({ onLogout }) => {
    const { t } = useTranslation();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => { fetchData(); }, [sortCriteria, activeMenu]); // eslint-disable-line
    useEffect(() => { setIsMenuOpen(false); }, [activeMenu, location.pathname]);

    const fetchData = () => {
        if (activeMenu === 'inventory') {
            fetchItems(sortCriteria);
            fetchReservedItems();              // need counter
        }
        if (activeMenu === 'reserve') {
            fetchReservedItems();
            fetchItems();                      // need QR-count
        }
        if (activeMenu === 'files') {
            fetchItems();
            fetchReservedItems();              // both for QR-count
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
            toast.error(t('appContent.errors.loadProducts'));
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
            toast.error(t('appContent.errors.loadReserved'));
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
            toast.error(t('appContent.errors.loadSold'));
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
            toast.success(t('appContent.success.productAdded'));
        } catch (e) {
            console.error(e);
            toast.error(t('appContent.errors.addProduct'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (id: string) => {
        setLoading(true);
        try {
            await api.delete(`/items/${encodeURIComponent(id)}`);
            setItems(prev => prev.filter(i => i.id !== id));
            toast.success(t('appContent.success.productDeleted'));
        } catch (e) {
            console.error(e);
            toast.error(t('appContent.errors.deleteProduct'));
        } finally {
            setLoading(false);
        }
    };

    // update description/price/currency/images
    const handleUpdateItem = async (id: string, patch: Partial<Item>) => {
        setLoading(true);
        try {
            await api.put(`/items/${encodeURIComponent(id)}`, patch);
            setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
            toast.success(t('appContent.success.productUpdated'));
        } catch (e) {
            console.error(e);
            toast.error(t('appContent.errors.updateProduct'));
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (id: string) => {
        setShowScanner(false);
        if (!scannerAction) return;
        const actionKey = scannerAction === 'add' ? t('appContent.scan.action.add') : t('appContent.scan.action.remove');
        const input = prompt(t('appContent.scan.enterQty', { action: actionKey }));
        const quantity = Number(input);
        if (!input || Number.isNaN(quantity) || quantity <= 0) {
            toast.error(t('appContent.scan.enterValidNumber'));
            return;
        }
        setLoading(true);
        try {
            await api.put(`/items/${id}/${scannerAction}`, null, { params: { quantity } });
            toast.success(t('appContent.scan.completed', { action: actionKey, quantity }));
            fetchItems(sortCriteria);
        } catch (e) {
            console.error(e);
            toast.error(t('appContent.scan.operationError'));
        } finally {
            setLoading(false);
        }
    };

    const handleReservationRemoved = (updatedItemId: string, returnedQuantity: number) => {
        setItems((prev) => prev.map((it) => (it.id === updatedItemId ? { ...it, quantity: it.quantity + returnedQuantity } : it)));
        fetchReservedItems();
        fetchItems(sortCriteria);
        toast.success(t('appContent.success.reservationDeleted'));
    };

    const handleReservedItemScan = async (orderNumber: string) => {
        if (!orderNumber) {
            toast.error(t('appContent.errors.incorrectQR'));
            return;
        }
        setLoading(true);
        try {
            await api.post('/reservations/scan', null, { params: { orderNumber } });
            fetchReservedItems();
            toast.success(t('appContent.success.reservationProcessed'));
        } catch (e) {
            console.error(e);
            toast.error(t('appContent.errors.processReserve'));
        } finally {
            setLoading(false);
        }
    };

    // navigation
    const goInternal = (key: Exclude<MenuKey,'route'>) => { navigate('/app'); setActiveMenu(key); };
    const goRoute = (path: 'about'|'account') => { setIsMenuOpen(false); setActiveMenu('route'); navigate(`/app/${path}`); };

    const qrTotalCount = items.length + reservedItems.length;

    return (
        <div className="app-container">
            <header className="topbar">
                <button
                    className={`hamburger-btn ${isMenuOpen ? 'is-open' : ''}`}
                    onClick={() => setIsMenuOpen((v) => !v)}
                    aria-label={isMenuOpen ? t('appContent.a11y.closeMenu') : t('appContent.a11y.openMenu')}
                >
                    <span /><span /><span />
                </button>

                <h1 className="topbar-title">FLOWQR</h1>

                {/* переключатель языка справа */}
                <div style={{ marginLeft: 'auto' }}>
                    <LanguageSwitcher />
                </div>
            </header>

            <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
                <img src={logo} alt="FLOWQR" className="sidebar-logo" />
                {/* (опционально) дублируем свитчер в сайдбаре для мобилы */}
                <div style={{ margin: '10px 0 16px' }}>
                    <LanguageSwitcher />
                </div>

                <ul className="sidebar-menu">
                    <li className={`menu-item ${activeMenu === 'inventory' ? 'active' : ''}`} onClick={() => goInternal('inventory')}>
                        <span className="mi-icon">📦</span><span className="mi-label">{t('appContent.menu.stock')}</span>
                    </li>
                    <li className={`menu-item ${activeMenu === 'createItem' ? 'active' : ''}`} onClick={() => goInternal('createItem')}>
                        <span className="mi-icon">➕</span><span className="mi-label">{t('appContent.menu.createItem')}</span>
                    </li>
                    <li className={`menu-item ${activeMenu === 'reserve' ? 'active' : ''}`} onClick={() => goInternal('reserve')}>
                        <span className="mi-icon">🧾</span><span className="mi-label">{t('appContent.menu.reservedItems')}</span>
                    </li>
                    <li className={`menu-item ${activeMenu === 'createReservation' ? 'active' : ''}`} onClick={() => goInternal('createReservation')}>
                        <span className="mi-icon">📝</span><span className="mi-label">{t('appContent.menu.createReservation')}</span>
                    </li>
                    <li className={`menu-item ${activeMenu === 'sold' ? 'active' : ''}`} onClick={() => goInternal('sold')}>
                        <span className="mi-icon">🏷️</span><span className="mi-label">{t('appContent.menu.soldItems')}</span>
                    </li>
                    <li className={`menu-item ${activeMenu === 'files' ? 'active' : ''}`} onClick={() => goInternal('files')}>
                        <span className="mi-icon">🔳</span><span className="mi-label">{t('appContent.menu.qrCodes')}</span>
                    </li>
                    <li className={`menu-item ${location.pathname.startsWith('/app/about') ? 'active' : ''}`} onClick={() => goRoute('about')}>
                        <span className="mi-icon">ℹ️</span><span className="mi-label">{t('appContent.menu.about')}</span>
                    </li>
                    <li className={`menu-item ${location.pathname.startsWith('/app/account') ? 'active' : ''}`} onClick={() => goRoute('account')}>
                        <span className="mi-icon">👤</span><span className="mi-label">{t('appContent.menu.account')}</span>
                    </li>
                    <li className="logout-item" onClick={() => { onLogout(); navigate('/login'); }}>
                        <span className="mi-icon">🚪</span><span className="mi-label">{t('appContent.menu.logout')}</span>
                    </li>
                </ul>
            </aside>

            <main className="app-main">
                {loading && <div className="loading-overlay">{t('common.loading')}</div>}

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
                                    <div className="sort-dropdown" role="group" aria-label={t('appContent.sort.aria')}>
                                        <span className="sort-label">{t('appContent.sort.label')}</span>
                                        <select
                                            id="sort-menu"
                                            className="sort-select"
                                            value={sortCriteria}
                                            onChange={(e) => setSortCriteria(e.target.value)}
                                        >
                                            <option value="">{t('appContent.sort.options.standard')}</option>
                                            <option value="name">{t('appContent.sort.options.name')}</option>
                                            <option value="quantity">{t('appContent.sort.options.amount')}</option>
                                            <option value="sold">{t('appContent.sort.options.sold')}</option>
                                        </select>
                                    </div>

                                    <div className="excel-button-wrapper">
                                        <DownloadExcelButton />
                                    </div>
                                </div>

                                <ItemList
                                    items={items}
                                    onDelete={handleDeleteItem}
                                    onUpdate={handleUpdateItem}
                                />
                            </>
                        )}

                        {activeMenu === 'createItem' && (
                            <div className="item-page">
                                <div className="item-card">
                                    <AddItemForm onAdd={handleAddItem} />
                                    <div className="scanner-buttons">
                                        <button className="btn btn-add" onClick={() => { setScannerAction('add'); setShowScanner(true); }}>
                                            {t('appContent.scan.scanToAdd')}
                                        </button>
                                        <button className="btn btn-remove" onClick={() => { setScannerAction('remove'); setShowScanner(true); }}>
                                            {t('appContent.scan.scanToRemove')}
                                        </button>
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
                <div
                    className={`backdrop ${supportsBlur ? 'backdrop--blur' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                />,
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
