// src/components/Register.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Register.css';   // 👈 отдельный css только для регистрации
import logo from '../assets/flowqr-logo.png';

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
            toast.success('Registration successfully sent. Please check your email for confirmation.');
            onSuccess?.();
            navigate('/login', { replace: true });
        } catch (err) {
            console.error(err);
            toast.error('Registration error');
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">
                <img src={logo} alt="FlowQR" className="register-logo" />

                <h1 className="register-title">Create your account</h1>

                <form className="register-form" onSubmit={handleSubmit}>
                    <input
                        className="register-input"
                        name="username"
                        placeholder="User"
                        value={form.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="register-input"
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="register-input"
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="register-input"
                        name="companyName"
                        placeholder="Company name"
                        value={form.companyName}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" className="register-button">Sign up</button>
                </form>

                <div className="register-alt">
                    Already have an account?{' '}
                    <button type="button" onClick={() => navigate('/login')}>
                        Login
                    </button>
                </div>

                <footer className="register-footer">
                    © 2025 Aleksander Starikov. <span>All rights reserved.</span>
                </footer>
            </div>
        </div>
    );
};

export default Register;
