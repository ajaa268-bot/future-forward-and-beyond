import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5185,
    allowedHosts: [
      'plauxie.life',
      'www.plauxie.life',
      '.plauxie.life',
      '.railway.app',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:4180',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:4180',
        ws: true
      }
    }
  },
  preview: {
    host: true,
    allowedHosts: [
      'plauxie.life',
      'www.plauxie.life',
      '.plauxie.life',
      '.railway.app'
    ]
  }
});
