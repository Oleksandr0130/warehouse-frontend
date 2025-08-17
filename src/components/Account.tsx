import React, { useEffect, useState } from 'react';
import { fetchMe, adminCreateUser, AdminCreateUserRequest, MeDto } from '../api';
import { toast } from 'react-toastify';
import '../styles/Account.css'
import SubscriptionBanner from "./SubscriptionBanner.tsx";

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
        <div className="account-wrap">
            <h2>Personal account</h2>

            <SubscriptionBanner embedded />

            {!me ? (
                <div className="account-card">Loading...</div>
            ) : (
                <>
                    <div className="account-card">
                        <div className="row"><span>User:</span><b>{me.username}</b></div>
                        <div className="row"><span>Email:</span><b>{me.email}</b></div>
                        <div className="row"><span>Company:</span><b>{me.companyName ?? '—'}</b></div>
                        <div className="row"><span>Role:</span><b>{me.admin ? 'Admin' : 'User'}</b></div>
                    </div>

                    {me.admin && (
                        <div className="account-card">
                            <h3>Create User</h3>
                            <form className="admin-form" onSubmit={handleCreate}>
                                <input
                                    name="username"
                                    placeholder="User"
                                    value={newUser.username}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="Email"
                                    value={newUser.email}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="Password"
                                    value={newUser.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Add...' : 'Create'}
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
