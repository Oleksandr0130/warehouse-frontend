import axios from 'axios';

// Правильный базовый URL для доступа к backend через proxy
const BASE_URL = '/api';

// Создаём экземпляр axios с базовыми настройками
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // Тайм-аут 10 секунд
    withCredentials: true, // Для передачи cookie
});

// Функции для регистрации пользователя, входа, подтверждения email
export const registerUser = (data: { username: string; email: string; password: string; role: string }) =>
    api.post('/auth/register', data);

export const loginUser = (data: { username: string; password: string }) =>
    api.post('/auth/login', data);

export const confirmEmail = (code: string) =>
    api.get(`/confirmation?code=${code}`);

// Интерцептор запросов: добавляем заголовок Authorization, если токен доступен
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Получаем токен из localStorage
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        console.log(`API Request -> ${config.method?.toUpperCase()} ${config.url}`, config.params || {});
        return config; // Возвращаем конфигурацию запроса
    },
    (error) => {
        console.error('Ошибка перед отправкой запроса:', error);
        return Promise.reject(error); // Возвращаем ошибку
    }
);

// Интерцептор ответов: для логирования успешных запросов или обработки ошибок
api.interceptors.response.use(
    (response) => {
        console.log(`API Response <- ${response.status} ${response.config.url}`, response.data);
        return response; // Возвращаем успешный ответ
    },
    (error) => {
        console.error('API Error:', error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`, error.response.data);
        }
        alert(`Произошла ошибка: ${error.response?.data?.message || 'Неизвестная ошибка'}`);
        return Promise.reject(error); // Возвращаем ошибку для обработки
    }
);

export default api;