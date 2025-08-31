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
import { validateSession, touchSession, logout as apiLogout } from './types/AuthManager';
import { toast, ToastContainer } from 'react-toastify';
import { fetchBillingStatus } from './api';

function RequireAuth({ children }: { children: JSX.Element }) {
    const isAuthed = sessionStorage.getItem('isAuthed') === '1';
    if (!isAuthed) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // глобальный выход по событию
    useEffect(() => {
        const onLogout = () => {
            setIsAuthenticated(false);
            sessionStorage.removeItem('isAuthed');
            const alreadyOnLogin = location.pathname === '/login';
            if (!alreadyOnLogin) {
                toast.info('Сессия завершена. Войдите снова.');
                navigate('/login', { replace: true });
            }
        };
        window.addEventListener('auth:logout', onLogout);
        return () => window.removeEventListener('auth:logout', onLogout);
    }, [navigate, location.pathname]);

    // инициализация: пытаемся освежить сессию и проверить её
    useEffect(() => {
        const init = async () => {
            await touchSession(); // если был refresh-куки — обновит AccessToken
            const valid = await validateSession(); // GET /users/me
            setIsAuthenticated(valid);
            if (valid) sessionStorage.setItem('isAuthed', '1');
        };
        init();
    }, []);

    // если уже аутентифицированы и на /login — переходим в /app
    useEffect(() => {
        if (isAuthenticated && location.pathname === '/login') {
            navigate('/app', { replace: true });
        }
    }, [isAuthenticated, location.pathname, navigate]);

    // тост при входе, если осталось ≤ 2 дней (TRIAL/ACTIVE)
    const warnOnLogin = async () => {
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

            toast.warn(
                res.status === 'TRIAL'
                    ? `Your trial ends in ${daysLeft} day(s).`
                    : `Your access period ends in ${daysLeft} day(s).`,
                { toastId: 'billing-warn' }
            );
        } catch {
            /* ignore */
        }
    };

    // вызывается компонентом <Login /> после 200 OK от /auth/login
    const handleAuthSuccess = async () => {
        // 1) на всякий случай освежим сессию и проверим её
        await touchSession();
        const valid = await validateSession();
        // 2) считаем пользователя аутентифицированным, ставим флаг и тост
        setIsAuthenticated(valid);
        if (valid) {
            sessionStorage.setItem('isAuthed', '1');
            toast.success('Successful Login!', { toastId: 'auth-login' });
            // 3) сразу переводим на /app (не ждём внешних редиректов)
            navigate('/app', { replace: true });
            // 4) поднимем предупреждение по биллингу
            setTimeout(() => { void warnOnLogin(); }, 0);
        } else {
            // если вдруг куки не встали — сообщим и оставим на /login
            toast.error('Login failed: no session detected.');
        }
    };

    const handleLogout = async () => {
        await apiLogout(); // попросим сервер очистить куки
        setIsAuthenticated(false);
        sessionStorage.removeItem('isAuthed');
        toast.info('Successful Logout!', { toastId: 'auth-logout' });
        navigate('/login', { replace: true });
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={2000} newestOnTop limit={3} />
            <Routes>
                {/* /login: если уже вошёл — редиректим в /app */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated
                            ? <Navigate to="/app" replace />
                            : <Login onSuccess={handleAuthSuccess} />
                    }
                />
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
