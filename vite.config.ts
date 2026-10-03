import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({mode}) => ({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: mode === 'local-demo' ? 'http://127.0.0.1:5030' : process.env.QURA_API_TARGET || 'http://127.0.0.1:5000',
                changeOrigin: true,
                ws: true,
            },
        },
    },
}));
