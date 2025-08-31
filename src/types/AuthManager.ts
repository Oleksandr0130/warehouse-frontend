import axios from 'axios';

const BASE_URL = '/api';

/** Быстрая проверка: есть ли рабочая сессия (по кукам) */
const validateSession = async (): Promise<boolean> => {
    try {
        await axios.get(`${BASE_URL}/users/me`, { withCredentials: true });
        return true;
    } catch {
        return false;
    }
};

/** Мягко продлить сессию (обновить AccessToken по RefreshToken), если нужно */
const touchSession = async (): Promise<void> => {
    try {
        await axios.post(`${BASE_URL}/auth/refresh`, null, { withCredentials: true });
    } catch {
        /* ignore */
    }
};

/** Выход: попросим сервер стереть куки */
const logout = async () => {
    try {
        await axios.post(`${BASE_URL}/auth/logout`, null, { withCredentials: true });
    } catch {
        /* ignore */
    }
};

export { validateSession, touchSession, logout };
