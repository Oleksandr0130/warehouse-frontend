// src/components/Account.tsx
import React, { useEffect, useState } from 'react';
import {
    fetchMe,
    adminCreateUser,
    AdminCreateUserRequest,
    MeDto,
    deleteAccount,
    // ⬇️ новые API
    fetchTeam,
    deleteUserAdmin,
    updateUserRole,
    TeamUser,
} from '../api';
import { toast } from 'react-toastify';
import '../styles/Account.css';
import SubscriptionBanner from './SubscriptionBanner.tsx';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Account: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [me, setMe] = useState<MeDto | null>(null);
    const [loading, setLoading] = useState(false);

    // ─── Team state ─────────────────────────────────────────────
    const [team, setTeam] = useState<TeamUser[]>([]);
    const [teamLoading, setTeamLoading] = useState(false);

    // ─── Invite form ────────────────────────────────────────────
    const [newUser, setNewUser] = useState<AdminCreateUserRequest>({
        username: '',
        email: '',
        password: '',
    });
    const [newUserRole, setNewUserRole] = useState<'USER' | 'ADMIN'>('USER');

    // ─── effects ────────────────────────────────────────────────
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

    useEffect(() => {
        if (me?.admin) void loadTeam();
    }, [me]);

    const loadTeam = async () => {
        setTeamLoading(true);
        try {
            const list = await fetchTeam();
            setTeam(list);
        } catch {
            toast.error(t('account.team.errors.load', 'Failed to load team'));
        } finally {
            setTeamLoading(false);
        }
    };

    // ─── account deletion ───────────────────────────────────────
    const handleDeleteAccount = async () => {
        if (!window.confirm(t('account.delete.confirm'))) return;
        try {
            await deleteAccount();
            toast.success(t('account.delete.success'));
            navigate('/login', { replace: true });
        } catch {
            toast.error(t('account.delete.fail'));
        }
    };

    // ─── invite form ────────────────────────────────────────────
    const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // создаём пользователя
            await adminCreateUser(newUser);
            // если выбрана ADMIN — апдейтим роль
            if (newUserRole === 'ADMIN') {
                // найдём только что созданного по email
                const refreshed = await fetchTeam();
                const created = refreshed.find((u) => u.email?.toLowerCase() === newUser.email.toLowerCase());
                if (created) {
                    await updateUserRole(created.id, 'ADMIN');
                }
            }
            toast.success(t('account.admin.create.success'));
            setNewUser({ username: '', email: '', password: '' });
            setNewUserRole('USER');
            await loadTeam();
        } catch {
            toast.error(t('account.admin.create.fail'));
        } finally {
            setLoading(false);
        }
    };

    // ─── team actions ───────────────────────────────────────────
    const handleRoleChange = async (id: number, role: 'USER' | 'ADMIN') => {
        try {
            await updateUserRole(id, role);
            setTeam((prev) => prev.map((u) => (u.id === id ? { ...u, admin: role === 'ADMIN' } : u)));
            toast.success(t('account.team.success.role', 'Role updated'));
        } catch {
            toast.error(t('account.team.errors.role', 'Failed to update role'));
        }
    };

    const handleRemoveUser = async (id: number) => {
        if (!confirm(t('account.team.confirm.delete', 'Remove this member?'))) return;
        try {
            await deleteUserAdmin(id);
            setTeam((prev) => prev.filter((u) => u.id !== id));
            toast.success(t('account.team.success.delete', 'Member removed'));
        } catch {
            toast.error(t('account.team.errors.delete', 'Failed to remove member'));
        }
    };

    // ─── render ─────────────────────────────────────────────────
    return (
        <div className="account-page">
            <h2 className="account-title">{t('account.title')}</h2>

            <SubscriptionBanner embedded />

            {!me ? (
                <div className="account-card">{t('common.loading')}</div>
            ) : (
                <>
                    {/* Profile card */}
                    <div className="account-card">
                        <div className="row">
                            <span>{t('account.fields.user')}:</span>
                            <b>{me.username}</b>
                        </div>
                        <div className="row">
                            <span>{t('account.fields.email')}:</span>
                            <b>{me.email}</b>
                        </div>
                        <div className="row">
                            <span>{t('account.fields.company')}:</span>
                            <b>{me.companyName ?? '—'}</b>
                        </div>
                        <div className="row">
                            <span>{t('account.fields.role')}:</span>
                            <b>{me.admin ? t('account.roles.admin') : t('account.roles.user')}</b>
                        </div>
                        <button className="delete-btn" onClick={handleDeleteAccount}>
                            {t('account.delete.button')}
                        </button>
                    </div>

                    {/* Team management (admins only) */}
                    {me.admin && (
                        <div className="account-card team-card">
                            <div className="team-head">
                                <div>
                                    <div className="team-title">{t('account.team.title', 'Team Management')}</div>
                                    <div className="team-subtitle">
                                        {t('account.team.subtitle', 'Invite team members and manage their access')}
                                    </div>
                                </div>
                            </div>

                            {/* Members list */}
                            <div className="team-section">
                                <div className="team-section-title">{t('account.team.members', 'Team Members')}</div>

                                {teamLoading ? (
                                    <div className="team-skeleton" />
                                ) : team.length === 0 ? (
                                    <div className="team-empty">{t('account.team.empty', 'No members yet')}</div>
                                ) : (
                                    <ul className="team-list">
                                        {team.map((u) => (
                                            <li key={u.id} className="team-item">
                                                <div className="team-left">
                                                    <div className="avatar">{(u.username || u.email || '?')[0]?.toUpperCase()}</div>
                                                    <div className="who">
                                                        <div className="who-name">{u.username}</div>
                                                        <div className="who-email">{u.email}</div>
                                                    </div>
                                                </div>

                                                <div className="team-right">
                                                    <select
                                                        className={`role-pill ${u.admin ? 'role-admin' : 'role-user'}`}
                                                        value={u.admin ? 'ADMIN' : 'USER'}
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value as 'ADMIN' | 'USER')}
                                                        aria-label={t('account.team.aria.role', 'Change role')}
                                                    >
                                                        <option value="ADMIN">{t('account.team.roles.manager', 'Manager')}</option>
                                                        <option value="USER">{t('account.team.roles.user', 'User')}</option>
                                                    </select>

                                                    <button
                                                        className="icon-btn danger"
                                                        onClick={() => handleRemoveUser(u.id)}
                                                        aria-label={t('account.team.aria.delete', 'Remove member')}
                                                        title={t('account.team.aria.delete', 'Remove member')}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Invite form */}
                            <div className="team-section">
                                <div className="team-section-title">{t('account.team.invite', 'Invite New Member')}</div>

                                <form className="invite-grid" onSubmit={handleInvite}>
                                    <div className="field">
                                        <label className="label">{t('account.admin.form.usernamePlaceholder')}</label>
                                        <input
                                            className="account-input"
                                            name="username"
                                            placeholder={t('account.admin.form.usernamePlaceholder')}
                                            value={newUser.username}
                                            onChange={handleInviteChange}
                                            required
                                        />
                                    </div>

                                    <div className="field">
                                        <label className="label">{t('account.admin.form.emailPlaceholder')}</label>
                                        <input
                                            className="account-input"
                                            name="email"
                                            type="email"
                                            placeholder="user@example.com"
                                            value={newUser.email}
                                            onChange={handleInviteChange}
                                            required
                                        />
                                    </div>

                                    <div className="field">
                                        <label className="label">{t('account.admin.form.passwordPlaceholder')}</label>
                                        <input
                                            className="account-input"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={newUser.password}
                                            onChange={handleInviteChange}
                                            required
                                        />
                                    </div>

                                    <div className="field">
                                        <label className="label">{t('account.team.form.role', 'Role')}</label>
                                        <select
                                            className="account-input select"
                                            value={newUserRole}
                                            onChange={(e) => setNewUserRole(e.target.value as 'USER' | 'ADMIN')}
                                        >
                                            <option value="USER">{t('account.team.roles.user', 'User')}</option>
                                            <option value="ADMIN">{t('account.team.roles.manager', 'Manager')}</option>
                                        </select>
                                    </div>

                                    <div className="invite-submit">
                                        <button type="submit" className="invite-btn" disabled={loading}>
                                            <span className="invite-btn__icon">👥</span>
                                            {loading ? t('common.adding') : t('account.team.cta.create', 'Create User')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Account;
