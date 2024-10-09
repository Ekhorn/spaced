export const isTauri = 'isTauri' in window && window.isTauri;

export const allowedMimeTypes = new Set([
  'text/plain',
  'text/markdown',
  'image/png',
  'image/svg+xml',
  'image/jpeg',
  'image/gif',
  'application/pdf',
] as const);
