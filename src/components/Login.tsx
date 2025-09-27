// src/components/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { loginUser } from '../api';
import '../styles/Login.css';
import logo from '../assets/flowqr-logo.png';

interface LoginProps {
    onSuccess?: () => void;
}

type FieldErrors = {
    username?: string;
    password?: string;
};

/** детектор Android WebView вашего приложения */
const isAndroidApp = (() => {
    try {
        return typeof navigator !== 'undefined' && navigator.userAgent.includes('FlowQRApp/Android');
    } catch {
        return false;
    }
})();

/** единая точка доступа к стору: sessionStorage на Android, иначе localStorage */
function getStorage(): Storage {
    try {
        return isAndroidApp ? sessionStorage : localStorage;
    } catch {
        return localStorage;
    }
}

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name as keyof FieldErrors]) {
            setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        }
        if (formError) setFormError(null);
    };

    const doLogin = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setFormError(null);
        setFieldErrors({});

        try {
            const res = await loginUser({
                username: credentials.username,
                password: credentials.password,
            });

            // ожидаемые варианты ответа сервера:
            // 1) { accessToken, refreshToken }
            // 2) { token } — старый вариант
            const data: any = res?.data ?? {};
            const accessToken: string | undefined = data.accessToken ?? data.token;
            const refreshToken: string | undefined = data.refreshToken;

            if (!accessToken) {
                throw new Error('Missing access token in response');
            }

            const storage = getStorage();
            storage.setItem(ACCESS_KEY, accessToken);
            if (refreshToken) storage.setItem(REFRESH_KEY, refreshToken);

            onSuccess?.();
            navigate('/app', { replace: true });
        } catch (err) {
            if (err instanceof AxiosError) {
                const status = err.response?.status;
                const serverMsg = (err.response?.data as { message?: string } | undefined)?.message;

                if (status === 400 || status === 401) {
                    const msg = serverMsg || 'Incorrect username or password';
                    setFormError(msg);
                    setFieldErrors({ password: msg });
                } else if (!err.response) {
                    setFormError('Network error. Please check your connection and try again.');
                } else {
                    setFormError(serverMsg || 'Something went wrong. Please try again.');
                }
            } else {
                setFormError('Unexpected error. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            doLogin();
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <img src={logo} alt="FlowQR" className="login-logo" />

                {formError && (
                    <div className="form-error" role="alert" aria-live="assertive">
                        {formError}
                    </div>
                )}

                <div className="login-form" role="form" aria-label="Login form">
                    <div className="field">
                        <input
                            type="text"
                            name="username"
                            placeholder="User"
                            value={credentials.username}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            required
                            className={fieldErrors.username ? 'input-error' : ''}
                            autoComplete="username"
                        />
                        {fieldErrors.username && (
                            <div className="error-text" role="alert">
                                {fieldErrors.username}
                            </div>
                        )}
                    </div>

                    <div className="field">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={credentials.password}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            required
                            className={fieldErrors.password ? 'input-error' : ''}
                            autoComplete="current-password"
                        />
                        {fieldErrors.password && (
                            <div className="error-text" role="alert">
                                {fieldErrors.password}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="login-button"
                        disabled={isSubmitting}
                        onClick={doLogin}
                    >
                        {isSubmitting ? 'Logging in…' : 'Login'}
                    </button>
                </div>

                <div className="login-alt">
                    Don’t have an account?{' '}
                    <button type="button" onClick={() => navigate('/register')}>
                        Sign up
                    </button>
                </div>

                <footer className="login-footer">
                    © 2025 Aleksander Starikov. <span>All rights reserved.</span>
                </footer>
            </div>
        </div>
    );
};

export default Login;
