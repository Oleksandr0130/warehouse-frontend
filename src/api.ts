import axios from 'axios';

const BASE_URL = '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use(config => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.params || {});
  return config;
});

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