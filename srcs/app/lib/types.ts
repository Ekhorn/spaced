import { type allowedMimeTypes } from './const.js';

export type MimeTypes =
  typeof allowedMimeTypes extends Set<infer U> ? U : never;

export type Item = {
  id?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  name?: string;
  mime: MimeTypes;
  schema?: string;
  file?: number[];
};

export type Storage = 'local' | 'browser' | 'cloud';
