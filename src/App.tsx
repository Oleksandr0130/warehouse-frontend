// src/App.tsx
import { JSX, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

    useEffect(() => {
        const onLogout = () => {
            logout();
            setIsAuthenticated(false);
            toast.info('Сессия завершена. Войдите снова.');
        };
        window.addEventListener('auth:logout', onLogout);
        return () => window.removeEventListener('auth:logout', onLogout);
    }, []);

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
    };

    return (
        <Router>
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
                            <ItemsPage />
                        </RequireAuth>
                    }
                >
                    {/* index: /app */}
                    <Route index element={<AppContent onLogout={handleLogout} />} />
                    {/* вложенные страницы */}
                    <Route path="about" element={<AboutApp />} />
                    <Route path="account" element={<Account />} />
                    <Route path="items" element={<ItemsPage />} />
                </Route>

                {/* редиректы */}
                <Route path="/" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
                <Route path="*" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
            </Routes>

            <div id="gt_widget_global" style={{ width: 0, height: 0, overflow: 'hidden' }} />
        </Router>
    );
}

export default App;
