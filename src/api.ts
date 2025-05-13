import axios from 'axios';
import { SoldReservation } from './types/SoldReservation.ts';

const BASE_URL = '/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // Тайм-аут 10 секунд
    withCredentials: true, // Для передачи cookie
});

// Запрос к /sold для получения проданных резерваций
export const fetchSoldReservations = async (): Promise<SoldReservation[]> => {
    const response = await api.get('/sold');
    return response.data;
};

// Метод для фильтрации резерваций по префиксу заказа
export const fetchReservationsByOrderPrefix = async (orderPrefix: string) => {
    const response = await api.get('/search/by-order-prefix', {
        params: { orderPrefix },
    });
    return response.data;
};

// Функции для регистрации пользователя, входа, подтверждения email
export const registerUser = (data: { username: string; email: string; password: string; role: string }) =>
    api.post('/auth/register', data);

export const loginUser = (data: { username: string; password: string }) =>
    api.post('/auth/login', data);

export const confirmEmail = (code: string) =>
    api.get(`/confirmation?code=${code}`);

// Новый метод для удаления QR-кода
export const deleteQRCode = async (orderNumber: string): Promise<void> => {
    await api.delete(`/reservations/${orderNumber}/qrcode`);
};

// Интерцептор запросов: добавляем заголовок Authorization, если токен доступен
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken'); // Получаем Access Token из localStorage
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        console.log(`API Request -> ${config.method?.toUpperCase()} ${config.url}`, config.params || {});
        return config;
    },
    (error) => {
        console.error('Ошибка перед отправкой запроса:', error);
        return Promise.reject(error);
    }
);

// Интерцептор ответа: автоматическое обновление Access Token при истечении
api.interceptors.response.use(
    (response) => {
        console.log(`API Response <- ${response.status} ${response.config.url}`, response.data);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Проверяем 401 из-за истечения Access Token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Устанавливаем флаг, чтобы не выполнить запрос повторно

            try {
                console.log('Access Token истек. Выполняем обновление через Refresh Token...');

                // Получаем Refresh Token из localStorage
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    console.error('Refresh Token отсутствует. Перенаправляем на страницу входа.');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Выполняем запрос обновления токенов
                const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

                // Сохраняем новые токены
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                // Повторяем оригинальный запрос с новым токеном
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                console.error('Ошибка обновления токена:', refreshError);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login'; // Перенаправляем на страницу логина при ошибке Refresh Token
                return Promise.reject(refreshError);
            }
        }

        console.error('API Error:', error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`, error.response.data);
        }
        alert(`Произошла ошибка: ${error.response?.data.message || 'Неизвестная ошибка'}`);
        return Promise.reject(error);
    }
);

export default api;