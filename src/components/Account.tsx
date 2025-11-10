// src/components/Account.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { fetchMe, adminCreateUser, AdminCreateUserRequest, MeDto, deleteAccount } from '../api';
import { toast } from 'react-toastify';
import '../styles/Account.css';
import SubscriptionBanner from './SubscriptionBanner';
import { useNavigate } from 'react-router-dom';

const Account: React.FC = () => {
    const [me, setMe] = useState<MeDto | null>(null);
    const [loading, setLoading] = useState(false);

    // форма создания пользователя (для админа)
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
        setNewUser((prev) => ({ ...prev, [name]: value }));
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

    const initials = useMemo(() => {
        const src = me?.username || me?.email || '';
        return src
            .split(/[\s.@_]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase())
            .join('');
    }, [me]);

    return (
        <div className="acc">
            {/* HERO: шапка профиля */}
            <section className="acc-hero">
                <div className="acc-hero__bg" />
                <div className="acc-hero__content">
                    <div className="acc-hero__avatar" aria-hidden>
                        <span>{initials || 'U'}</span>
                    </div>
                    <div className="acc-hero__meta">
                        <div className="acc-hero__name">{me?.username ?? '—'}</div>
                        <div className="acc-hero__sub">
                            <span>{me?.email ?? '—'}</span>
                            <span className="acc-dot">•</span>
                            <span>{me?.companyName ?? 'No company'}</span>
                        </div>
                    </div>
                    <div className={`acc-role ${me?.admin ? 'acc-role--admin' : 'acc-role--user'}`}>
                        {me?.admin ? 'Admin' : 'User'}
                    </div>
                </div>
            </section>

            {/* Встроенный баннер подписки (как в макете) */}
            <div className="acc-section">
                <SubscriptionBanner embedded />
            </div>

            {!me ? (
                <div className="acc-card">Loading…</div>
            ) : (
                <>
                    {/* GRID карточек с деталями */}
                    <section className="acc-grid">
                        <div className="acc-card">
                            <div className="acc-card__title">Profile</div>
                            <div className="acc-kv">
                                <div className="acc-kv__row">
                                    <span>Username</span>
                                    <b>{me.username}</b>
                                </div>
                                <div className="acc-kv__row">
                                    <span>Email</span>
                                    <b>{me.email}</b>
                                </div>
                                <div className="acc-kv__row">
                                    <span>Role</span>
                                    <b>{me.admin ? 'Admin' : 'User'}</b>
                                </div>
                                <div className="acc-kv__row">
                                    <span>Company</span>
                                    <b>{me.companyName ?? '—'}</b>
                                </div>
                            </div>
                        </div>

                        <div className="acc-card">
                            <div className="acc-card__title">Security</div>
                            <p className="acc-text">
                                Keep your credentials secure. If you suspect unauthorized access, change your password immediately from
                                the login screen.
                            </p>
                            <div className="acc-actions">
                                <a className="ui-btn ui-btn--outline" href="/login">
                                    Sign out from other devices
                                </a>
                            </div>
                        </div>

                        <div className="acc-card">
                            <div className="acc-card__title">Danger zone</div>
                            <p className="acc-text">Delete your account and all associated data. This action is irreversible.</p>
                            <button className="acc-btn acc-btn--danger" onClick={handleDeleteAccount}>
                                Delete my account
                            </button>
                        </div>
                    </section>

                    {/* Админ-секция: создание пользователя */}
                    {me.admin && (
                        <section className="acc-section">
                            <div className="acc-card">
                                <div className="acc-card__title">Create user</div>
                                <form className="acc-form" onSubmit={handleCreate}>
                                    <div className="ui-field">
                                        <label className="ui-label">Username</label>
                                        <input
                                            className="ui-input"
                                            name="username"
                                            placeholder="User"
                                            value={newUser.username}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="ui-field">
                                        <label className="ui-label">Email</label>
                                        <input
                                            className="ui-input"
                                            name="email"
                                            type="email"
                                            placeholder="email@example.com"
                                            value={newUser.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="ui-field">
                                        <label className="ui-label">Password</label>
                                        <input
                                            className="ui-input"
                                            name="password"
                                            type="password"
                                            placeholder="Password"
                                            value={newUser.password}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="acc-actions">
                                        <button className="ui-btn ui-btn--primary" type="submit" disabled={loading}>
                                            {loading ? 'Adding…' : 'Create'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
};

export default Account;
