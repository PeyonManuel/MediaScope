import { defineConfig } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
  ],
  test: {
    globals: true,
    environment: 'jsdom', // <-- MAKE SURE THIS LINE EXISTS AND IS SPELLED CORRECTLY
    setupFiles: './src/setupTests.ts', // Ensure this path is correct too
    css: true,
  },
});
