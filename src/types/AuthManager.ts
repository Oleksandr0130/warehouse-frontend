// types/AuthManager.ts
import axios from 'axios';

const BASE_URL = '/api';

// Определяем Android WebView вашего приложения
const isAndroidApp = (() => {
    try {
        return typeof navigator !== 'undefined' && navigator.userAgent.includes('FlowQRApp/Android');
    } catch {
        return false;
    }
})();

// accessToken (Android) -> sessionStorage, refreshToken -> localStorage
const accessStore = (() => {
    try {
        return isAndroidApp ? sessionStorage : localStorage;
    } catch {
        return localStorage;
    }
})();
const refreshStore = localStorage;

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

const getAccessToken = () =>
    accessStore.getItem(ACCESS_KEY) ?? accessStore.getItem('token'); // b/c по старому ключу

const getRefreshToken = () => refreshStore.getItem(REFRESH_KEY);

const setTokens = (accessToken: string, refreshToken?: string) => {
    accessStore.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) refreshStore.setItem(REFRESH_KEY, refreshToken);
};

const clearTokens = () => {
    accessStore.removeItem(ACCESS_KEY);
    refreshStore.removeItem(REFRESH_KEY);
    // на всякий случай уберём старые ключи
    accessStore.removeItem('token');
};

// Проверка/обновление токенов (используется при старте/ротации)
const validateTokens = async (): Promise<boolean> => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    // Нет refresh — попробовать cookie-сессию (для веба), иначе неавторизован
    if (!refreshToken) {
        try {
            await axios.get(`${BASE_URL}/users/me`, { withCredentials: true });
            return true;
        } catch {
            return false;
        }
    }

    // Если access потеряли (например, после ротации на Android) — обновим по refresh
    if (!accessToken) {
        try {
            const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
            setTokens(response.data.accessToken, response.data.refreshToken);
            return true;
        } catch (error) {
            console.error('Ошибка обновления токенов:', error);
            clearTokens();
            return false;
        }
    }

    return true;
};

// Автоматическое обновление access при необходимости
const refreshTokensIfNeeded = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
        await validateTokens();
    }
};

// Выход
const logout = () => {
    clearTokens();
};

export { validateTokens, refreshTokensIfNeeded, logout };
