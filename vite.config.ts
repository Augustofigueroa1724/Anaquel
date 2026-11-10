import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base '/' para Capacitor (app nativa). GitHub Pages sirve el repo en /Anaquel/:
// el workflow pages.yml define PAGES_BASE=/Anaquel/.
export default defineConfig({
  plugins: [react()],
  base: process.env.PAGES_BASE ?? '/',
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
