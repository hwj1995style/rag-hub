import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:18080';
const devPort = Number(process.env.VITE_PORT || '5173');

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: devPort,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/actuator': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
