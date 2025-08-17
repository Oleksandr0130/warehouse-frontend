import React, { useState } from 'react';
import { loginUser } from '../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/AuthLoginAndRegister.css';
import { AxiosError } from 'axios';
import logo from '../assets/flowqr-logo.png';

interface LoginProps {
    onSuccess: () => void;
    onSwitch: () => void; // переключить на регистрацию
}

const Login: React.FC<LoginProps> = ({ onSuccess, onSwitch }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await loginUser({
                username: credentials.username,
                password: credentials.password,
            });
            localStorage.setItem('token', response.data.token);
            onSuccess();
        } catch (err) {
            if (err instanceof AxiosError && err.response) {
                const status = err.response.status;
                const errorData = err.response.data as { message?: string };
                const msg = errorData?.message || 'Incorrect username or password';
                console.error(`Login error ${status}:`, msg);
                toast.error(`Login failed (${status}). ${msg}`);
            } else {
                console.error('Unknown login error:', err);
                toast.error('Login failed. Please try again.');
            }
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <img src={logo} alt="FlowQR" className="app-logo" />

                <form className="auth-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="username"
                        placeholder="Email"
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
                    <button type="submit" className="auth-button">LOGIN</button>
                </form>

                <div className="auth-alt">
                    DON’T HAVE AN ACCOUNT?{' '}
                    <button type="button" onClick={onSwitch}>SIGN UP</button>
                </div>

                <footer className="auth-footer">
                    © 2025 Aleksander Starikov. <span>All rights reserved.</span>
                </footer>
            </div>
        </div>
    );
};

export default Login;
