import React, { useEffect, useState } from 'react';
import { fetchMe, adminCreateUser, AdminCreateUserRequest, MeDto } from '../api';
import { toast } from 'react-toastify';
import './Account.css';

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
                toast.error('Не удалось получить профиль');
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
            toast.success('Пользователь создан');
            setNewUser({ username: '', email: '', password: '' });
        } catch {
            toast.error('Не удалось создать пользователя');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="account-wrap">
            <h2>Личный кабинет</h2>

            {!me ? (
                <div className="account-card">Загрузка...</div>
            ) : (
                <>
                    <div className="account-card">
                        <div className="row"><span>Ник:</span><b>{me.username}</b></div>
                        <div className="row"><span>Email:</span><b>{me.email}</b></div>
                        <div className="row"><span>Компания:</span><b>{me.companyName ?? '—'}</b></div>
                        <div className="row"><span>Роль:</span><b>{me.admin ? 'Администратор' : 'Пользователь'}</b></div>
                    </div>

                    {me.admin && (
                        <div className="account-card">
                            <h3>Создать пользователя</h3>
                            <form className="admin-form" onSubmit={handleCreate}>
                                <input
                                    name="username"
                                    placeholder="Имя пользователя"
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
                                    placeholder="Пароль"
                                    value={newUser.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Создаю...' : 'Создать'}
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
