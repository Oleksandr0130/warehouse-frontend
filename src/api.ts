import i18n from './i18n'; // 🔹 добавили i18n для передачи языка
import axios, {
    AxiosError,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
    AxiosRequestHeaders,
    AxiosResponse,
} from 'axios';
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
    productId: string;     // productId в Play Console (subscriptionId), у тебя: flowqr_standard
    purchaseToken: string;
    packageName: string;   // applicationId из gradle, у тебя: com.flowqr.flowqr
}
export interface VerifyPlayPurchaseResponse {
    active: boolean;
    /** epoch millis (окончание текущего периода) */
    expiryTime: number;
}

export interface TeamUser {
    id: number;
    username: string;
    email: string;
    admin: boolean;
}

/* ===================== Admin: team ===================== */

// список пользователей компании (для админа)
export const fetchTeam = async (): Promise<TeamUser[]> => {
    const { data } = await api.get<TeamUser[]>('/admin/users');
    return data ?? [];
};

// удаление пользователя (админ)
export const deleteUserAdmin = async (userId: number): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
};

// смена роли (админ) — поддерживаем два возможных формата на бэке
export const updateUserRole = async (userId: number, role: 'ADMIN' | 'USER'): Promise<void> => {
    try {
        await api.put(`/admin/users/${userId}/role`, { role });
    } catch {
        // fallback: некий другой контракт
        await api.put(`/admin/users/${userId}`, { admin: role === 'ADMIN' });
    }
};

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
    packageName = 'com.flowqr.flowqr' // ✅ FIX: твой реальный packageName из gradle
): Promise<VerifyPlayPurchaseResponse> => {
    const payload: VerifyPlayPurchaseRequest = { productId, purchaseToken, packageName };
    const { data } = await api.post<VerifyPlayPurchaseResponse>('/billing/play/verify', payload);
    return data;
};

// ✅ ADDED: billing plans catalog (backend decides what exists and how it maps to Stripe/Play)
export interface BillingPlanDto {
    id: string;               // internal plan id in your backend
    title: string;            // "1 Month", "3 Months", "12 Months"
    subtitle?: string;        // "Best for trying out", "Save 15%", ...
    priceText: string;        // "€29", "€74", "€244" (просто текст с бэка)
    oldPriceText?: string;    // optional strike-through
    badge?: string;           // "Best Value"

    provider?: 'STRIPE' | 'PLAY'; // ✅ FIX: сделаем optional, чтобы бэк мог не присылать
    externalId?: string;          // ✅ IMPORTANT: для Android = basePlanId (basic-monthly/basic-3months/basic-year)
}

// GET /billing/plans
export const fetchBillingPlans = async (): Promise<BillingPlanDto[]> => {
    const { data } = await api.get<BillingPlanDto[]>('/billing/plans');
    return data ?? [];
};

// ✅ FIX: единый правильный endpoint + body
// POST /billing/checkout-by-plan { planId }
export const createCheckoutByPlan = async (planId: string): Promise<CheckoutResponse> => {
    const { data } = await api.post<CheckoutResponse>('/billing/checkout-by-plan', { planId });
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
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Not authenticated");

    // 🔹 добавили Accept-Language также для fetch-вызова
    const lang = (i18n?.language || localStorage.getItem('i18nLng') || navigator.language || 'en');

    // ✅ FIX: baseURL учтём, иначе если фронт не на том домене — будет не /api
    const url = `${BASE_URL}/users/me`;

    const res = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': lang,
        },
    });

    if (!res.ok) {
        throw new Error("Failed to delete account");
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken'); // ✅ NEW: чистим тоже
}

/* ===================== Интерцепторы ===================== */

// request: проставляем Authorization, если токен есть, и текущий язык
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const raw =
            localStorage.getItem('accessToken') ?? localStorage.getItem('token');
        if (raw) {
            const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
            if (!config.headers) {
                config.headers = {} as AxiosRequestHeaders;
            }
            setAuthHeader(config.headers as AxiosRequestHeaders, token);
        }

        // 🔹 добавили Accept-Language для всех axios-запросов
        const lang = (i18n?.language || localStorage.getItem('i18nLng') || navigator.language || 'en');
        (config.headers as AxiosRequestHeaders)['Accept-Language'] = lang;

        return config;
    },
    (error) => Promise.reject(error)
);

// response: обновление accessToken по 401
api.interceptors.response.use(
    (response: AxiosResponse) => response,
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

                // ✅ FIX: refresh вызываем без риска рекурсии (через api можно, но лучше отдельный)
                const { data } = await api.post<RefreshResponse>('/auth/refresh', { refreshToken });

                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                // проставим заголовок и повторим запрос
                originalRequest.headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
                (originalRequest.headers as AxiosRequestHeaders)['Authorization'] =
                    `Bearer ${data.accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('token');
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
        const url = typeof err.config?.url === 'string' ? err.config!.url! : '';

        const expired =
            headersObj['x-subscription-expired'] === 'true' ||
            headersObj['X-Subscription-Expired'] === 'true' ||
            dataObj['error'] === 'payment_required';

        const onAccountPage = window.location.pathname.startsWith('/app/account');

        // ✅ FIX: корректно исключаем любые billing вызовы (и /billing, и /api/billing, и абсолютные)
        const isBillingCall =
            url.includes('/billing/');

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
