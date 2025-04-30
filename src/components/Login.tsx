import React, { useState } from 'react';
import { loginUser } from '../api';
import '../styles/Login.css';
import {AxiosError} from "axios";

interface LoginProps {
    onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [message, setMessage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await loginUser({ username: credentials.username, password: credentials.password });
            localStorage.setItem('token', response.data.token);
            setMessage('Успешный вход!');
            onSuccess();

        } catch (err) {
            if (err instanceof AxiosError && err.response) {
                console.error('API Response:', err.response);
                console.error('API Статус:', err.response.status);
                console.error('API Данные ошибки:', err.response.data);
                alert(`Ошибка входа: ${err.response.status} - ${err.response.data?.message || 'Неопределенная ошибка'}`);
            } else {
                console.error('Ошибка:', err);
                alert('Произошла неизвестная ошибка при входе.');
            }
            setMessage('Ошибка входа');
        }
    };


    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Логин</h2>
                <input
                    type="text"          // поменял тип на text, логин обычно не email
                    name="username"
                    placeholder="Логин"
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
            {message && <p>{message}</p>}
        </div>
    );
};

export default Login;