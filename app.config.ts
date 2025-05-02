import { defineConfig } from '@tanstack/react-start/config';

export default defineConfig({
  server: {
    preset: 'vercel',
  },
  vite: {
    build: {
      rollupOptions: {
        input: './index.html',
      },
    },
  },
});
