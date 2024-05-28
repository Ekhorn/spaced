import { defineConfig } from 'vite';

export default defineConfig(async () => ({
  root: '.',
  server: {
    port: 1421,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    outDir: '../docs',
    assetsDir: '.',
  },
}));
