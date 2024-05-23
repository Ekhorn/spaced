export const isTauri = '__TAURI__' in window;

export const allowedMimeTypes = new Set([
  'text/plain',
  'text/markdown',
  'image/png',
  'image/svg+xml',
  'image/jpeg',
  'application/pdf',
] as const);
