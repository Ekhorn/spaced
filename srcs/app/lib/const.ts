import { type MimeTypes } from './types.js';

export const isTauri = '__TAURI__' in window;

export const allowedMimeTypes = new Set<MimeTypes>([
  'text/plain',
  'text/markdown',
  'image/png',
]);
