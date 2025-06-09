import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/" : "/", // Изменяем базовый путь для продакшена
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "https://warehouse-qr-app-8adwv.ondigitalocean.app/api/", // Прокси для API
        changeOrigin: true,
        secure: false,
      },
    },
  },
}));

