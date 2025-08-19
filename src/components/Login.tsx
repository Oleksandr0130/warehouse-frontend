// src/components/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { loginUser } from '../api';
import '../styles/AuthLoginAndRegister.css';
import logo from '../assets/flowqr-logo.png';

interface LoginProps {
    onSuccess?: () => void;
}

type FieldErrors = {
    username?: string;
    password?: string;
};

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));

        // снять подсказку для конкретного поля при вводе
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
            localStorage.setItem('token', res.data.token);
            onSuccess?.();
            navigate('/app', { replace: true });
        } catch (err) {
            if (err instanceof AxiosError) {
                const status = err.response?.status;
                const serverMsg = (err.response?.data as { message?: string } | undefined)?.message;

                if (status === 400 || status === 401) {
                    const msg = serverMsg || 'Incorrect username or password';
                    setFormError(msg);
                    setFieldErrors({ password: msg }); // при желании добавь username: msg
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
        <div className="auth-page">
            <div className="auth-card">
                <img src={logo} alt="FlowQR" className="app-logo" />

                {/* Общая ошибка над формой */}
                {formError && (
                    <div className="form-error" role="alert" aria-live="assertive">
                        {formError}
                    </div>
                )}

                {/* Это не нативная форма: onSubmit не используем, чтобы не было перезагрузки */}
                <div className="auth-form" role="form" aria-label="Login form">
                    <div className="field">
                        <input
                            type="text"
                            name="username"
                            placeholder="Email"
                            value={credentials.username}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            required
                            className={fieldErrors.username ? 'input-error' : ''}
                            aria-invalid={!!fieldErrors.username}
                            aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                            autoComplete="username"
                        />
                        {fieldErrors.username && (
                            <div id="username-error" className="error-text" role="alert">
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
                            aria-invalid={!!fieldErrors.password}
                            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                            autoComplete="current-password"
                        />
                        {fieldErrors.password && (
                            <div id="password-error" className="error-text" role="alert">
                                {fieldErrors.password}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="auth-button"
                        disabled={isSubmitting}
                        onClick={doLogin}
                    >
                        {isSubmitting ? 'LOGGING IN…' : 'LOGIN'}
                    </button>
                </div>

                <div className="auth-alt">
                    DON’T HAVE AN ACCOUNT?{' '}
                    <button type="button" onClick={() => navigate('/register')}>
                        SIGN UP
                    </button>
                </div>

                <footer className="auth-footer">
                    © 2025 Aleksander Starikov. <span>All rights reserved.</span>
                </footer>
            </div>
        </div>
    );
};

export default Login;
