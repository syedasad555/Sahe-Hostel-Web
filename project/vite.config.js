import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.json'],
  server: {
    host: '0.0.0.0', 
    port: 3000,
    allowedHosts: ['hostel-wsdx.onrender.com'], 
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    allowedHosts: ['hostel-wsdx.onrender.com'],
    // Same as dev: preview (`npm start` / `vite preview`) must proxy /api to the backend
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
