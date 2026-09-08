import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: http://10.0.10.160:8005",
    },
    proxy: {
      '/api': {
        target: 'http://10.0.10.160:8005',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://10.0.10.160:8005',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
  },
})
