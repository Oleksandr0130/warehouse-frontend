// src/api.ts
import axios, {
    AxiosError,
    AxiosRequestConfig,
    AxiosResponse,
} from "axios";
import { ReservationData } from "./types/ReservationData";
import { Item } from "./types/Item";

const BASE_URL = import.meta.env.VITE_API_BASE ?? "/api";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true, // для работы с HttpOnly-куками
});

/* ===================== Типы ===================== */

export type BillingState =
    | "TRIAL"
    | "ACTIVE"
    | "EXPIRED"
    | "ANON"
    | "NO_COMPANY";
export type Currency = "PLN" | "EUR";

export interface BillingStatusDto {
    status: BillingState;
    trialEnd?: string;
    currentPeriodEnd?: string;
    daysLeft?: number;
    isAdmin?: boolean;
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

/* ===================== Helpers ===================== */

export const getErrorMessage = (e: unknown): string => {
    const err = e as AxiosError<{ message?: string; error?: string }>;
    return (
        err.response?.data?.message ??
        err.response?.data?.error ??
        err.message ??
        "Unknown error"
    );
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
    const { data } = await api.post<CheckoutResponse>(
        `/billing/checkout-oneoff${query}`
    );
    return data;
};

export const registerUser = (data: {
    username: string;
    email: string;
    password: string;
    companyName: string;
}) => api.post("/auth/register", data);

export const loginUser = (data: { username: string; password: string }) =>
    api.post("/auth/login", data);

export const confirmEmail = (code: string) =>
    api.get(`/confirmation?code=${code}`);

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

export async function adminCreateUser(
    req: AdminCreateUserRequest
): Promise<MeDto> {
    const { data } = await api.post<MeDto>("/admin/users", req);
    return data;
}

/* ===================== Интерцепторы ===================== */

// 401 → попробуем один раз обновить куки через /auth/refresh и повторим запрос
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = (error.config ?? {}) as AxiosRequestConfig & {
            _retry?: boolean;
        };
        const status = error.response?.status ?? 0;
        const url =
            typeof originalRequest.url === "string" ? originalRequest.url : "";

        // 401 для /auth/* не трогаем
        if (status === 401 && /\/auth\//.test(url)) {
            return Promise.reject(error);
        }

        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // refresh по куке RefreshToken (тело пустое JSON, + заголовок)
                await api.post(
                    "/auth/refresh",
                    {},
                    { headers: { "Content-Type": "application/json" } }
                );
                return api(originalRequest);
            } catch (refreshError) {
                if (window.location.pathname !== "/login") {
                    window.dispatchEvent(new Event("auth:logout"));
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// 402 → мягкий редирект на /app/account (не для /billing/*)
let subscriptionRedirectScheduled = false;
api.interceptors.response.use(
    (res: AxiosResponse) => res,
    (err: AxiosError) => {
        const status = err.response?.status;
        const headersObj: Record<string, unknown> =
            (err.response?.headers as Record<string, unknown>) ?? {};
        const dataObj: Record<string, unknown> =
            (err.response?.data as Record<string, unknown>) ?? {};
        const url = typeof err.config?.url === "string" ? err.config!.url! : "";

        const expired =
            headersObj["x-subscription-expired"] === "true" ||
            headersObj["X-Subscription-Expired"] === "true" ||
            dataObj["error"] === "payment_required";

        const onAccountPage = window.location.pathname.startsWith("/app/account");
        const isBillingCall =
            url.startsWith("/billing/") || url.startsWith("/api/billing/");

        if (status === 402 && expired) {
            if (
                !onAccountPage &&
                !isBillingCall &&
                !subscriptionRedirectScheduled
            ) {
                subscriptionRedirectScheduled = true;
                setTimeout(() => {
                    try {
                        window.location.href = "/app/account";
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
