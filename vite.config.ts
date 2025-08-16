// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
//
// // https://vitejs.dev/config/
// export default defineConfig(({ mode }) => ({
//   plugins: [react()],
//   base: mode === "production" ? "/api/" : "/", // Установка базового пути для продакшена
//   server: {
//     port: 5173,
//     open: true,
//     proxy: {
//       "/api": {
//         target: "https://warehouse-qr-app-8adwv.ondigitalocean.app/api/", // Прокси для локальной разработки
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// }))
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // dev-сервер (локальная разработка)
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    strictPort: true,
    // необязательно, но удобно, если когда-нибудь будете прокидывать dev наружу
    allowedHosts: ['warehouse-qr-app-8adwv.ondigitalocean.app'],
  },

  // прод-просмотр билда (npm start → vite preview)
  preview: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true,
    // <-- ключевая строка: разрешаем ваш домен
    allowedHosts: ['warehouse-qr-app-8adwv.ondigitalocean.app'],
  },
});
