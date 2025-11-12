import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { loginUser } from '../api';
import '../styles/Login.css';
import logo from '../assets/flowqr-logo.png';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface LoginProps {
    onSuccess?: () => void;
}

type FieldErrors = {
    username?: string;
    password?: string;
};

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name as keyof FieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        }
        if (formError) setFormError(null);
    };

    const doLogin = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setFormError(null);
        setFieldErrors({});
        try {
            const res = await loginUser({ username: credentials.username, password: credentials.password });
            localStorage.setItem('token', (res as any).data.token);
            onSuccess?.();
            navigate('/app', { replace: true });
        } catch (err) {
            if (err instanceof AxiosError) {
                const status = err.response?.status;
                const serverMsg = (err.response?.data as { message?: string } | undefined)?.message;
                if (status === 400 || status === 401) {
                    const msg = serverMsg || t('login.errors.incorrect');
                    setFormError(msg);
                    setFieldErrors({ password: msg });
                } else if (!err.response) {
                    setFormError(t('login.errors.network'));
                } else {
                    setFormError(serverMsg || t('login.errors.generic'));
                }
            } else {
                setFormError(t('login.errors.unexpected'));
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
                <div className="login-card-top" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:12}}>
                    <img src={logo} alt="FlowQR" className="login-logo" />
                    <LanguageSwitcher />
                </div>

                {formError && (
                    <div className="form-error" role="alert" aria-live="assertive">
                        {formError}
                    </div>
                )}

                <div className="login-form" role="form" aria-label={t('login.formAria')}>
                    <div className="field">
                        <input
                            type="text"
                            name="username"
                            placeholder={t('login.fields.username.placeholder')}
                            value={credentials.username}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            required
                            className={fieldErrors.username ? 'input-error' : ''}
                            autoComplete="username"
                            aria-label={t('login.fields.username.aria')}
                        />
                        {fieldErrors.username && <div className="error-text" role="alert">{fieldErrors.username}</div>}
                    </div>

                    <div className="field">
                        <input
                            type="password"
                            name="password"
                            placeholder={t('login.fields.password.placeholder')}
                            value={credentials.password}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            required
                            className={fieldErrors.password ? 'input-error' : ''}
                            autoComplete="current-password"
                            aria-label={t('login.fields.password.aria')}
                        />
                        {fieldErrors.password && <div className="error-text" role="alert">{fieldErrors.password}</div>}
                    </div>

                    <button type="button" className="login-button" disabled={isSubmitting} onClick={doLogin}>
                        {isSubmitting ? t('login.cta.progress') : t('login.cta.submit')}
                    </button>
                </div>

                <div className="login-alt">
                    {t('login.noAccount.question')}{' '}
                    <button type="button" onClick={() => navigate('/register')}>
                        {t('login.noAccount.signup')}
                    </button>
                </div>

                <footer className="login-footer">
                    © 2025 Aleksander Starikov. <span>{t('login.footer.rights')}</span>
                </footer>
            </div>
        </div>
    );
};

export default Login;
