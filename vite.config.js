import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project sites live at https://<user>.github.io/<repo>/
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
