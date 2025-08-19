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

function RequireAuth({ children }: { children: JSX.Element }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // ⬅️ добавили

    useEffect(() => {
        const onLogout = () => {
            // если 401 прилетел на экране логина — не дёргаем навигацию/тост, просто чистим токен
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
    }, [navigate, location.pathname]); // ⬅️ следим за путём

    useEffect(() => {
        const init = async () => {
            const valid = await validateTokens();
            setIsAuthenticated(valid);
        };
        init();
    }, []);

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
        toast.success('Successful Login!');
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
