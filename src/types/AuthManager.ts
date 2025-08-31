// src/types/AuthManager.ts
import axios, { AxiosResponse } from "axios";

const BASE_URL = "/api";

/** Ответ от /auth/refresh (если сервер возвращает JSON с токенами) */
interface Tokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * Быстрая проверка: есть ли рабочая сессия (по кукам/токенам).
 */
const validateSession = async (): Promise<boolean> => {
    try {
        await axios.get(`${BASE_URL}/users/me`, { withCredentials: true });
        return true;
    } catch {
        return false;
    }
};

/**
 * Мягко продлить сессию (обновить AccessToken по RefreshToken).
 */
const touchSession = async (): Promise<void> => {
    try {
        const resp: AxiosResponse<Tokens | unknown> = await axios.post(
            `${BASE_URL}/auth/refresh`,
            {}, // пустое JSON-тело
            {
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
            }
        );

        // если бэк вернул JSON с токенами — сохраним их
        if (
            typeof (resp.data as Tokens)?.accessToken === "string" &&
            typeof (resp.data as Tokens)?.refreshToken === "string"
        ) {
            const tokens = resp.data as Tokens;
            localStorage.setItem("accessToken", tokens.accessToken);
            localStorage.setItem("refreshToken", tokens.refreshToken);
        }
    } catch {
        // при неудаче фронт сам поймёт по 401, что нужна перелогинизация
    }
};

/**
 * Выход: попросим сервер стереть куки и локально очистим токены.
 */
const logout = async (): Promise<void> => {
    try {
        await axios.post(
            `${BASE_URL}/auth/logout`,
            {},
            {
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch {
        /* ignore */
    } finally {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    }
};

export { validateSession, touchSession, logout };
