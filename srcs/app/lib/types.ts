import { type allowedMimeTypes } from './const.js';

export type Storage = 'local' | 'browser' | 'cloud';

export type MimeTypes =
  typeof allowedMimeTypes extends Set<infer U> ? U : never;

export type Item = {
  id?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  schema?: string;
};

export type Asset = {
  id?: number | string;
  name: string;
  mime: string;
  data: number[];
};
