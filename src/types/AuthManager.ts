// AuthManager.ts
import axios from 'axios';

const BASE_URL = '/api'; // Базовый URL для обработки токенов

// Определяем, запущено ли в Android WebView вашего приложения
const isAndroidApp = (() => {
    try {
        return typeof navigator !== 'undefined' && navigator.userAgent.includes('FlowQRApp/Android');
    } catch {
        return false;
    }
})();

// Безопасно получаем хранилище (sessionStorage для Android-приложения, иначе localStorage)
function getStorage(): Storage {
    try {
        return isAndroidApp ? sessionStorage : localStorage;
    } catch {
        // Фолбэк на localStorage, если что-то пошло не так
        return localStorage;
    }
}

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

const getAccessToken = () => getStorage().getItem(ACCESS_KEY);
const getRefreshToken = () => getStorage().getItem(REFRESH_KEY);

const setTokens = (accessToken: string, refreshToken: string) => {
    const storage = getStorage();
    storage.setItem(ACCESS_KEY, accessToken);
    storage.setItem(REFRESH_KEY, refreshToken);
};

const clearTokens = () => {
    const storage = getStorage();
    storage.removeItem(ACCESS_KEY);
    storage.removeItem(REFRESH_KEY);
};

// Проверка токенов
const validateTokens = async (): Promise<boolean> => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        return false; // Refresh Token отсутствует
    }

    if (!accessToken) {
        // Если Access Token отсутствует/истёк, пытаемся обновить
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

    return true; // Токены валидны
};

// Автоматическое обновление токена
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
