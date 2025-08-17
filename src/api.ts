import axios from 'axios';
import { SoldReservation } from './types/SoldReservation.ts';
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

export const fetchSoldReservations = async (): Promise<SoldReservation[]> => {
    const response = await api.get('/sold');
    return response.data;
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

export const fetchBillingStatus = async () => {
    const resp = await api.get('/billing/status');
    return resp.data as {
        status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'ANON' | 'NO_COMPANY';
        trialEnd?: string;
        currentPeriodEnd?: string;
        daysLeft?: number;
        isAdmin?: boolean;
    };
};

export const createCheckout = async () => {
    const resp = await api.post('/billing/checkout');
    return resp.data as { checkoutUrl: string };
};

// --- Интерцепторы ---
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // ⚡️ тут используем api.post вместо axios.post(BASE_URL+...)
                const { data } = await api.post('/auth/refresh', { refreshToken });

                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
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
