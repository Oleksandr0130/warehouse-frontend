// src/App.tsx
import { JSX, useEffect, useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useNavigate,
    useLocation,
} from "react-router-dom";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";

import Register from "./components/Register";
import Login from "./components/Login";
import Confirmation from "./components/Confirmation";
import AppContent from "./components/AppContent";
import Account from "./components/Account";
import AboutApp from "./components/AboutApp";

import {
    validateSession,
    touchSession,
    logout as apiLogout,
} from "./types/AuthManager";
import { toast, ToastContainer } from "react-toastify";
import { fetchBillingStatus } from "./api";

function RequireAuth({
                         children,
                         isAuthenticated,
                     }: {
    children: JSX.Element;
    isAuthenticated: boolean | undefined;
}) {
    if (isAuthenticated !== true) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    // undefined — пока не знаем статус, true/false — после инициализации
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(
        undefined
    );
    const [authReady, setAuthReady] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // глобальный выход (используется интерцептором при 401, когда refresh не удался)
    useEffect(() => {
        const onLogout = () => {
            setIsAuthenticated(false);
            if (location.pathname !== "/login") {
                toast.info("Сессия завершена. Войдите снова.");
                navigate("/login", { replace: true });
            }
        };
        window.addEventListener("auth:logout", onLogout);
        return () => window.removeEventListener("auth:logout", onLogout);
    }, [navigate, location.pathname]);

    // инициализация: мягко освежаем сессию и проверяем её
    useEffect(() => {
        const init = async () => {
            try {
                await touchSession(); // если есть refresh, обновит access
            } catch {
                /* ignore */
            }
            const valid = await validateSession(); // GET /users/me
            setIsAuthenticated(valid);
            setAuthReady(true);
        };
        void init();
    }, []);

    // после логина (колбэк из <Login/>)
    const handleAuthSuccess = async () => {
        try {
            await touchSession();
        } catch {
            /* ignore */
        }
        const valid = await validateSession();
        setIsAuthenticated(valid);
        if (valid) {
            toast.success("Successful Login!", { toastId: "auth-login" });
            navigate("/app", { replace: true });
            setTimeout(() => {
                void warnOnLogin();
            }, 0);
        } else {
            toast.error("Login failed: no session detected.");
        }
    };

    // предупреждение о скором окончании периода
    const warnOnLogin = async () => {
        try {
            const res = await fetchBillingStatus();
            const endRaw =
                res.status === "TRIAL"
                    ? res.trialEnd
                    : res.status === "ACTIVE"
                        ? res.currentPeriodEnd
                        : undefined;
            if (!endRaw) return;

            const daysLeft =
                typeof res.daysLeft === "number"
                    ? Math.max(0, res.daysLeft)
                    : Math.max(
                        0,
                        Math.ceil((new Date(endRaw).getTime() - Date.now()) / 86_400_000)
                    );

            const shouldWarn =
                (res.status === "TRIAL" || res.status === "ACTIVE") && daysLeft <= 2;
            if (shouldWarn) {
                toast.warn(
                    res.status === "TRIAL"
                        ? `Your trial ends in ${daysLeft} day(s).`
                        : `Your access period ends in ${daysLeft} day(s).`,
                    { toastId: "billing-warn" }
                );
            }
        } catch {
            /* ignore */
        }
    };

    const handleLogout = async () => {
        try {
            await apiLogout(); // попросим сервер очистить куки
        } catch {
            /* ignore */
        }
        setIsAuthenticated(false);
        toast.info("Successful Logout!", { toastId: "auth-logout" });
        navigate("/login", { replace: true });
    };

    // простой лоадер, пока не знаем статус авторизации
    if (!authReady) {
        return (
            <>
                <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    newestOnTop
                    limit={3}
                />
                <div style={{ padding: 24 }}>Loading...</div>
            </>
        );
    }

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={4000}
                newestOnTop
                limit={3}
            />
            <Routes>
                {/* /login: если уже вошли — редирект в /app */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/app" replace />
                        ) : (
                            <Login onSuccess={handleAuthSuccess} />
                        )
                    }
                />
                <Route path="/register" element={<Register onSuccess={() => {}} />} />
                <Route path="/confirmed" element={<Confirmation />} />

                {/* приватные под /app */}
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

                {/* дефолтные редиректы */}
                <Route
                    path="/"
                    element={
                        <Navigate to={isAuthenticated ? "/app" : "/login"} replace />
                    }
                />
                <Route
                    path="*"
                    element={
                        <Navigate to={isAuthenticated ? "/app" : "/login"} replace />
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
