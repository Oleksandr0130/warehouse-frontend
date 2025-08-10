// src/components/Register.tsx
import React, { useState } from 'react';
import { registerUser } from '../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Register.css';

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

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        try {
            await registerUser(form); // backend теперь ждёт companyName
            toast.success(
                'Registration successfully sent. Please check your email for confirmation.'
            );
            onSuccess();
        } catch (err) {
            console.error(err);
            toast.error('Registration error');
        }
    };

    return (
        <div className="register-container">
            <h2>FlowQR</h2>
            <form onSubmit={handleSubmit}>
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
                {/* Раньше здесь был select роли — мы его убрали */}
                <button type="submit">Registration</button>
            </form>

            <footer className="register-footer">
                <p>
                    © 2025 Aleksander Starikov. <br />
                    <span>All rights reserved.</span>
                </p>
            </footer>
        </div>
    );
};

export default Register;
