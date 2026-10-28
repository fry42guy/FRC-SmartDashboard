import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base so the built dashboard can be served from any folder on the driver station.
  base: './',
  server: { port: 5173, host: true },
  preview: { port: 4173, host: true },
})
