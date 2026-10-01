import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  // keep CRA's output folder so the existing `pm2 serve` deploy is unchanged
  build: { outDir: 'build' },
});
