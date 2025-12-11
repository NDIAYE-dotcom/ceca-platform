import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use a relative base so built assets load correctly on GitHub Pages
  base: './',
  plugins: [react()],
})
