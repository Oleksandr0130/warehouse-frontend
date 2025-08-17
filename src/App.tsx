// App.tsx
import {JSX, useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import Register from './components/Register';
import Login from './components/Login';
import Confirmation from './components/Confirmation';
import AppContent from './components/AppContent';
import AboutApp from './components/AboutApp';
import Account from './components/Account';
import { validateTokens, logout } from './types/AuthManager';
import { toast } from 'react-toastify';

function RequireAuth({ children }: { children: JSX.Element }) {
    const token = localStorage.getItem('accessToken'); // ключ должен совпадать с Login/api.ts
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // быстрый «подъём» авторизации по наличию токена + тихая валидация
    useEffect(() => {
        if (localStorage.getItem('accessToken')) setIsAuthenticated(true);
        (async () => {
            const ok = await validateTokens();
            setIsAuthenticated(ok);
            if (!ok) logout();
        })();
    }, []);

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
        toast.success('Вы успешно вошли!');
        window.location.href = '/app'; // можно заменить на useNavigate('/app')
    };

    const handleLogout = () => {
        logout();
        setIsAuthenticated(false);
        toast.info('Вы вышли из системы.');
        window.location.href = '/login';
    };

    const hasToken = !!localStorage.getItem('accessToken');

    return (
        <Router>
            <Routes>
                {/* публичные */}
                <Route
                    path="/login"
                    element={
                        (isAuthenticated || hasToken)
                            ? <Navigate to="/app" replace />
                            : <Login onSuccess={handleAuthSuccess} />
                    }
                />
                <Route path="/register" element={<Register onSuccess={() => {}} />} />
                <Route path="/confirmed" element={<Confirmation />} />
                <Route path="/about" element={<AboutApp />} />

                {/* приватные */}
                <Route
                    path="/app"
                    element={
                        <RequireAuth>
                            <AppContent onLogout={handleLogout} />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/account"
                    element={
                        <RequireAuth>
                            <Account />
                        </RequireAuth>
                    }
                />

                {/* корень / дефолты */}
                <Route path="/" element={<Navigate to={isAuthenticated || hasToken ? '/app' : '/login'} replace />} />
                <Route path="*" element={<Navigate to={isAuthenticated || hasToken ? '/app' : '/login'} replace />} />
            </Routes>
        </Router>
    );
}
