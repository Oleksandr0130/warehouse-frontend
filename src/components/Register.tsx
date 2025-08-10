import React, { useState } from 'react';
import { registerUser } from '../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/AuthLoginAndRegister.css';

interface RegisterProps {
    onSuccess: () => void;
}

interface RegisterForm {
    username: string;
    email: string;
    password: string;
    companyName: string;
}

const Register: React.FC<RegisterProps> = ({ onSuccess }) => {
    const [form, setForm] = useState<RegisterForm>({
        username: '',
        email: '',
        password: '',
        companyName: '',
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await registerUser(form);
            toast.success('Registration successful! Please check your email.');
            onSuccess();
        } catch (err) {
            console.error(err);
            toast.error('Registration error');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <img src="/flowqr-logo.png" alt="FlowQR Logo" className="app-logo" />
                <p className="app-subtitle">Create your account</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <input
                        name="username"
                        placeholder="User"
                        value={form.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="companyName"
                        placeholder="Company name"
                        value={form.companyName}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit">Registration</button>
                </form>

                <footer className="auth-footer">
                    © 2025 Aleksander Starikov. <span>All rights reserved.</span>
                </footer>
            </div>
        </div>
    );
};

export default Register;
