import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Em desenvolvimento, o navegador chama /api/... no próprio Vite, que repassa para o backend.
    // Assim tudo fica na mesma origem: sem problemas de CORS nem de cookie de sessão.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    // Testes só de funções puras (src/utils), então o ambiente Node basta.
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
