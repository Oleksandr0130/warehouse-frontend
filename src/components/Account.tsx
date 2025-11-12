// src/components/Account.tsx
import React, { useEffect, useState } from 'react';
import { fetchMe, adminCreateUser, AdminCreateUserRequest, MeDto, deleteAccount } from '../api';
import { toast } from 'react-toastify';
import '../styles/Account.css';
import SubscriptionBanner from "./SubscriptionBanner.tsx";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Account: React.FC = () => {
    const { t } = useTranslation();
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
                toast.error(t('account.errors.fetchMe'));
            }
        })();
    }, [t]);

    const navigate = useNavigate();

    const handleDeleteAccount = async () => {
        if (!window.confirm(t('account.delete.confirm'))) {
            return;
        }
        try {
            await deleteAccount();
            toast.success(t('account.delete.success'));
            navigate("/login", { replace: true });
        } catch {
            toast.error(t('account.delete.fail'));
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
            toast.success(t('account.admin.create.success'));
            setNewUser({ username: '', email: '', password: '' });
        } catch {
            toast.error(t('account.admin.create.fail'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="account-page">
            <h2 className="account-title">{t('account.title')}</h2>

            <SubscriptionBanner embedded />

            {!me ? (
                <div className="account-card">{t('common.loading')}</div>
            ) : (
                <>
                    <div className="account-card">
                        <div className="row"><span>{t('account.fields.user')}:</span><b>{me.username}</b></div>
                        <div className="row"><span>{t('account.fields.email')}:</span><b>{me.email}</b></div>
                        <div className="row"><span>{t('account.fields.company')}:</span><b>{me.companyName ?? '—'}</b></div>
                        <div className="row">
                            <span>{t('account.fields.role')}:</span>
                            <b>{me.admin ? t('account.roles.admin') : t('account.roles.user')}</b>
                        </div>
                        <button className="delete-btn" onClick={handleDeleteAccount}>
                            {t('account.delete.button')}
                        </button>
                    </div>

                    {me.admin && (
                        <div className="account-card">
                            <h3 className="account-subtitle">{t('account.admin.create.title')}</h3>
                            <form className="admin-form" onSubmit={handleCreate}>
                                <input
                                    className="account-input"
                                    name="username"
                                    placeholder={t('account.admin.form.usernamePlaceholder')}
                                    value={newUser.username}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    className="account-input"
                                    name="email"
                                    type="email"
                                    placeholder={t('account.admin.form.emailPlaceholder')}
                                    value={newUser.email}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    className="account-input"
                                    name="password"
                                    type="password"
                                    placeholder={t('account.admin.form.passwordPlaceholder')}
                                    value={newUser.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="account-btn"
                                    disabled={loading}
                                >
                                    {loading ? t('common.adding') : t('common.create')}
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
