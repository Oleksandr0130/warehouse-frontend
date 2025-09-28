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

/** РћРїСЂРµРґРµР»СЏРµРј Android WebView РІР°С€РµРіРѕ РїСЂРёР»РѕР¶РµРЅРёСЏ РїРѕ user-agent */
const isAndroidApp = (() => {
    try {
        return typeof navigator !== 'undefined' && navigator.userAgent.includes('FlowQRApp/Android');
    } catch {
        return false;
    }
})();

/** РЈРЅРёС„РёС†РёСЂРѕРІР°РЅРЅС‹Р№ РґРѕСЃС‚СѓРї Рє СЃС‚РѕСЂСѓ: sessionStorage РґР»СЏ Android-РїСЂРёР»РѕР¶РµРЅРёСЏ, РёРЅР°С‡Рµ localStorage */
function getStorage(): Storage {
    try {
        return isAndroidApp ? sessionStorage : localStorage;
    } catch {
        return localStorage;
    }
}

/** Р§С‚РµРЅРёРµ С‚РѕРєРµРЅР° (СЃ b/c РїРѕ РєР»СЋС‡Сѓ "token") */
function getAccessToken() {
    const s = getStorage();
    return s.getItem('accessToken') ?? s.getItem('token') ?? null;
}

/** РўРµРїРµСЂСЊ RequireAuth СѓС‡РёС‚С‹РІР°РµС‚ Рё РЅР°Р»РёС‡РёРµ С‚РѕРєРµРЅР°, Рё С„Р»Р°Рі isAuthenticated */
function RequireAuth({ children, isAuthenticated }: { children: JSX.Element; isAuthenticated: boolean }) {
    const token = getAccessToken();
    if (!token && !isAuthenticated) return <Navigate to="/login" replace />;
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
                toast.info('РЎРµСЃСЃРёСЏ Р·Р°РІРµСЂС€РµРЅР°. Р’РѕР№РґРёС‚Рµ СЃРЅРѕРІР°.');
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

    // С‚РѕСЃС‚ РїСЂРё РІС…РѕРґРµ, РµСЃР»Рё РѕСЃС‚Р°Р»РѕСЃСЊ в‰¤ 2 РґРЅРµР№ (TRIAL/ACTIVE)
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

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
        toast.success('Successful Login!', { toastId: 'auth-login' });
        // Р·Р°РїСѓСЃРєР°РµРј РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёРµ Рѕ Р±РёР»Р»РёРЅРіРµ РІ СЃР»РµРґСѓСЋС‰РёР№ С‚РёРє
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
                {/* РїСѓР±Р»РёС‡РЅС‹Рµ */}
                <Route path="/login" element={<Login onSuccess={handleAuthSuccess} />} />
                <Route path="/register" element={<Register onSuccess={() => {}} />} />
                <Route path="/confirmed" element={<Confirmation />} />

                {/* РїСЂРёРІР°С‚РЅС‹Рµ РїРѕРґ /app */}
                <Route
                    path="/app"
                    element={
                        <RequireAuth isAuthenticated={isAuthenticated}>
                            <AppContent onLogout={handleLogout} />
                        </RequireAuth>
                    }
                >
                    <Route index element={<></>} />
                    <Route path="about" element={<AboutApp />} />
                    <Route path="account" element={<Account />} />
                </Route>

                {/* СЂРµРґРёСЂРµРєС‚С‹ */}
                <Route path="/" element={<Navigate to={isAuthenticated || getAccessToken() ? '/app' : '/login'} replace />} />
                <Route path="*" element={<Navigate to={isAuthenticated || getAccessToken() ? '/app' : '/login'} replace />} />
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