import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  root: 'app',
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: '../dist'
  },
});
