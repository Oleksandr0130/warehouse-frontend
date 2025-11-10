import React, { useEffect, useState } from 'react';
import {
    fetchMe,
    deleteAccount,
    adminCreateUser,
    AdminCreateUserRequest,
    // ↓ Если есть — подключи реальные вызовы. Иначе оставим заглушки ниже.
    // removeTeamMember,
    // beginSubscriptionCheckout,
} from '../api';
import SubscriptionBanner from './SubscriptionBanner';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../styles/Account.css';

type Role = 'Admin' | 'Manager' | 'User';

type TeamMember = {
    id: string;
    username: string;
    email: string;
    role: Role;
};

type MeDto = {
    username: string;
    email: string;
    admin: boolean;
    companyName?: string | null;

    // не обяз. поля — если твой API их возвращает, UI подхватит
    subscription?: {
        plan: 'Pro' | 'Free' | string;
        daysLeft: number;
        totalDays: number;
        renewsAt?: string; // ISO
    };

    team?: TeamMember[];
};

const plans = [
    { id: 'p1m', title: '1 Month', note: 'Best for trying out', price: 29, old: null, save: null },
    { id: 'p3m', title: '3 Months', note: 'Save 15%', price: 74, old: 87, save: 15 },
    { id: 'p12m', title: '12 Months', note: 'Best Value', price: 244, old: 348, save: 30, best: true },
];

const Account: React.FC = () => {
    const [me, setMe] = useState<MeDto | null>(null);
    const [loading, setLoading] = useState(false);

    // modal: extend subscription
    const [extendOpen, setExtendOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(plans[2].id);

    // invite form
    const [invite, setInvite] = useState<AdminCreateUserRequest>({
        username: '',
        email: '',
        password: '',
    });

    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const data = (await fetchMe()) as unknown as MeDto;
                setMe(data);
            } catch {
                toast.error('Failed to load account');
            }
        })();
    }, []);



    const isAdmin = !!me?.admin;

    /* ====== Actions ====== */
    const onDeleteAccount = async () => {
        if (!window.confirm('Delete your account and all data? This action cannot be undone.')) return;
        try {
            await deleteAccount();
            toast.success('Account deleted');
            navigate('/login', { replace: true });
        } catch {
            toast.error('Failed to delete account');
        }
    };

    const onInviteSubmit: React.FormEventHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminCreateUser(invite);
            toast.success('User invited');
            setInvite({ username: '', email: '', password: '' });
            // опционально обновить список из API:
            // const data = (await fetchMe()) as unknown as MeDto;
            // setMe(data);
            // временно добавим локально:
            setMe((prev) =>
                prev
                    ? {
                        ...prev,
                        team: [
                            ...(prev.team ?? []),
                            {
                                id: crypto.randomUUID(),
                                username: invite.username,
                                email: invite.email,
                                role: 'User',
                            },
                        ],
                    }
                    : prev
            );
        } catch {
            toast.error('Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const onRemoveMember = async (id: string) => {
        if (!window.confirm('Remove this member?')) return;
        try {
            // await removeTeamMember(id);
            setMe((prev) => (prev ? { ...prev, team: (prev.team ?? []).filter((m) => m.id !== id) } : prev));
            toast.success('Member removed');
        } catch {
            toast.error('Failed to remove member');
        }
    };

    const onContinueToPayment = async () => {
        try {
            // await beginSubscriptionCheckout(selectedPlan);
            window.location.href = '/billing';
        } catch {
            toast.error('Failed to start checkout');
        }
    };

    return (
        <div className="as">
            <h1 className="as-title">Account Settings</h1>
            <p className="as-sub">Manage your account, subscription, and team members</p>

            {/* SUBSCRIPTION BANNER */}
            <div className="as-section">
                <SubscriptionBanner
                    planLabel={me?.subscription?.plan ?? (isAdmin ? 'Pro Plan' : 'Free')}
                    daysLeft={me?.subscription?.daysLeft ?? 20}
                    totalDays={me?.subscription?.totalDays ?? 30}
                    renewsAt={me?.subscription?.renewsAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 22).toISOString()}
                    onExtend={() => setExtendOpen(true)}
                />
            </div>

            {/* ACCOUNT INFO */}
            <section className="as-card">
                <div className="as-card__head">
                    <div>
                        <div className="as-card__title">Account Information</div>
                        <div className="as-card__sub">Your personal account details</div>
                    </div>
                    <button className="as-btn as-btn--ghost">
                        <span className="as-ico as-ico--pencil" /> Edit
                    </button>
                </div>
                <div className="as-grid as-grid--2">
                    <div className="as-field">
                        <label className="as-label">
                            <span className="as-ico as-ico--user" />
                            Username
                        </label>
                        <input className="as-input" value={me?.username ?? ''} disabled />
                    </div>
                    <div className="as-field">
                        <label className="as-label">
                            <span className="as-ico as-ico--mail" />
                            Email
                        </label>
                        <input className="as-input" value={me?.email ?? ''} disabled />
                    </div>
                    <div className="as-field">
                        <label className="as-label">
                            <span className="as-ico as-ico--company" />
                            Company
                        </label>
                        <input className="as-input" value={me?.companyName ?? ''} disabled />
                    </div>
                    <div className="as-field">
                        <label className="as-label">
                            <span className="as-ico as-ico--shield" />
                            Role
                        </label>
                        <div className="as-badge as-badge--role">{isAdmin ? 'Admin' : 'User'}</div>
                    </div>
                </div>
            </section>

            {/* TEAM MANAGEMENT */}
            <section className="as-card">
                <div className="as-card__head">
                    <div>
                        <div className="as-card__title">Team Management</div>
                        <div className="as-card__sub">Invite team members and manage their access</div>
                    </div>
                </div>

                <div className="as-team">
                    <div className="as-team__list">
                        {(me?.team ?? []).map((m) => (
                            <div className="as-member" key={m.id}>
                                <div className="as-member__left">
                                    <div className="as-avatar">
                                        <span>{m.username?.[0]?.toUpperCase() ?? 'U'}</span>
                                    </div>
                                    <div className="as-member__meta">
                                        <div className="as-member__name">{m.username}</div>
                                        <div className="as-member__mail">{m.email}</div>
                                    </div>
                                </div>
                                <div className="as-member__right">
                  <span className={`as-pill ${m.role === 'Manager' ? 'is-manager' : m.role === 'Admin' ? 'is-admin' : ''}`}>
                    {m.role}
                  </span>
                                    <button className="as-icon-btn as-icon-btn--danger" onClick={() => onRemoveMember(m.id)} title="Remove">
                                        <span className="as-ico as-ico--trash" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Invite new member */}
                    {isAdmin && (
                        <>
                            <div className="as-sep" />
                            <form className="as-grid as-grid--2 as-invite" onSubmit={onInviteSubmit}>
                                <div className="as-field">
                                    <label className="as-label">
                                        <span className="as-ico as-ico--user" />
                                        Username
                                    </label>
                                    <input
                                        className="as-input"
                                        placeholder="Enter username"
                                        value={invite.username}
                                        onChange={(e) => setInvite((s) => ({ ...s, username: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="as-field">
                                    <label className="as-label">
                                        <span className="as-ico as-ico--mail" />
                                        Email
                                    </label>
                                    <input
                                        className="as-input"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={invite.email}
                                        onChange={(e) => setInvite((s) => ({ ...s, email: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="as-field">
                                    <label className="as-label">
                                        <span className="as-ico as-ico--lock" />
                                        Password
                                    </label>
                                    <input
                                        className="as-input"
                                        type="password"
                                        placeholder="••••••••"
                                        value={invite.password}
                                        onChange={(e) => setInvite((s) => ({ ...s, password: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="as-field">
                                    <label className="as-label">
                                        <span className="as-ico as-ico--shield" />
                                        Role
                                    </label>
                                    <select className="as-input" defaultValue="User" disabled>
                                        <option>User</option>
                                        <option>Manager</option>
                                        <option>Admin</option>
                                    </select>
                                </div>

                                <div className="as-grid__full">
                                    <button className="as-btn as-btn--primary" type="submit" disabled={loading}>
                                        <span className="as-ico as-ico--user-add" />
                                        {loading ? 'Creating…' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </section>

            {/* DANGER ZONE */}
            <section className="as-danger">
                <div className="as-danger__title">
                    <span className="as-ico as-ico--warning" />
                    Danger Zone
                </div>
                <div className="as-danger__sub">Irreversible actions that affect your account</div>

                <div className="as-danger__card">
                    <div className="as-danger__text">
                        <div className="as-danger__head">Delete Account</div>
                        <div className="as-danger__desc">Permanently delete your account and all associated data</div>
                    </div>
                    <button className="as-btn as-btn--danger" onClick={onDeleteAccount}>
                        Delete Account
                    </button>
                </div>
            </section>

            {/* MODAL: Extend subscription */}
            {extendOpen && (
                <div className="as-modal" onClick={() => setExtendOpen(false)}>
                    <div className="as-modal__dialog" onClick={(e) => e.stopPropagation()}>
                        <button className="as-modal__close" onClick={() => setExtendOpen(false)} aria-label="Close" />
                        <div className="as-modal__title">Extend Your Subscription</div>
                        <div className="as-modal__sub">Choose a plan to extend your access</div>

                        <div className="as-plans">
                            {plans.map((p) => (
                                <label key={p.id} className={`as-plan ${selectedPlan === p.id ? 'is-active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="plan"
                                        checked={selectedPlan === p.id}
                                        onChange={() => setSelectedPlan(p.id)}
                                    />
                                    <div className="as-plan__body">
                                        <div className="as-plan__title">
                                            {p.title}
                                            {p.best && <span className="as-pill is-best">Best Value</span>}
                                        </div>
                                        <div className="as-plan__note">{p.note}</div>
                                    </div>
                                    <div className="as-plan__price">
                                        €{p.price}
                                        {p.old && <span className="as-plan__old">€{p.old}</span>}
                                    </div>
                                </label>
                            ))}
                        </div>

                        <button className="as-btn as-btn--cta" onClick={onContinueToPayment}>
                            Continue to Payment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Account;
