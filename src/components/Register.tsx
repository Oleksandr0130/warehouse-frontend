// src/components/Register.tsx
import React, { useState } from 'react';
import { registerUser } from '../api';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Register.css';

interface RegisterProps {
    onSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess }) => {
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'USER',
        companyName: '' // Новое поле для имени компании
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.companyName.trim()) {
            toast.error('Имя компании обязательно для заполнения');
            return;
        }

        try {
            await registerUser(form);
            toast.success('Регистрация прошла успешно. Пожалуйста, проверьте вашу электронную почту для подтверждения.');
            onSuccess(); // вызов после успешной регистрации
        } catch (err) {
            console.error(err);
            toast.error('Ошибка регистрации. Проверьте введённые данные и повторите попытку.');
        }
    };

    return (
        <div className="register-container">
            <h2>Warehouse-QR</h2>
            <form onSubmit={handleSubmit}>
                <input
                    name="username"
                    placeholder="Имя пользователя"
                    onChange={handleChange}
                    required
                />
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    onChange={handleChange}
                    required
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Пароль"
                    onChange={handleChange}
                    required
                />
                <input
                    name="companyName"
                    placeholder="Имя компании"
                    onChange={handleChange}
                    required
                />
                <select name="role" onChange={handleChange} defaultValue="USER">
                    <option value="USER">Пользователь</option>
                    <option value="ADMIN">Администратор</option>
                </select>
                <button type="submit">Регистрация</button>
            </form>
            <footer className="register-footer">
                <p>© 2025 Alexander Starikov. <br />
                    <span>Все права защищены.</span>
                </p>
            </footer>
        </div>
    );
};

export default Register;