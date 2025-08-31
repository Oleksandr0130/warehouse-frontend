// AuthManager.ts
import axios from 'axios';

const BASE_URL = '/api'; // Базовый URL для обработки токенов

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
};

const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

// Проверка токенов
const validateTokens = async (): Promise<boolean> => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        return false; // Refresh Token отсутствует
    }

    if (!accessToken) {
        // Если Access Token истёк, пытаемся обновить
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