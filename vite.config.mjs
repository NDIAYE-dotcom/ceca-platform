import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Absolute base: the site is served from the domain root on Vercel (www.ceca-org.com).
// A relative base ('./') breaks any direct/deep link — e.g. www.ceca-org.com/formation/xxx —
// because the SPA catch-all rewrite serves the same index.html for that path, and the
// browser then resolves "./assets/x.js" against /formation/ instead of /, 404ing the
// asset and rendering a blank page.
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
