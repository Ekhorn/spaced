export type Item = {
  id?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  name?: string;
  schema?: string;
};

export type Storage = 'local' | 'browser' | 'cloud';
