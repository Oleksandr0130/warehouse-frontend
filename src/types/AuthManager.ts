import axios from 'axios';

/**
 * Cookie-only схема:
 * - НЕ используем localStorage
 * - НЕ выставляем Authorization
 * - Просто проверяем сессию запросом к /users/me
 */

const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

export const validateTokens = async (): Promise<boolean> => {
    try {
        await axios.get(`${BASE_URL}/users/me`, { withCredentials: true });
        return true;
    } catch {
        return false;
    }
};

export const logout = () => {
    // В cookie-схеме обычно серверный logout не обязателен.
    // Если на бэке будет /auth/logout (чистит cookies) — можно дернуть его тут.
    // axios.post(`${BASE_URL}/auth/logout`, null, { withCredentials: true }).catch(() => {});
};
