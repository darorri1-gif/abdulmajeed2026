import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            // Manifest is provided as a static file at public/manifest.webmanifest
            manifest: false,
            workbox: {
                navigateFallback: '/index.html',
                // V1 is online-first: cache the app shell + static assets only.
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            },
        }),
    ],
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
});
