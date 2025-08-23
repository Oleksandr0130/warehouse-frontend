// src/App.tsx
import { JSX, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import Register from './components/Register';
import Login from './components/Login';
import Confirmation from './components/Confirmation';
import AppContent from './components/AppContent';
import Account from './components/Account';
import AboutApp from './components/AboutApp';
import { validateTokens, logout } from './types/AuthManager';
import { toast } from 'react-toastify';
import { fetchBillingStatus } from './api'; // ⬅️ добавили

function RequireAuth({ children }: { children: JSX.Element }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const onLogout = () => {
            const alreadyOnLogin = location.pathname === '/login';
            logout();
            setIsAuthenticated(false);
            if (!alreadyOnLogin) {
                toast.info('Сессия завершена. Войдите снова.');
                navigate('/login', { replace: true });
            }
        };
        window.addEventListener('auth:logout', onLogout);
        return () => window.removeEventListener('auth:logout', onLogout);
    }, [navigate, location.pathname]);

    useEffect(() => {
        const init = async () => {
            const valid = await validateTokens();
            setIsAuthenticated(valid);
        };
        init();
    }, []);

    // === ПРЕДУПРЕЖДЕНИЕ ТОЛЬКО ПОСЛЕ ЛОГИНА, ОДИН РАЗ ===
    const warnOnceAfterLogin = async () => {
        try {
            const res = await fetchBillingStatus();
            const endRaw =
                res.status === 'TRIAL' ? res.trialEnd :
                    res.status === 'ACTIVE' ? res.currentPeriodEnd : undefined;
            if (!endRaw) return;

            const daysLeft =
                typeof res.daysLeft === 'number'
                    ? Math.max(0, res.daysLeft)
                    : Math.max(0, Math.ceil((new Date(endRaw).getTime() - Date.now()) / 86_400_000));

            const shouldWarn = (res.status === 'TRIAL' || res.status === 'ACTIVE') && daysLeft <= 2;
            if (!shouldWarn) return;

            // Ключ привязан к дате окончания: если период обновится — покажем снова,
            // иначе — никогда больше не повторяем.
            const KEY = `billingWarnShown:${endRaw}`;
            if (localStorage.getItem(KEY)) return;

            toast.warn(
                res.status === 'TRIAL'
                    ? `Your trial ends in ${daysLeft} day(s).`
                    : `Your subscription period ends in ${daysLeft} day(s).`
            );
            localStorage.setItem(KEY, '1');
        } catch {
            /* ignore billing errors */
        }
    };

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
        toast.success('Successful Login!');
        // показать предупреждение один раз сразу после логина
        warnOnceAfterLogin();
    };

    const handleLogout = () => {
        logout();
        setIsAuthenticated(false);
        toast.info('Successful Logout!');
        navigate('/login', { replace: true });
    };

    return (
        <Routes>
            {/* публичные */}
            <Route path="/login" element={<Login onSuccess={handleAuthSuccess} />} />
            <Route path="/register" element={<Register onSuccess={() => {}} />} />
            <Route path="/confirmed" element={<Confirmation />} />

            {/* приватные под /app */}
            <Route
                path="/app"
                element={
                    <RequireAuth>
                        <AppContent onLogout={handleLogout} />
                    </RequireAuth>
                }
            >
                <Route index element={<></>} />
                <Route path="about" element={<AboutApp />} />
                <Route path="account" element={<Account />} />
            </Route>

            {/* редиректы */}
            <Route path="/" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
            <Route path="*" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
        </Routes>
    );
}

function AppWithRouter() {
    return (
        <Router>
            <App />
        </Router>
    );
}

export default AppWithRouter;
