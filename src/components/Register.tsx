import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Register.css';
import logo from '../assets/flowqr-logo.png';
import { useTranslation } from 'react-i18next';

interface RegisterProps {
    onSuccess?: () => void;
}

interface RegisterForm {
    username: string;
    email: string;
    password: string;
    companyName: string;
}

const Register: React.FC<RegisterProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [form, setForm] = useState<RegisterForm>({
        username: '',
        email: '',
        password: '',
        companyName: '',
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await registerUser(form);
            toast.success(t('register.success'));
            onSuccess?.();
            navigate('/login', { replace: true });
        } catch (err) {
            console.error(err);
            toast.error(t('register.error'));
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">
                <img src={logo} alt="FlowQR" className="register-logo" />

                <h1 className="register-title">{t('register.title')}</h1>

                <form className="register-form" onSubmit={handleSubmit} aria-label={t('register.aria.form')}>
                    <input
                        className="register-input"
                        name="username"
                        placeholder={t('register.fields.username')}
                        value={form.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="register-input"
                        name="email"
                        type="email"
                        placeholder={t('register.fields.email')}
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="register-input"
                        name="password"
                        type="password"
                        placeholder={t('register.fields.password')}
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="register-input"
                        name="companyName"
                        placeholder={t('register.fields.companyName')}
                        value={form.companyName}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" className="register-button">
                        {t('register.cta.submit')}
                    </button>
                </form>

                <div className="register-alt">
                    {t('register.alt.hasAccount')}{' '}
                    <button type="button" onClick={() => navigate('/login')}>
                        {t('register.alt.login')}
                    </button>
                </div>

                <footer className="register-footer">
                    © 2025 Aleksander Starikov. <span>{t('register.footer.rights')}</span>
                </footer>
            </div>
        </div>
    );
};

export default Register;
