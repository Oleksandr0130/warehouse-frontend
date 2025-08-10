import React, { useState } from 'react';
import { loginUser } from '../api';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import '../styles/AuthLoginAndRegister.css';
import { AxiosError } from "axios";

interface LoginProps {
    onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await loginUser({
                username: credentials.username,
                password: credentials.password
            });
            localStorage.setItem('token', response.data.token);
            toast.success('Successful login!');
            onSuccess();
        } catch (err) {
            if (err instanceof AxiosError && err.response) {
                alert(`Ошибка входа: ${err.response.status} - ${err.response.data?.message || 'Неопределенная ошибка'}`);
            } else {
                alert('Unknown error login.');
            }
            toast.error('Incorrect username/password!');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <img src="/flowqr-logo.png" alt="FlowQR Logo" className="app-logo" />
                <p className="app-subtitle">Sign in to your account</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="username"
                        placeholder="User"
                        value={credentials.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit">Log in</button>
                </form>

                <footer className="auth-footer">
                    © 2025 Aleksander Starikov. <span>All rights reserved.</span>
                </footer>
            </div>
        </div>
    );
};

export default Login;
