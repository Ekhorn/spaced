import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from '@std/path';

export default defineConfig(() => ({
  plugins: [
    solidPlugin(),
    tailwindcss(
      {
        content: ['./srcs/app/**/*.{html,js,jsx,ts,tsx}'],
        theme: {
          extend: {},
        },
        plugins: [],
      } as import('@tailwindcss/vite').PluginOptions,
    ),
  ],
  root: 'srcs/app',
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  // prevent vite from obscuring rust errors
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      '/socket.io': {
        target: 'ws://localhost:8081',
        ws: true,
      },
      // '/api/user': {
      //   target: 'http://localhost:8082',
      // },
    },
  },
  // to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ['VITE_', 'TAURI_'],
  resolve: {
    alias: {
      'slate-solid': resolve(__dirname, 'srcs/slate-solid'),
      'slate-yjs-solid': resolve(__dirname, 'srcs/slate-yjs-solid'),
    },
  },
  build: {
    target: 'esnext',
    outDir: '../../dist',
  },
  test: {
    root: 'srcs',
    exclude: ['e2e'],
    environment: 'jsdom',
  },
}));
