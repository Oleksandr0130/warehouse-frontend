// src/api.ts
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import type { AxiosRequestHeaders } from 'axios';
import { ReservationData } from './types/ReservationData.ts';
import { Item } from './types/Item.ts';

// BASE_URL: env или '/api'
const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true,
});

/* ===================== Типы ===================== */

export type BillingState = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'ANON' | 'NO_COMPANY';

export interface BillingStatusDto {
    status: BillingState;
    trialEnd?: string;
    currentPeriodEnd?: string;
    daysLeft?: number;
    isAdmin?: boolean;
    pendingCheckoutUrl?: string;
    pendingInvoiceUrl?: string;
}

export interface CheckoutResponse {
    checkoutUrl: string;
}

export interface PortalResponse {
    portalUrl: string;
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

/* ===================== Helpers ===================== */

export const getErrorMessage = (e: unknown): string => {
    const err = e as AxiosError<{ message?: string; error?: string }>;
    return err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? 'Unknown error';
};

const setAuthHeader = (headers: AxiosRequestHeaders, token: string) => {
    headers['Authorization'] = `Bearer ${token}`;
};

/* ===================== API методы домена ===================== */

export const fetchItems = async (): Promise<Item[]> => {
    const resp = await api.get<Item[]>('/items');
    return resp.data;
};

export const fetchReservationsByOrderPrefix = async (prefix: string): Promise<ReservationData[]> => {
    const response = await api.get<ReservationData[]>(`/reservations/search/by-order-prefix`, {
        params: { orderPrefix: prefix },
    });
    return response.data;
};

export const deleteQRCode = async (orderNumber: string): Promise<void> => {
    await api.delete(`/reservations/${orderNumber}/qrcode`);
};

/* ===================== Auth ===================== */

export const registerUser = (data: {
    username: string;
    email: string;
    password: string;
    companyName: string;
}) => api.post('/auth/register', data);

export const loginUser = (data: { username: string; password: string }) => api.post('/auth/login', data);

export const confirmEmail = (code: string) => api.get(`/confirmation?code=${code}`);

/* ===================== Billing ===================== */

export const fetchBillingStatus = async (): Promise<BillingStatusDto> => {
    const { data } = await api.get<BillingStatusDto>('/billing/status');
    return data;
};

export const createCheckout = async (): Promise<CheckoutResponse> => {
    const { data } = await api.post<CheckoutResponse>('/billing/checkout');
    return data;
};

// One-off (BLIK/PLN)
export const createOneOffCheckout = async (): Promise<CheckoutResponse> => {
    const { data } = await api.post<CheckoutResponse>('/billing/oneoff'); // синхронизировано с бэком
    return data;
};

export const openBillingPortal = async (returnUrl: string): Promise<PortalResponse> => {
    const safeReturn = returnUrl && typeof returnUrl === 'string' ? returnUrl : window.location.href;
    const { data } = await api.post<PortalResponse>('/billing/portal', { return_url: safeReturn });
    return data;
};

/* ===================== Профиль / Админ ===================== */

export async function fetchMe(): Promise<MeDto> {
    const { data } = await api.get<MeDto>('/users/me');
    return data;
}

export async function adminCreateUser(req: AdminCreateUserRequest): Promise<MeDto> {
    const { data } = await api.post<MeDto>('/admin/users', req);
    return data;
}

/* ===================== Интерцепторы ===================== */

// request: проставляем Authorization, если токен есть
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const raw = localStorage.getItem('accessToken') ?? localStorage.getItem('token');
        if (raw) {
            const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
            const headers = (config.headers ?? {}) as AxiosRequestHeaders;
            setAuthHeader(headers, token);
            config.headers = headers;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// response: обновление accessToken по 401 + мягкий редирект по 402
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = (error.config ?? {}) as AxiosRequestConfig & { _retry?: boolean };
        const url: string = typeof originalRequest.url === 'string' ? originalRequest.url : '';

        // не трогаем 401 для /auth/*
        if (
            error.response?.status === 401 &&
            /\/auth\/login|\/auth\/register|\/auth\/refresh|\/confirmation/.test(url)
        ) {
            return Promise.reject(error);
        }

        // один рефреш
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await api.post<RefreshResponse>('/auth/refresh', { refreshToken });

                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                // проставим заголовок и повторим запрос
                originalRequest.headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
                (originalRequest.headers as AxiosRequestHeaders)['Authorization'] = `Bearer ${data.accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                if (window.location.pathname !== '/login') {
                    window.dispatchEvent(new Event('auth:logout'));
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

// 402 → мягкий редирект на /app/account (не для /api/billing/*)
let subscriptionRedirectScheduled = false;
api.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
        const status = err.response?.status;
        const headersObj: Record<string, unknown> = (err.response?.headers as Record<string, unknown>) ?? {};
        const dataObj: Record<string, unknown> = (err.response?.data as Record<string, unknown>) ?? {};
        const url = typeof err.config?.url === 'string' ? err.config!.url! : '';

        const expired =
            headersObj['x-subscription-expired'] === 'true' ||
            headersObj['X-Subscription-Expired'] === 'true' ||
            dataObj['error'] === 'payment_required';

        const onAccountPage = window.location.pathname.startsWith('/app/account');
        const isBillingCall = url.startsWith('/billing/') || url.startsWith('/api/billing/');

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
    },
);

export default api;
