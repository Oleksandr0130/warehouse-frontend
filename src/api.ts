// src/api.ts
import axios from 'axios';

// Определение базового URL для API
// Для локальной разработки используем /api (через прокси в Vite)
// В продакшене можно указать полный URL к API
const BASE_URL = '/api';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: BASE_URL,
  // Таймаут для запросов
  timeout: 10000,
  // Передаем куки и заголовки авторизации
  withCredentials: true,
});

// Добавляем интерсептор для логирования запросов
api.interceptors.request.use(config => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.params || {});
  return config;
});

// Добавляем интерсептор для логирования ответов и ошибок
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  error => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`, error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
