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
    // Configuración de Vitest
    globals: true, // Para no tener que importar describe, it, expect, etc.
    environment: 'jsdom', // Simula el DOM
    css: true, // Habilita procesamiento de CSS si es necesario (ej. CSS Modules)
  },
});
