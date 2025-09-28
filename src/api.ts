// src/api.ts
import axios, {
    AxiosError,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
    AxiosRequestHeaders,
} from 'axios';

// ===== base =====
const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    withCredentials: true, // важно для cookie-сессий
});

// ===== storage (всегда localStorage) =====
function getStorage(): Storage {
    try { return localStorage; } catch { return sessionStorage; }
}
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

// ===== helpers =====
const AUTH_WHITELIST = [/^\/auth\/login\b/i, /^\/auth\/register\b/i, /^\/auth\/refresh\b/i, /^\/confirmation\b/i];

function stripBase(url?: string): string {
    if (!url) return '';
    if (url.startsWith('/')) return url;
    const base = String(api.defaults.baseURL ?? '').replace(/\/+$/, '');
    return url.startsWith(base) ? url.slice(base.length) || '/' : url;
}
function shouldSkipAuth(cfg: AxiosRequestConfig): boolean {
    const path = stripBase(cfg.url);
    return AUTH_WHITELIST.some((re) => re.test(path));
}
function setAuthHeader(headers: AxiosRequestHeaders, token: string) {
    headers['Authorization'] = `Bearer ${token}`;
}

// ===== request: проставляем Authorization (кроме /auth/*) =====
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (!shouldSkipAuth(config)) {
            const s = getStorage();
            const raw = s.getItem(ACCESS_KEY) ?? s.getItem('token'); // b/c
            if (raw) {
                const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
                config.headers = (config.headers ?? {}) as AxiosRequestHeaders;
                setAuthHeader(config.headers as AxiosRequestHeaders, token);
            }
        } else if (config.headers && 'Authorization' in config.headers) {
            delete (config.headers as any).Authorization;
        }
        return config;
    },
    (e) => Promise.reject(e)
);

// ===== response: 401 → один refresh-проход; 402 → мягкий редирект БЕЗ logout =====
api.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error: AxiosError) => {
        const status = error.response?.status;
        const original = (error.config ?? {}) as AxiosRequestConfig & { _retry?: boolean };

        // 402 Payment Required → только мягкий редирект на страницу оплаты, токены НЕ трогаем
        if (status === 402) {
            const onAccount = window.location.pathname.startsWith('/app/account');
            if (!onAccount) {
                // используем мягкую навигацию
                window.location.href = '/app/account';
            }
            return Promise.reject(error);
        }

        // 401 на /auth/* не трогаем
        if (status === 401 && shouldSkipAuth(original)) {
            return Promise.reject(error);
        }

        // 401 → один refresh
        if (status === 401 && !original._retry) {
            original._retry = true;
            try {
                const s = getStorage();
                const refreshToken = s.getItem(REFRESH_KEY);
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await api.post('/auth/refresh', { refreshToken }, { withCredentials: true });
                const newAccess =
                    data?.accessToken ?? data?.token ?? data?.jwt ?? data?.id_token ?? data?.access_token;
                const newRefresh = data?.refreshToken ?? data?.refresh_token ?? refreshToken;
                if (!newAccess) throw new Error('No access token in refresh response');

                s.setItem(ACCESS_KEY, newAccess);
                s.setItem(REFRESH_KEY, newRefresh);

                original.headers = (original.headers ?? {}) as AxiosRequestHeaders;
                (original.headers as AxiosRequestHeaders)['Authorization'] = `Bearer ${newAccess}`;

                return api(original);
            } catch (e) {
                // refresh провалился — не чистим тут session, пусть верхний слой решит (App.tsx слушает auth:logout)
                const s = getStorage();
                s.removeItem(ACCESS_KEY);
                // refresh можно оставить — возможно пользователь продлит подписку и мы перезайдём
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);

// ===== публичные API =====
export interface MeDto {
    username: string;
    email: string;
    companyName: string | null;
    admin: boolean;
}
export type BillingState = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'ANON' | 'NO_COMPANY';
export interface BillingStatusDto {
    status: BillingState;
    trialEnd?: string;
    currentPeriodEnd?: string;
    daysLeft?: number;
    isAdmin?: boolean;
    billingCurrency?: 'PLN' | 'EUR';
}

export const loginUser = (data: { username: string; password: string }) => api.post('/auth/login', data);
export const fetchMe = async (): Promise<MeDto> => (await api.get<MeDto>('/users/me')).data;
export const fetchBillingStatus = async (): Promise<BillingStatusDto> =>
    (await api.get<BillingStatusDto>('/billing/status')).data;

export default api;
