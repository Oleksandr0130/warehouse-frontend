// src/api.ts
import axios, {
    AxiosError,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
    AxiosRequestHeaders,
    AxiosResponse,
} from 'axios';
import { ReservationData } from './types/ReservationData.ts';
import { Item } from './types/Item.ts';

/* ===================== База ===================== */

// BASE_URL: env или '/api'
const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true,
});

/* ===================== Детектор платформы и стор ===================== */

const isAndroidApp = (() => {
    try {
        return typeof navigator !== 'undefined' && navigator.userAgent.includes('FlowQRApp/Android');
    } catch {
        return false;
    }
})();

function getStorage(): Storage {
    try {
        return isAndroidApp ? sessionStorage : localStorage;
    } catch {
        return localStorage;
    }
}

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

/* ===================== Типы ===================== */

export type BillingState = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'ANON' | 'NO_COMPANY';
export type Currency = 'PLN' | 'EUR';

export interface BillingStatusDto {
    status: BillingState;
    trialEnd?: string;
    currentPeriodEnd?: string;
    daysLeft?: number;
    isAdmin?: boolean;
    /** если бэк отдаёт закреплённую валюту компании */
    billingCurrency?: Currency;
}

export interface CheckoutResponse {
    checkoutUrl: string;
}

export interface MeDto {
    username: string;
    email: string;
    companyName: string | null;
    admin: boolean;
}

export interface AdminCreateUserRequest {
    username: string;
    email: string;
    password: string;
}

interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
}

/** ===== Google Play Billing: verify ===== */
export interface VerifyPlayPurchaseRequest {
    productId: string;
    purchaseToken: string;
    packageName: string;
}
export interface VerifyPlayPurchaseResponse {
    active: boolean;
    /** epoch millis (окончание текущего периода) */
    expiryTime: number;
}

/* ===================== Helpers ===================== */

export const getErrorMessage = (e: unknown): string => {
    const err = e as AxiosError<{ message?: string; error?: string }>;
    return (
        err.response?.data?.message ??
        err.response?.data?.error ??
        err.message ??
        'Unknown error'
    );
};

const setAuthHeader = (headers: AxiosRequestHeaders, token: string) => {
    headers['Authorization'] = `Bearer ${token}`;
};

// нормализуем URL до пути без baseURL
function stripBase(url: string): string {
    if (!url) return '';
    try {
        // относительный путь
        if (url.startsWith('/')) return url;
        // абсолютный — пробуем удалить baseURL
        const base = (api.defaults.baseURL ?? '').replace(/\/+$/, '');
        return url.startsWith(base) ? url.slice(base.length) || '/' : url;
    } catch {
        return url;
    }
}

const AUTH_WHITELIST = [/^\/auth\/login\b/i, /^\/auth\/register\b/i, /^\/auth\/refresh\b/i, /^\/confirmation\b/i];

function shouldSkipAuth(config: AxiosRequestConfig): boolean {
    const path = stripBase(String(config.url ?? ''));
    return AUTH_WHITELIST.some((re) => re.test(path));
}

/* ===================== API методы домена ===================== */

export const fetchItems = async (): Promise<Item[]> => {
    const resp = await api.get<Item[]>('/items');
    return resp.data;
};

export const fetchReservationsByOrderPrefix = async (
    prefix: string
): Promise<ReservationData[]> => {
    const response = await api.get<ReservationData[]>(
        `/reservations/search/by-order-prefix`,
        { params: { orderPrefix: prefix } }
    );
    return response.data;
};

export const createOneOffCheckout = async (
    currency?: Currency
): Promise<CheckoutResponse> => {
    const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
    const { data } = await api.post<CheckoutResponse>(`/billing/checkout-oneoff${query}`);
    return data;
};

export const registerUser = (data: {
    username: string;
    email: string;
    password: string;
    companyName: string;
}) => api.post('/auth/register', data);

export const loginUser = (data: { username: string; password: string }) =>
    api.post('/auth/login', data);

export const confirmEmail = (code: string) =>
    api.get(`/confirmation?code=${code}`);

export const deleteQRCode = async (orderNumber: string): Promise<void> => {
    await api.delete(`/reservations/${orderNumber}/qrcode`);
};

/* ===================== Billing ===================== */

export const fetchBillingStatus = async (): Promise<BillingStatusDto> => {
    const { data } = await api.get<BillingStatusDto>('/billing/status');
    return data;
};

/** ✅ Google Play Billing: верификация покупки из APK */
export const verifyPlayPurchase = async (
    purchaseToken: string,
    productId = 'flowqr_standard',
    packageName = 'com.example.warehouseqrapp'
): Promise<VerifyPlayPurchaseResponse> => {
    const payload: VerifyPlayPurchaseRequest = { productId, purchaseToken, packageName };
    const { data } = await api.post<VerifyPlayPurchaseResponse>('/billing/play/verify', payload);
    return data;
};

/* ===================== Профиль / Админ ===================== */

export async function fetchMe(): Promise<MeDto> {
    const { data } = await api.get<MeDto>('/users/me');
    return data;
}

export async function adminCreateUser(
    req: AdminCreateUserRequest
): Promise<MeDto> {
    const { data } = await api.post<MeDto>('/admin/users', req);
    return data;
}

export async function deleteAccount(): Promise<void> {
    await api.delete('/users/me');
    const storage = getStorage();
    storage.removeItem(ACCESS_KEY);
    storage.removeItem(REFRESH_KEY);
}

/* ===================== Интерцепторы ===================== */

// request: проставляем Authorization, если токен есть (кроме /auth/*)
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (!shouldSkipAuth(config)) {
            const storage = getStorage();
            const raw = storage.getItem(ACCESS_KEY) ?? storage.getItem('token'); // b/c
            if (raw) {
                const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
                if (!config.headers) {
                    config.headers = {} as AxiosRequestHeaders;
                }
                setAuthHeader(config.headers as AxiosRequestHeaders, token);
            }
        } else if (config.headers && 'Authorization' in config.headers) {
            // гарантированно убираем заголовок для /auth/*
            delete (config.headers as any).Authorization;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// response: обновление accessToken по 401 + мягкий редирект по 402
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = (error.config ?? {}) as AxiosRequestConfig & { _retry?: boolean };
        const url = stripBase(String(originalRequest.url ?? ''));

        // не трогаем 401 для /auth/*
        if (error.response?.status === 401 && AUTH_WHITELIST.some((re) => re.test(url))) {
            return Promise.reject(error);
        }

        // один рефреш
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const storage = getStorage();
                const refreshToken = storage.getItem(REFRESH_KEY);
                if (!refreshToken) throw new Error('No refresh token');

                // важно: не добавлять Authorization сюда
                const { data } = await api.post<RefreshResponse>('/auth/refresh', { refreshToken });

                storage.setItem(ACCESS_KEY, data.accessToken);
                storage.setItem(REFRESH_KEY, data.refreshToken);

                // проставим заголовок и повторим запрос
                originalRequest.headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
                (originalRequest.headers as AxiosRequestHeaders)['Authorization'] =
                    `Bearer ${data.accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                const storage = getStorage();
                storage.removeItem(ACCESS_KEY);
                storage.removeItem(REFRESH_KEY);
                if (window.location.pathname !== '/login') {
                    window.dispatchEvent(new Event('auth:logout'));
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// 402 → мягкий редирект на /app/account (не для /api/billing/*)
let subscriptionRedirectScheduled = false;
api.interceptors.response.use(
    (res: AxiosResponse) => res,
    (err: AxiosError) => {
        const status = err.response?.status;
        const headersObj: Record<string, unknown> =
            (err.response?.headers as Record<string, unknown>) ?? {};
        const dataObj: Record<string, unknown> =
            (err.response?.data as Record<string, unknown>) ?? {};
        const url = stripBase(String(err.config?.url ?? ''));

        const expired =
            headersObj['x-subscription-expired'] === 'true' ||
            headersObj['X-Subscription-Expired'] === 'true' ||
            dataObj['error'] === 'payment_required';

        const onAccountPage = window.location.pathname.startsWith('/app/account');
        const isBillingCall =
            url.startsWith('/billing/') || url.startsWith('/api/billing/');

        if (status === 402 && expired) {
            if (!onAccountPage && !isBillingCall && !subscriptionRedirectScheduled) {
                subscriptionRedirectScheduled = true;
                setTimeout(() => {
                    try {
                        window.location.href = '/app/account';
                    } finally {
                        subscriptionRedirectScheduled = false;
                    }
                }, 100);
            }
            return Promise.reject(err);
        }
        return Promise.reject(err);
    }
);

export default api;
