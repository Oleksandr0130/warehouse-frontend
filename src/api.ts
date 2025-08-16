import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// ====== Настройки ======
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'; // на проде: https://warehouse-qr-app-8adwv.ondigitalocean.app/api
const REFRESH_PATH = '/auth/refresh'; // поправьте, если у вас другой путь

// ====== Хранилище токенов ======
function getAccessToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('accessToken');
}
function getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
}
function setAccessToken(token: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('accessToken', token);
}
function setRefreshToken(token: string) {
    localStorage.setItem('refreshToken', token);
}
function clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

// ====== Инстанс ======
export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    timeout: 15000,
});

// ====== Подстановка Bearer ко всем запросам ======
function attachAuth(config: InternalAxiosRequestConfig) {
    const token = getAccessToken();
    if (token) {
        config.headers = config.headers ?? {};
        if (!('Authorization' in config.headers)) {
            (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
    }
    return config;
}
api.interceptors.request.use(attachAuth);

// ====== Глобальный refresh-механизм ======
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
    pendingQueue.push(cb);
}
function onRefreshed(newToken: string | null) {
    pendingQueue.forEach((cb) => cb(newToken));
    pendingQueue = [];
}

async function refreshToken(): Promise<string> {
    const rt = getRefreshToken();
    if (!rt) throw new Error('no_refresh_token');

    // отдельный вызов без глобальных интерцепторов, чтобы не зациклиться
    const axiosBare = axios.create({ baseURL: API_BASE, withCredentials: true, timeout: 10000 });
    const { data } = await axiosBare.post<{ accessToken: string; refreshToken?: string }>(
        REFRESH_PATH,
        { refreshToken: rt }
    );

    if (!data?.accessToken) throw new Error('bad_refresh_response');
    setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return data.accessToken;
}

// ====== Обработка 401 с попыткой refresh и повтором ======
api.interceptors.response.use(
    (r) => r,
    async (err: AxiosError) => {
        const original = err.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
        const status = err.response?.status || 0;
        const url = (original?.url ?? '').toString();

        // Если это не 401 — отдаем как есть
        if (status !== 401 || !original) {
            return Promise.reject(err);
        }

        // Не пытаемся рефрешить сам /auth/refresh и /auth/login
        if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
            // реальный "выход"
            clearTokens();
            window.dispatchEvent(new Event('auth:logout'));
            return Promise.reject(err);
        }

        // Уже пробовали этот запрос? — не зацикливаемся
        if (original._retry) {
            clearTokens();
            window.dispatchEvent(new Event('auth:logout'));
            return Promise.reject(err);
        }

        original._retry = true;

        try {
            // Если уже идёт refresh — ждём его завершения
            if (isRefreshing) {
                const newToken = await new Promise<string | null>((resolve) => {
                    subscribeTokenRefresh(resolve);
                });
                // если рефреш не вернул токен — выходим
                if (!newToken) throw new Error('refresh_failed_no_token');

                // подставим новый токен и повторим изначальный запрос
                original.headers = original.headers ?? {};
                (original.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
                return api(original);
            }

            // Инициируем refresh
            isRefreshing = true;
            const newToken = await refreshToken();
            isRefreshing = false;
            onRefreshed(newToken);

            // Повторяем исходный запрос с новым токеном
            original.headers = original.headers ?? {};
            (original.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
            return api(original);

        } catch (e) {
            isRefreshing = false;
            onRefreshed(null); // разбудим ожидателей с ошибкой
            clearTokens();
            window.dispatchEvent(new Event('auth:logout'));
            return Promise.reject(err);
        }
    }
);

// ===== Типы =====
export interface MeDto {
    username: string;
    email: string;
    companyName?: string | null;
    admin: boolean;
}

export interface AdminCreateUserRequest {
    username: string;
    email: string;
    password: string;
}

// ===== API-методы =====
export async function fetchMe(): Promise<MeDto> {
    const { data } = await api.get<MeDto>('/users/me');
    return data;
}

export async function adminCreateUser(payload: AdminCreateUserRequest) {
    return api.post('/admin/users', payload);
}

export async function createCheckout(): Promise<{ checkoutUrl: string }> {
    const { data } = await api.post<{ checkoutUrl: string }>('/billing/checkout');
    return data;
}

export async function loginUser(payload: { username: string; password: string }) {
    const { data } = await api.post<{ accessToken: string; refreshToken?: string }>('/auth/login', payload);
    if (data?.accessToken) setAccessToken(data.accessToken);
    if (data?.refreshToken) setRefreshToken(data.refreshToken);
    return data;
}
