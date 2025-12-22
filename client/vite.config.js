import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        nodePolyfills()
    ],
    define: {
        global: 'window',
    },
    server: {
        // Proxying API requests during development. This will not be used in production builds.
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
                secure: false,
            },

        },
    },
})
