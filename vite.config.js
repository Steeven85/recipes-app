// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    return {
        plugins: [
            vue(),
            tailwindcss({
                config: './tailwind.config.cjs',
                entry: './src/index.css'
            })
        ],
        define: {
            // Assurez-vous que les variables d'environnement sont disponibles
            'import.meta.env.API_URL': JSON.stringify(env.VITE_API_URL || 'http://192.168.85.50:9000')
        },
        server: {
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://192.168.85.50:9000',
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => path.replace(/\/$/, '')
                }
            }
        }
    };
});
