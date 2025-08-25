// src/api.ts
import axios from 'axios';
import { ReservationData } from "./types/ReservationData.ts";
import { Item } from "./types/Item.ts";

// BASE_URL: env или '/api'
const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true,
});

// --- API методы ---
export const fetchItems = async (): Promise<Item[]> => {
    const resp = await api.get('/items');
    return resp.data as Item[];
};

export const fetchReservationsByOrderPrefix = async (prefix: string): Promise<ReservationData[]> => {
    const response = await api.get(`/reservations/search/by-order-prefix`, { params: { orderPrefix: prefix } });
    return response.data;
};

export const registerUser = (data: { username: string; email: string; password: string; companyName: string }) =>
    api.post('/auth/register', data);

export const loginUser = (data: { username: string; password: string }) =>
    api.post('/auth/login', data);

export const confirmEmail = (code: string) =>
    api.get(`/confirmation?code=${code}`);

export const deleteQRCode = async (orderNumber: string): Promise<void> => {
    await api.delete(`/reservations/${orderNumber}/qrcode`);
};

export async function checkoutSubscription(): Promise<string> {
    const { data } = await api.post('/billing/checkout'); // => /api/billing/checkout
    return data.checkoutUrl as string;
}

// Разовая оплата (one-time price)
export async function checkoutOneTime(): Promise<string> {
    const { data } = await api.post('/billing/checkout-onetime'); // => /api/billing/checkout-onetime
    return data.checkoutUrl as string;
}

// ===== Billing — ТЕПЕРЬ через /api/billing/* =====
export const fetchBillingStatus = async () => {
    const { data } = await api.get('/billing/status');
    return data as {
        status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'ANON' | 'NO_COMPANY';
        trialEnd?: string;
        currentPeriodEnd?: string;
        daysLeft?: number;
        isAdmin?: boolean;
        pendingCheckoutUrl?: string;
        pendingInvoiceUrl?: string; // НОВОЕ
    };
};

export const createCheckout = async () => {
    const resp = await api.post('/billing/checkout'); // => /api/billing/checkout
    return resp.data as { checkoutUrl: string };
};

export const openBillingPortal = async () => {
    // если у тебя на бэке GET — оставь GET; если POST — поменяй тут на post
    const resp = await api.get('/billing/portal'); // => /api/billing/portal
    return resp.data as { portalUrl: string };
};

// --- Интерцепторы ---
api.interceptors.request.use(
    (config) => {
        // поддерживаем и новую (accessToken), и старую (token)
        const raw = localStorage.getItem('accessToken') ?? localStorage.getItem('token');
        if (raw) {
            const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw; // не допускаем "Bearer Bearer ..."
            config.headers = config.headers ?? {};
            (config.headers as any).Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest: any = error?.config ?? {};
        const url: string = originalRequest?.url ?? '';

        // не трогаем 401 для /auth/*
        if (error?.response?.status === 401 && /\/auth\/login|\/auth\/register|\/auth\/refresh|\/confirmation/.test(url)) {
            return Promise.reject(error);
        }

        // рефреш один раз
        if (error?.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await api.post('/auth/refresh', { refreshToken });

                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                originalRequest.headers = originalRequest.headers ?? {};
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
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
    }
);

// 402 → мягкий редирект на /app/account (не для /api/billing/*)
let subscriptionRedirectScheduled = false;
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status  = err?.response?.status;
        const headers = err?.response?.headers ?? {};
        const data    = err?.response?.data ?? {};
        const url     = (err?.config?.url ?? '') as string;

        const expired =
            headers['x-subscription-expired'] === 'true' ||
            (headers as any)['X-Subscription-Expired'] === 'true' ||
            data?.error === 'payment_required';

        const onAccountPage = window.location.pathname.startsWith('/app/account');
        const isBillingCall = url.startsWith('/billing/') || url.startsWith('/api/billing/');

        if (status === 402 && expired) {
            if (!onAccountPage && !isBillingCall && !subscriptionRedirectScheduled) {
                subscriptionRedirectScheduled = true;
                setTimeout(() => {
                    try { window.location.href = '/app/account'; }
                    finally { subscriptionRedirectScheduled = false; }
                }, 100);
            }
            return Promise.reject(err);
        }
        return Promise.reject(err);
    }
);

// --- Типы и методы профиля ---
export interface MeDto {
    username: string;
    email: string;
    companyName: string | null;
    admin: boolean;
}

export async function fetchMe(): Promise<MeDto> {
    const { data } = await api.get<MeDto>('/users/me');
    return data;
}

export interface AdminCreateUserRequest {
    username: string;
    email: string;
    password: string;
}

export async function adminCreateUser(req: AdminCreateUserRequest): Promise<MeDto> {
    const { data } = await api.post<MeDto>('/admin/users', req);
    return data;
}

export default api;
