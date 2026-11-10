import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base '/' para la app nativa (Capacitor) y para servir en local.
export default defineConfig({
  plugins: [react()],
  base: '/',
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
