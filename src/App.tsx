import { JSX, useEffect, useState } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useNavigate,
    useLocation,
} from 'react-router-dom';
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

function RequireAuth({ children }: { children: JSX.Element }) {
    const [ready, setReady] = useState(false);
    const [ok, setOk] = useState<boolean | null>(null);

    useEffect(() => {
        (async () => {
            const valid = await validateTokens();
            setOk(valid);
            setReady(true);
        })();
    }, []);

    if (!ready) return null; // сюда можно вставить спиннер/скелетон
    if (!ok) return <Navigate to="/login" replace />;
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

    // тост при входе, если осталось ≤ 2 дней (TRIAL/ACTIVE)
    const warnOnLogin = async () => {
        try {
            const res = await fetchBillingStatus();
            const endRaw =
                res.status === 'TRIAL'
                    ? res.trialEnd
                    : res.status === 'ACTIVE'
                        ? res.currentPeriodEnd
                        : undefined;
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

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
        toast.success('Successful Login!', { toastId: 'auth-login' });
        // куки уже выставлены сервером; просто покажем предупреждение при необходимости
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
