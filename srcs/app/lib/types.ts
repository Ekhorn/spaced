export type MimeTypes = 'text/plain' | 'text/markdown';

export type Item = {
  id?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  name?: string;
  mime: MimeTypes;
  schema?: string;
};
