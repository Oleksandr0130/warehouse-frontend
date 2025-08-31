// src/api.ts
import axios, {
    AxiosError,
    AxiosRequestConfig,
    AxiosRequestHeaders,
    AxiosResponse,
} from "axios";

import { ReservationData } from "./types/ReservationData";
import { Item } from "./types/Item";

/** BASE_URL: env или '/api' */
const BASE_URL = import.meta.env.VITE_API_BASE ?? "/api";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10_000,
    withCredentials: true, // пусть остаётся — если куки появятся, будет плюс
});

/* ===================== Типы ===================== */

export type BillingState = "TRIAL" | "ACTIVE" | "EXPIRED" | "ANON" | "NO_COMPANY";
export type Currency = "PLN" | "EUR";

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

type UnknownRecord = Record<string, unknown>;
type Tokens = { accessToken: string; refreshToken: string };

/* ===================== Helpers ===================== */

export const getErrorMessage = (e: unknown): string => {
    const err = e as AxiosError<UnknownRecord>;
    const data = err.response?.data as UnknownRecord | undefined;
    const fromData =
        (typeof data?.message === "string" && data.message) ||
        (typeof data?.error === "string" && data.error) ||
        null;

    return fromData ?? err.message ?? "Unknown error";
};

const setAuthHeader = (cfg: AxiosRequestConfig, token?: string | null) => {
    if (!token) return;
    if (!cfg.headers) {
        cfg.headers = {} as AxiosRequestHeaders;
    }
    (cfg.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
};

const getAccess = (): string | null => localStorage.getItem("accessToken");
const getRefresh = (): string | null => localStorage.getItem("refreshToken");
const saveTokens = (t: Tokens): void => {
    localStorage.setItem("accessToken", t.accessToken);
    localStorage.setItem("refreshToken", t.refreshToken);
};
const clearTokens = (): void => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
};

/* ===================== API методы домена ===================== */

export const fetchItems = async (): Promise<Item[]> => {
    const resp = await api.get<Item[]>("/items");
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
    const query = currency ? `?currency=${encodeURIComponent(currency)}` : "";
    const { data } = await api.post<CheckoutResponse>(`/billing/checkout-oneoff${query}`);
    return data;
};

export const registerUser = (data: {
    username: string;
    email: string;
    password: string;
    companyName: string;
}) => api.post("/auth/register", data);

/**
 * Логин (гибрид): сервер ставит HttpOnly-куки + возвращает JSON с токенами.
 * Мы сохраняем токены локально — это обходит возможные проблемы с прокси/Set-Cookie.
 */
export const loginUser = async (data: { username: string; password: string }) => {
    const resp = await api.post<Tokens>("/auth/login", data);
    if (resp.data?.accessToken && resp.data?.refreshToken) {
        saveTokens(resp.data);
    }
    return resp;
};

export const confirmEmail = (code: string) => api.get(`/confirmation?code=${code}`);

export const deleteQRCode = async (orderNumber: string): Promise<void> => {
    await api.delete(`/reservations/${orderNumber}/qrcode`);
};

/* ===================== Billing ===================== */

export const fetchBillingStatus = async (): Promise<BillingStatusDto> => {
    const { data } = await api.get<BillingStatusDto>("/billing/status");
    return data;
};

/* ===================== Профиль / Админ ===================== */

export async function fetchMe(): Promise<MeDto> {
    const { data } = await api.get<MeDto>("/users/me");
    return data;
}

export async function adminCreateUser(req: AdminCreateUserRequest): Promise<MeDto> {
    const { data } = await api.post<MeDto>("/admin/users", req);
    return data;
}

/* ===================== Интерцепторы ===================== */

/** Request: добавляем Authorization из accessToken (если есть) */
api.interceptors.request.use(
    (config) => {
        setAuthHeader(config, getAccess());
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response:
 * - 401 (не для /auth/*) → пробуем обновить токены:
 *   * сначала через JSON-тело (refreshToken из localStorage),
 *   * сервер параллельно может обновить HttpOnly-куки,
 *   * затем повторяем оригинальный запрос.
 */
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<UnknownRecord>) => {
        const originalRequest = (error.config ?? {}) as AxiosRequestConfig & {
            _retry?: boolean;
        };
        const status = error.response?.status ?? 0;
        const url = typeof originalRequest.url === "string" ? originalRequest.url : "";

        // 401 для /auth/* не трогаем
        if (status === 401 && /\/auth\//.test(url)) {
            return Promise.reject(error);
        }

        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Пытаемся обновить токены (JSON-вариант + withCredentials на случай куки)
                const refreshToken = getRefresh();
                const base = axios.create({
                    baseURL: BASE_URL,
                    withCredentials: true,
                    timeout: 8_000,
                });

                // Если refreshToken есть — отправляем в теле, иначе — null (сервер возьмёт из куки)
                const { data } = await base.post<Tokens>(
                    "/auth/refresh",
                    refreshToken ? { refreshToken } : null
                );

                if (!data?.accessToken || !data?.refreshToken) {
                    throw new Error("Refresh returned no tokens");
                }

                saveTokens(data);
                setAuthHeader(originalRequest, data.accessToken);

                return api(originalRequest);
            } catch (refreshError) {
                clearTokens();
                if (window.location.pathname !== "/login") {
                    window.dispatchEvent(new Event("auth:logout"));
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/** 402 → мягкий редирект на /app/account (не для /billing/*) */
let subscriptionRedirectScheduled = false;
api.interceptors.response.use(
    (res: AxiosResponse) => res,
    (err: AxiosError<UnknownRecord>) => {
        const status = err.response?.status;
        const headers = err.response?.headers ?? {};
        const data = (err.response?.data ?? {}) as UnknownRecord;
        const url = typeof err.config?.url === "string" ? err.config.url : "";

        const headerExpired =
            (headers as Record<string, string | undefined>)["x-subscription-expired"] === "true" ||
            (headers as Record<string, string | undefined>)["X-Subscription-Expired"] === "true";

        const payloadExpired = data["error"] === "payment_required";

        const expired = headerExpired || payloadExpired;

        const onAccountPage = window.location.pathname.startsWith("/app/account");
        const isBillingCall = url.startsWith("/billing/") || url.startsWith("/api/billing/");

        if (status === 402 && expired) {
            if (!onAccountPage && !isBillingCall && !subscriptionRedirectScheduled) {
                subscriptionRedirectScheduled = true;
                setTimeout(() => {
                    try {
                        window.location.href = "/app/account";
                    } finally {
                        subscriptionRedirectScheduled = false;
                    }
                }, 100);
            }
        }
        return Promise.reject(err);
    }
);

export default api;
