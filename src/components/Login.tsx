// src/components/Login.tsx
import React, { useState } from 'react';
import { loginUser } from '../api';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Login.css';
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
            const response = await loginUser(credentials);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role); // Сохраняем роль пользователя
            localStorage.setItem('companyName', response.data.companyName); // Сохраняем имя компании
            toast.success('Успешный вход в систему!');
            onSuccess();
        } catch (err) {
            if (err instanceof AxiosError && err.response) {
                alert(`Ошибка входа: ${err.response.status} - ${err.response.data.message || 'Неизвестная ошибка'}`);
            } else {
                toast.error('Ошибка входа. Проверьте данные.');
            }
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Warehouse-QR</h2>
                <input
                    type="text"
                    name="username"
                    placeholder="Имя пользователя"
                    value={credentials.username}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Пароль"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit" className="login-btn">Войти</button>
            </form>
            <footer className="login-footer">
                <p>© 2025 Alexander Starikov. <br />
                    <span>Все права защищены.</span>
                </p>
            </footer>
        </div>
    );
};

export default Login;