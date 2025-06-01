import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  base: "/", // Установка базового пути для продакшена
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "https://warehouse-qr-app-8adwv.ondigitalocean.app/", // Прокси для локальной разработки
        changeOrigin: true,
        secure: false,
      },
    },
  },
}))
