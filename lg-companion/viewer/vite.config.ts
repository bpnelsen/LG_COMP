import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/map': 'http://localhost:3001',
      '/captures': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
});
