// src/components/Register.tsx
import React, { useState } from 'react';
import { registerUser } from '../api';
import '../styles/Register.css';

interface RegisterProps {
    onSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess }) => {
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'USER' });
    const [message, setMessage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await registerUser(form);
            setMessage('Регистрация успешно отправлена. Проверьте почту для подтверждения.');
            onSuccess(); // вызов после успешной регистрации
        } catch (err) {
            console.error(err);
            setMessage('Ошибка регистрации');
        }
    };

    return (
        <div className="register-container">
            <h2>Регистрация</h2>
            <form onSubmit={handleSubmit}>
                <input name="username" placeholder="Имя пользователя" onChange={handleChange} required />
                <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
                <input name="password" type="password" placeholder="Пароль" onChange={handleChange} required />
                <select name="role" onChange={handleChange} defaultValue="USER">
                    <option value="USER">Пользователь</option>
                    <option value="ADMIN">Админ</option>
                </select>
                <button type="submit">Зарегистрироваться</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default Register;