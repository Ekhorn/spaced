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

interface BaseComponent<T extends ComponentSchemas['type']> {
  type: T;
  name: string;
  mime: string;
  content: string;
  styles?: string;
  descendants?: DescendantsMap[T];
}

type DescendantsMap = {
  div: ComponentSchemas[];
  input: FigureComponent;
  figure: never;
  break: never;
};

export interface DivComponent extends BaseComponent<'div'> {
  variant?: 'Markdown'; // TODO figure this out maybe another generic, but ideally it would extend from a new base, and result in 2 types instead of one.
}
export interface InputComponent extends BaseComponent<'input'> {
  variant?:
    | 'single-line'
    | 'multi-line'
    | 'time'
    | 'date-time'
    | 'date'
    | 'radio'
    | 'check'
    | 'number'
    | 'file'
    | 'color';
}
export interface FigureComponent extends BaseComponent<'figure'> {
  variant?: 'img' | 'canvas';
}
export interface BreakComponent extends BaseComponent<'break'> {}

export type ComponentSchemas =
  | DivComponent
  | InputComponent
  | FigureComponent
  | BreakComponent;
