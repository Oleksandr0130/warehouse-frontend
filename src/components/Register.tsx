// src/components/Register.tsx
import React, { useState } from 'react';
import { registerUser } from '../api';
import { toast} from "react-toastify";
import 'react-toastify/dist/dist/ReactToastify.css'
import '../styles/Register.css';

interface RegisterProps {
    onSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess }) => {
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'USER' });
    // const [message, setMessage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await registerUser(form);
            toast.success('Registrierung erfolgreich gesendet. Bitte überprüfen Sie Ihre E-Mail zur Bestätigung.');
            onSuccess(); // вызов после успешной регистрации
        } catch (err) {
            console.error(err);
            toast.error('Registrierungsfehler');
        }
    };


    return (
        <div className="register-container">
            <h2>Anmeldung</h2>
            <form onSubmit={handleSubmit}>
                <input name="username" placeholder="Benutzername" onChange={handleChange} required />
                <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
                <input name="password" type="password" placeholder="Passwort" onChange={handleChange} required />
                <select name="role" onChange={handleChange} defaultValue="USER">
                    <option value="USER">Benutzer</option>
                    <option value="ADMIN">Administrator</option>
                </select>
                <button type="submit">Registrieren</button>
            </form>
            {/*{message && <p>{message}</p>}*/}
            toast.configure()
        </div>
    );
};

export default Register;