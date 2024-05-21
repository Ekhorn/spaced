export type MimeTypes = 'text/plain' | 'text/markdown' | 'image/png';

export type Item = {
  id?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  name?: string;
  mime: MimeTypes;
  schema?: string;
  blob?: ArrayBuffer;
};

export type Storage = 'local' | 'browser' | 'web';
