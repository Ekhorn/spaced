export const isTauri = '__TAURI__' in window;

export const allowedMimeTypes = new Set([
  'text/plain',
  'text/markdown',
] as const);
