// src/App.tsx
import { JSX, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import Register from './components/Register';
import Login from './components/Login';
import Confirmation from './components/Confirmation';
import AppContent from './components/AppContent';
import Account from './components/Account';
import AboutApp from './components/AboutApp';
import ItemsPage from './components/ItemsPage';
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

    useEffect(() => {
        const onLogout = () => {
            logout();
            setIsAuthenticated(false);
            toast.info('Сессия завершена. Войдите снова.');
            navigate('/login'); // редирект при глобальном logout
        };
        window.addEventListener('auth:logout', onLogout);
        return () => window.removeEventListener('auth:logout', onLogout);
    }, [navigate]);

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
        navigate('/login'); // <<< теперь редирект после выхода
    };

    return (
        <Routes>
            {/* публичные */}
            <Route path="/login" element={<Login onSuccess={handleAuthSuccess} />} />
            <Route path="/register" element={<Register onSuccess={() => {}} />} />
            <Route path="/confirmed" element={<Confirmation />} />

            {/* Вложенное дерево под /app/* */}
            <Route
                path="/app"
                element={
                    <RequireAuth>
                        <AppContent onLogout={handleLogout} />
                    </RequireAuth>
                }
            >
                <Route index element={<Navigate to="items" replace />} />
                <Route path="about" element={<AboutApp />} />
                <Route path="account" element={<Account />} />
                <Route path="items" element={<ItemsPage />} />
            </Route>

            {/* редиректы */}
            <Route path="/" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
            <Route path="*" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
        </Routes>
    );
}

// Оборачиваем App в Router
function AppWithRouter() {
    return (
        <Router>
            <App />
        </Router>
    );
}

export default AppWithRouter;
