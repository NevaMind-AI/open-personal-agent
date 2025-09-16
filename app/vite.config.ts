import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        // Ensure proxy keeps connection open for SSE
        configure: (proxy: any) => {
          proxy.on('proxyReq', (_proxyReq: any, req: any) => {
            console.log('[vite-proxy] ->', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes: any, req: any, res: any) => {
            console.log('[vite-proxy] <-', proxyRes.statusCode, req.url);
            // Disable buffering if any reverse proxy involved
            res.setHeader('X-Accel-Buffering', 'no');
          });
          proxy.on('error', (err: any) => { console.error('[vite-proxy] error', err?.message || err); });
        }
      },
      '/ws': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true,
      }
      ,
      '/workspace': {
        target: 'http://localhost:5174',
        changeOrigin: true,
      }
    }
  }
});
