import React, { useState } from 'react';
import { loginUser } from '../api';
import { toast} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'
import '../styles/Login.css';
import {AxiosError} from "axios";

interface LoginProps {
    onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    // const [message, setMessage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await loginUser({ username: credentials.username, password: credentials.password });
            localStorage.setItem('token', response.data.token);
            toast.success('Erfolgreiche Anmeldung!');
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
            toast.error('Falscher Benutzername/Passwort!');
        }
    };


    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>FlowQR</h2>
                <input
                    type="text"          // поменял тип на text, логин обычно не email
                    name="username"
                    placeholder="Benutzername"
                    value={credentials.username}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Passwort"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit" className="login-btn">Einloggen</button>
            </form>

            {/* Блок с информацией об авторских правах */}
            <footer className="login-footer">
                <p>© 2025 Alexander Starikov. <br/>
                    <span>Alle Rechte vorbehalten.</span>
                </p>
            </footer>
        </div>
    );
};

export default Login;