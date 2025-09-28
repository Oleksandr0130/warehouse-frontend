// types/AuthManager.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

// ВСЕГДА localStorage (переживает ротацию/рестарт WebView)
function storage(): Storage {
    try { return localStorage; } catch { return sessionStorage; }
}

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export function getAccessToken(): string | null {
    const s = storage();
    return s.getItem(ACCESS_KEY) ?? s.getItem('token') ?? null; // b/c "token"
}

export function getRefreshToken(): string | null {
    return storage().getItem(REFRESH_KEY);
}

export function setTokens(access?: string | null, refresh?: string | null) {
    const s = storage();
    if (access) s.setItem(ACCESS_KEY, access);
    if (refresh) s.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
    const s = storage();
    s.removeItem(ACCESS_KEY);
    s.removeItem(REFRESH_KEY);
    s.removeItem('token'); // b/c
}

/** Проверка/обновление токенов при старте/перезагрузке */
export async function validateTokens(): Promise<boolean> {
    const access = getAccessToken();
    const refresh = getRefreshToken();

    // Нет refresh → пробуем cookie-сессию
    if (!refresh) {
        try {
            await axios.get(`${BASE_URL}/users/me`, { withCredentials: true });
            return true;
        } catch {
            return false;
        }
    }

    // Потеряли access (например, после ротации) → обновляем
    if (!access) {
        try {
            const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh }, { withCredentials: true });
            const newAccess =
                data?.accessToken ?? data?.token ?? data?.jwt ?? data?.id_token ?? data?.access_token;
            const newRefresh = data?.refreshToken ?? data?.refresh_token ?? refresh;
            if (!newAccess) throw new Error('No access token in refresh response');
            setTokens(newAccess, newRefresh);
            return true;
        } catch {
            clearTokens();
            return false;
        }
    }

    return true;
}

/** На всякий случай — подтянуть access, если пропал */
export async function refreshTokensIfNeeded() {
    if (!getAccessToken()) {
        await validateTokens();
    }
}

/** Выход */
export function logout() {
    clearTokens();
    // пусть App.tsx обработает событие и сделает навигацию/тосты
    window.dispatchEvent(new CustomEvent('auth:logout'));
}
