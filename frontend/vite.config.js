import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serve o site em /nome-do-repositorio/ (em dev fica '/')
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
})
