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
import { validateTokens, logout } from './types/AuthManager';
import { toast, ToastContainer } from 'react-toastify';

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
            navigate('/login');
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
        navigate('/login');
    };

    return (
        <>
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
            <ToastContainer
                position="top-center"
                autoClose={4000}          // сделай false, если хочешь «липкие» ошибки
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                draggable
                pauseOnHover
                pauseOnFocusLoss={false}  // важно для WebView
                theme="colored"
                limit={3}
            />
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
