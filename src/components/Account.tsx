// src/components/Account.tsx
import React, { useEffect, useState } from 'react';
import { fetchMe, adminCreateUser, AdminCreateUserRequest, MeDto } from '../api';
import { toast } from 'react-toastify';
import '../styles/Account.css';
import SubscriptionBanner from "./SubscriptionBanner.tsx";
import { deleteAccount } from '../api';
import { useNavigate } from 'react-router-dom';

const Account: React.FC = () => {
    const [me, setMe] = useState<MeDto | null>(null);

    // формы для админа
    const [newUser, setNewUser] = useState<AdminCreateUserRequest>({
        username: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

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
        if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            return;
        }
        try {
            await deleteAccount();
            toast.success("Your account has been deleted.");
            navigate("/login", { replace: true });
        } catch {
            toast.error("Failed to delete account");
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

    return (
        <div className="account-page">
            <h2 className="account-title">Account Settings</h2>

            <SubscriptionBanner embedded />

            {!me ? (
                <div className="account-card">Loading...</div>
            ) : (
                <>
                    <div className="account-card">
                        <div className="row"><span>Username</span><b>{me.username}</b></div>
                        <div className="row"><span>Email</span><b>{me.email}</b></div>
                        <div className="row"><span>Company</span><b>{me.companyName ?? '—'}</b></div>
                        <div className="row"><span>Role</span><b>{me.admin ? 'Admin' : 'User'}</b></div>
                        <button className="delete-btn" onClick={handleDeleteAccount}>
                            Delete my account
                        </button>
                    </div>

                    {me.admin && (
                        <div className="account-card">
                            <h3 className="account-subtitle">Invite New Member</h3>
                            <form className="admin-form" onSubmit={handleCreate}>
                                <input
                                    className="account-input"
                                    name="username"
                                    placeholder="Enter username"
                                    value={newUser.username}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    className="account-input"
                                    name="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={newUser.email}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    className="account-input"
                                    name="password"
                                    type="password"
                                    placeholder="Password"
                                    value={newUser.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="account-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding…' : 'Create User'}
                                </button>
                            </form>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Account;
