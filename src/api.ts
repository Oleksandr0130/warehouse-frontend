import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { AxiosResponse } from 'axios';
import { ReservationData } from './types/ReservationData';
import { Item } from './types/Item';

const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true, // пусть остаётся — если куки когда-то пойдут, будет плюс
});

/* ==== типы ==== */
export type BillingState = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'ANON' | 'NO_COMPANY';
export type Currency = 'PLN' | 'EUR';

export interface BillingStatusDto {
    status: BillingState;
    trialEnd?: string;
    currentPeriodEnd?: string;
    daysLeft?: number;
    isAdmin?: boolean;
    billingCurrency?: Currency;
}
export interface CheckoutResponse { checkoutUrl: string; }
export interface MeDto { username: string; email: string; companyName: string | null; admin: boolean; }
export interface AdminCreateUserRequest { username: string; email: string; password: string; }

type Tokens = { accessToken: string; refreshToken: string };

/* ==== helpers ==== */
const setAuthHeader = (cfg: AxiosRequestConfig, token?: string) => {
    if (!token) return;
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as any)['Authorization'] = `Bearer ${token}`;
};

const getAccess = () => localStorage.getItem('accessToken') || '';
const getRefresh = () => localStorage.getItem('refreshToken') || '';
const saveTokens = (t: Tokens) => {
    localStorage.setItem('accessToken', t.accessToken);
    localStorage.setItem('refreshToken', t.refreshToken);
};
const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

/* ==== domain api ==== */

export const fetchItems = async (): Promise<Item[]> => (await api.get<Item[]>('/items')).data;

export const fetchReservationsByOrderPrefix = async (prefix: string): Promise<ReservationData[]> =>
    (await api.get<ReservationData[]>('/reservations/search/by-order-prefix', { params: { orderPrefix: prefix } })).data;

export const createOneOffCheckout = async (currency?: Currency): Promise<CheckoutResponse> => {
    const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
    return (await api.post<CheckoutResponse>(`/billing/checkout-oneoff${query}`)).data;
};

export const registerUser = (data: { username: string; email: string; password: string; companyName: string; }) =>
    api.post('/auth/register', data);

/** Логин: получаем токены JSON + (если прокси позволит) поставятся HttpOnly-куки */
export const loginUser = async (data: { username: string; password: string }) => {
    const resp = await api.post<Tokens>('/auth/login', data);
    if (resp.data?.accessToken && resp.data?.refreshToken) {
        saveTokens(resp.data);
    }
    return resp;
};

export const confirmEmail = (code: string) => api.get(`/confirmation?code=${code}`);
export const deleteQRCode = async (orderNumber: string): Promise<void> => { await api.delete(`/reservations/${orderNumber}/qrcode`); };

export const fetchBillingStatus = async (): Promise<BillingStatusDto> => (await api.get<BillingStatusDto>('/billing/status')).data;

export async function fetchMe(): Promise<MeDto> { return (await api.get<MeDto>('/users/me')).data; }
export async function adminCreateUser(req: AdminCreateUserRequest): Promise<MeDto> { return (await api.post<MeDto>('/admin/users', req)).data; }

/* ==== интерцепторы ==== */

// request: ставим Authorization: Bearer <accessToken>
api.interceptors.request.use(
    (cfg) => {
        setAuthHeader(cfg, getAccess());
        return cfg;
    },
    (e) => Promise.reject(e)
);

// response: 401 → рефреш по JSON (или по куке, если сработает), затем ретрай
api.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error: AxiosError) => {
        const original = (error.config ?? {}) as AxiosRequestConfig & { _retry?: boolean };
        const status = error.response?.status ?? 0;
        const url = typeof original.url === 'string' ? original.url : '';

        // не трогаем /auth/*
        if (status === 401 && /\/auth\//.test(url)) {
            return Promise.reject(error);
        }

        if (status === 401 && !original._retry) {
            original._retry = true;
            try {
                // рефреш через JSON + fallback на куку (сервер поддерживает оба)
                const refreshToken = getRefresh();
                const base = axios.create({ baseURL: BASE_URL, withCredentials: true, timeout: 8000 });
                const { data } = await base.post<Tokens>('/auth/refresh', refreshToken ? { refreshToken } : null);
                if (!data?.accessToken || !data?.refreshToken) throw new Error('No tokens from refresh');

                saveTokens(data);
                setAuthHeader(original, data.accessToken);
                return api(original);
            } catch (e) {
                clearTokens();
                if (window.location.pathname !== '/login') {
                    window.dispatchEvent(new Event('auth:logout'));
                }
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);

// 402 → мягкий редирект
let subscriptionRedirectScheduled = false;
api.interceptors.response.use(
    (res: AxiosResponse) => res,
    (err: AxiosError) => {
        const status = err.response?.status;
        const headersObj: Record<string, unknown> = (err.response?.headers as any) ?? {};
        const dataObj: Record<string, unknown> = (err.response?.data as any) ?? {};
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
                    try { window.location.href = '/app/account'; }
                    finally { subscriptionRedirectScheduled = false; }
                }, 100);
            }
        }
        return Promise.reject(err);
    }
);

export default api;
