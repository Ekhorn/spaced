import { type BaseText } from 'slate';

declare module 'slate' {
  interface CustomTypes {
    Text: BaseText & {
      placeholder?: string;
      onPlaceholderResize?: (node: HTMLElement | null) => void;
      // FIXME: is unknown correct here?
      [key: string]: unknown;
    };
  }
}

declare global {
  interface DocumentOrShadowRoot {
    getSelection(): Selection | null;
  }
}

export {};
