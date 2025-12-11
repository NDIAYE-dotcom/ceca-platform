import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ensure built assets use relative paths so GitHub Pages (served from /repo/) finds them
export default defineConfig({
  base: './',
  plugins: [react()],
})
