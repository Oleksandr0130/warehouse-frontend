// src/components/Account.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { fetchMe, adminCreateUser, AdminCreateUserRequest, MeDto, deleteAccount } from '../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../styles/Account.css';
import SubscriptionBanner from './SubscriptionBanner';

const Account: React.FC = () => {
    const [me, setMe] = useState<MeDto | null>(null);
    const [loading, setLoading] = useState(false);

    // формы для админа
    const [newUser, setNewUser] = useState<AdminCreateUserRequest>({
        username: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchMe();
                setMe(data);
            } catch {
                toast.error('Failed to get account');
            }
        })();
    }, []);

    const navigate = useNavigate();

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
        try {
            await deleteAccount();
            toast.success('Your account has been deleted.');
            navigate('/login', { replace: true });
        } catch {
            toast.error('Failed to delete account');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminCreateUser(newUser);
            toast.success('User created');
            setNewUser({ username: '', email: '', password: '' });
        } catch {
            toast.error('Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    // Инициалы для аватара
    const initials = useMemo(() => {
        const src = me?.username || me?.email || '';
        if (!src) return '';
        const parts = src.split(/[.\s_@-]+/).filter(Boolean);
        const a = (parts[0]?.[0] || '').toUpperCase();
        const b = (parts[1]?.[0] || '').toUpperCase();
        return (a + b).trim() || a || 'U';
    }, [me]);

    return (
        <div className="account-page">
            <div className="account-header">
                <h1 className="account-title">Account</h1>
                {/* При желании здесь можно добавить кнопку/линк «Edit profile» */}
            </div>

            {/* Встроенный тёмный баннер состояния подписки (как в макете) */}
            <SubscriptionBanner embedded />

            {!me ? (
                <div className="account-card">Loading...</div>
            ) : (
                <div className="account-grid">
                    {/* Левая колонка — профиль */}
                    <section className="account-card profile-card">
                        <div className="profile-head">
                            <div className="avatar">{initials}</div>
                            <div className="profile-meta">
                                <div className="profile-name">{me.username}</div>
                                <div className="profile-role">{me.admin ? 'Administrator' : 'User'}</div>
                            </div>
                        </div>

                        <div className="divider" />

                        <div className="rows">
                            <div className="row">
                                <span>Username</span>
                                <b>{me.username}</b>
                            </div>
                            <div className="row">
                                <span>Email</span>
                                <b>{me.email}</b>
                            </div>
                            <div className="row">
                                <span>Company</span>
                                <b>{me.companyName ?? '—'}</b>
                            </div>
                            <div className="row">
                                <span>Role</span>
                                <b>{me.admin ? 'Admin' : 'User'}</b>
                            </div>
                        </div>

                        <button className="delete-btn" onClick={handleDeleteAccount}>
                            Delete my account
                        </button>
                    </section>

                    {/* Правая колонка — админские действия */}
                    {me.admin && (
                        <section className="account-card admin-card">
                            <h3 className="account-subtitle">Create new user</h3>

                            <form className="admin-form" onSubmit={handleCreate}>
                                <label className="field">
                                    <span className="label">Username</span>
                                    <input
                                        className="account-input"
                                        name="username"
                                        placeholder="User"
                                        value={newUser.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label className="field">
                                    <span className="label">Email</span>
                                    <input
                                        className="account-input"
                                        name="email"
                                        type="email"
                                        placeholder="Email"
                                        value={newUser.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label className="field">
                                    <span className="label">Password</span>
                                    <input
                                        className="account-input"
                                        name="password"
                                        type="password"
                                        placeholder="Password"
                                        value={newUser.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <button type="submit" className="account-btn" disabled={loading}>
                                    {loading ? 'Adding…' : 'Create user'}
                                </button>
                            </form>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default Account;
