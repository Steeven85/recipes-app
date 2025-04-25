// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path' // Ajoutez cette importation

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss({
      config: './tailwind.config.cjs', // Chemin explicite
      entry: './src/index.css'
    })
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src') // Ajoutez cette configuration d'alias
    }
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.85.50:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/\/$/, '') // retire la barre oblique finale
      }
    }
  }
});