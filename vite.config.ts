import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig(async () => ({
  plugins: [solidPlugin()],
  root: 'srcs/app',
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  // prevent vite from obscuring rust errors
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      '/socket.io': {
        target: 'ws://localhost:8080',
        ws: true,
      },
      '/api/user': {
        target: 'http://localhost:8081',
      },
    },
  },
  // to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'esnext',
    outDir: '../../dist',
  },
  assetsInclude: ['**/*.rten', '**/*.wasm'],
}));
