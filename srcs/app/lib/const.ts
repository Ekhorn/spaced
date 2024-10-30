import { type ListTypes, type TextAlign } from './editor-types.js';

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

export const LIST_TYPES = new Set<string>([
  'bulleted_list',
  'ordered_list',
] as ListTypes[]);

export const TEXT_ALIGN_TYPES = new Set<string>([
  'left',
  'center',
  'right',
  'justify',
] as Exclude<TextAlign, undefined>[]);
