import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/',                 // важно для продакшена
    build: { outDir: 'dist' },

    // используется в проде (vite preview), НЕ dev
    preview: {
        host: '0.0.0.0',
        strictPort: true,
        open: false,
        allowedHosts: [
            'warehouse-qr-app-8adwv.ondigitalocean.app', // ← только строки, без RegExp
        ],
    },

    // только для локальной разработки
    server: {
        port: 5173,
        open: false,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
        },
    },
})
