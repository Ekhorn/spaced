import { defineConfig } from 'vite';

export default defineConfig(async () => ({
  server: {
    port: 1421,
    strictPort: true,
  },
  build: {
    target: 'esnext',
  },
}));
