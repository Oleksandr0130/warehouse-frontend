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
import { toast, ToastContainer } from 'react-toastify';
import { fetchBillingStatus } from './api';

/** storage: ВСЕГДА localStorage */
function getStorage(): Storage {
    try { return localStorage; } catch { return sessionStorage; }
}

/** Чтение токена (с b/c по ключу "token") */
function getAccessToken() {
    const s = getStorage();
    return s.getItem('accessToken') ?? s.getItem('token') ?? null;
}

function RequireAuth({
                         children,
                         isAuthenticated,
                         bootstrapping,
                     }: { children: JSX.Element; isAuthenticated: boolean; bootstrapping: boolean }) {
    if (bootstrapping) return null; // можно показать глобальный лоадер
    const token = getAccessToken();
    if (!token && !isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [bootstrapping, setBootstrapping] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Глобальный обработчик логаута (по событию из AuthManager / api)
    useEffect(() => {
        const onLogout = () => {
            const alreadyOnLogin = location.pathname === '/login';
            logout();
            setIsAuthenticated(false);
            if (!alreadyOnLogin) {
                toast.info('Session ended. Please sign in again.');
                navigate('/login', { replace: true });
            }
        };
        window.addEventListener('auth:logout', onLogout as EventListener);
        return () => window.removeEventListener('auth:logout', onLogout as EventListener);
    }, [navigate, location.pathname]);

    // Бутстрап авторизации (ждём до рендера приватных роутов)
    useEffect(() => {
        (async () => {
            const ok = await validateTokens();
            setIsAuthenticated(ok);
            setBootstrapping(false);
        })();
    }, []);

    // Тост-напоминание про окончание периода, если осталось ≤ 2 дней
    const warnOnLogin = async () => {
        try {
            const res = await fetchBillingStatus();
            const endRaw =
                res.status === 'TRIAL' ? res.trialEnd :
                    res.status === 'ACTIVE' ? res.currentPeriodEnd : undefined;
            if (!endRaw) return;

            const msLeft = new Date(endRaw).getTime() - Date.now();
            const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000));

            if ((res.status === 'TRIAL' || res.status === 'ACTIVE') && daysLeft <= 2) {
                toast.warn(
                    res.status === 'TRIAL'
                        ? `Your trial ends in ${daysLeft} day(s).`
                        : `Your access period ends in ${daysLeft} day(s).`,
                    { toastId: 'billing-warn' }
                );
            }
        } catch {
            /* ignore */
        }
    };

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
        toast.success('Successful Login!', { toastId: 'auth-login' });
        setTimeout(() => warnOnLogin(), 0);
    };

    const handleLogout = () => {
        logout();
        setIsAuthenticated(false);
        toast.info('Successful Logout!', { toastId: 'auth-logout' });
        navigate('/login', { replace: true });
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={4000} newestOnTop limit={3} />
            <Routes>
                {/* публичные */}
                <Route path="/login" element={<Login onSuccess={handleAuthSuccess} />} />
                <Route path="/register" element={<Register onSuccess={() => {}} />} />
                <Route path="/confirmed" element={<Confirmation />} />

                {/* приватные под /app */}
                <Route
                    path="/app"
                    element={
                        <RequireAuth isAuthenticated={isAuthenticated} bootstrapping={bootstrapping}>
                            <AppContent onLogout={handleLogout} />
                        </RequireAuth>
                    }
                >
                    <Route index element={<></>} />
                    <Route path="about" element={<AboutApp />} />
                    <Route path="account" element={<Account />} />
                </Route>

                {/* редиректы — не дёргаем, пока идёт бутстрап */}
                <Route
                    path="/"
                    element={
                        <Navigate
                            to={
                                bootstrapping
                                    ? '/app'
                                    : (isAuthenticated || getAccessToken() ? '/app' : '/login')
                            }
                            replace
                        />
                    }
                />
                <Route
                    path="*"
                    element={
                        <Navigate
                            to={
                                bootstrapping
                                    ? '/app'
                                    : (isAuthenticated || getAccessToken() ? '/app' : '/login')
                            }
                            replace
                        />
                    }
                />
            </Routes>
        </>
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
