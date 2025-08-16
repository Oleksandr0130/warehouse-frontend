// src/api.ts
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

/**
 * БАЗА API
 * На проде задай VITE_API_URL=https://warehouse-qr-app-8adwv.ondigitalocean.app/api
 * иначе возьмётся относительный '/api'
 */
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

/**
 * Путь refresh-эндпоинта (проверь у себя)
 * Если у тебя другой — поменяй здесь.
 */
const REFRESH_PATH = '/auth/refresh';

/* ===================== ХРАНИЛИЩЕ ТОКЕНОВ ===================== */

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

/* ===================== AXIOS ИНСТАНС ===================== */

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    timeout: 15000,
});

/* ===================== REQUEST INTERCEPTOR (AUTH) ===================== */

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

/* ===================== REFRESH МЕХАНИЗМ ===================== */

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

    // отдельный клиент без интерцепторов, чтобы не зациклиться
    const bare = axios.create({ baseURL: API_BASE, withCredentials: true, timeout: 10000 });

    const { data } = await bare.post<{ accessToken: string; refreshToken?: string }>(
        REFRESH_PATH,
        { refreshToken: rt }
    );

    if (!data?.accessToken) throw new Error('bad_refresh_response');
    setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return data.accessToken;
}

/* ===================== RESPONSE INTERCEPTOR (401→refresh) ===================== */

api.interceptors.response.use(
    (r) => r,
    async (err: AxiosError) => {
        const original = err.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
        const status = err.response?.status ?? 0;
        const url = (original?.url ?? '').toString();

        // Не 401 — отдаём как есть
        if (status !== 401 || !original) {
            return Promise.reject(err);
        }

        // Не пытаемся рефрешить сами /auth/refresh и /auth/login
        if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
            clearTokens();
            window.dispatchEvent(new Event('auth:logout'));
            return Promise.reject(err);
        }

        // Защита от зацикливания
        if (original._retry) {
            clearTokens();
            window.dispatchEvent(new Event('auth:logout'));
            return Promise.reject(err);
        }
        original._retry = true;

        try {
            // Если рефреш уже идёт — ждём его
            if (isRefreshing) {
                const newToken = await new Promise<string | null>((resolve) => subscribeTokenRefresh(resolve));
                if (!newToken) throw new Error('refresh_failed_no_token');

                original.headers = original.headers ?? {};
                (original.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
                return api(original);
            }

            // Запускаем refresh
            isRefreshing = true;
            const newToken = await refreshToken();
            isRefreshing = false;
            onRefreshed(newToken);

            original.headers = original.headers ?? {};
            (original.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
            return api(original);

        } catch (_e) {
            isRefreshing = false;
            onRefreshed(null); // разбудим ожидающих с ошибкой
            clearTokens();
            window.dispatchEvent(new Event('auth:logout'));
            return Promise.reject(err);
        }
    }
);

/* ===================== ТИПЫ ДЛЯ ФРОНТА ===================== */

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

/* ===================== API-МЕТОДЫ ===================== */

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
