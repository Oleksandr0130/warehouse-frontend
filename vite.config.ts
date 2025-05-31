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
//         target: "https://warehouse-qr-app-8adwv.ondigitalocean.app", // Прокси для локальной разработки
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// }))

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/", // ВАЖНО: React будет работать с корня
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "https://warehouse-qr-app-8adwv.ondigitalocean.app",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

