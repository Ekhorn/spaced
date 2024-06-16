export const isTauri = '__TAURI__' in window;

export const allowedMimeTypes = new Set([
  'text/plain',
  'text/markdown',
  'image/png',
  'image/svg+xml',
  'image/jpeg',
  'image/gif',
  'application/pdf',
] as const);
