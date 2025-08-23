// src/api.ts
import axios from 'axios';
import { ReservationData } from "./types/ReservationData.ts";
import { Item } from "./types/Item.ts";

// Гибкий BASE_URL: либо из переменной окружения, либо дефолт '/api'
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

// ⬇⬇⬇ БИЛЛИНГ — строго на корневые /billing/* (без /api) ⬇⬇⬇
export const fetchBillingStatus = async () => {
    const resp = await api.get('/billing/status', { baseURL: '' });
    return resp.data as {
        status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'ANON' | 'NO_COMPANY';
        trialEnd?: string;
        currentPeriodEnd?: string;
        daysLeft?: number;
        isAdmin?: boolean;
    };
};

export const createCheckout = async () => {
    const resp = await api.post('/billing/checkout', null, { baseURL: '' });
    return resp.data as { checkoutUrl: string };
};

export const openBillingPortal = async () => {
    const resp = await api.get('/billing/portal', { baseURL: '' });
    return resp.data as { portalUrl: string };
};
// ⬆⬆⬆ БИЛЛИНГ — строго на корневые /billing/* (без /api) ⬆⬆⬆

// --- Интерцепторы ---
api.interceptors.request.use(
    (config) => {
        // поддерживаем и новую (accessToken), и старую (token) схему хранения
        const accessToken = localStorage.getItem('accessToken') ?? localStorage.getItem('token');
        if (accessToken) {
            config.headers = config.headers ?? {};
            (config.headers as any).Authorization = `Bearer ${accessToken}`;
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

        // 1) Не перехватываем 401 на сам логин/регу/рефреш/подтверждение — отдаём ошибку форме
        if (error?.response?.status === 401 && /\/auth\/login|\/auth\/register|\/auth\/refresh|\/confirmation/.test(url)) {
            return Promise.reject(error);
        }

        // 2) Пробуем рефреш только один раз и только для защищённых эндпоинтов
        if (error?.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const { data } = await api.post('/auth/refresh', { refreshToken });

                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                originalRequest.headers = originalRequest.headers ?? {};
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // 3) Рефреш не удался — чистим и даём приложению выполнить SPA-logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');

                // Не дёргаем редирект, если уже на /login — пусть форма останется как есть
                if (window.location.pathname !== '/login') {
                    window.dispatchEvent(new Event('auth:logout'));
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// ⬇ ДОБАВЛЕН ДОП. ПЕРЕХВАТЧИК 402 (ставим ПОСЛЕДНИМ, чтобы сработал первым) ⬇
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status  = err?.response?.status;
        const headers = err?.response?.headers ?? {};
        const data    = err?.response?.data ?? {};

        const expired =
            headers['x-subscription-expired'] === 'true' ||
            (headers as any)['X-Subscription-Expired'] === 'true' ||
            data?.error === 'payment_required';

        if (status === 402 && expired && window.location.pathname !== '/app/account') {
            window.location.href = '/app/account';
            // Прерываем цепочку промисов, чтобы другие обработчики не мешали редиректу
            return new Promise<never>(() => {});
        }
        return Promise.reject(err);
    }
);
// ⬆ ДОБАВЛЕН ДОП. ПЕРЕХВАТЧИК 402 ⬆

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
