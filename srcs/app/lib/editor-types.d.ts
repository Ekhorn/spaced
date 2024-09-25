// Editor types

import { type BaseEditor, type BaseRange, type Descendant } from 'slate';
import { type SolidEditor } from 'slate-solid';

export type CustomText = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  underline?: boolean;
  text: string;
};

export type EmptyText = {
  text: string;
};

export type BlockQuoteElement = {
  type: 'block-quote';
  align?: string;
  children: Descendant[];
};

export type BulletedListElement = {
  type: 'bulleted-list';
  align?: string;
  children: Descendant[];
};

export type CheckListItemElement = {
  type: 'check-list-item';
  checked: boolean;
  children: Descendant[];
};

export type HeadingElement = {
  type: 'heading';
  align?: string;
  children: Descendant[];
};

export type HeadingTwoElement = {
  type: 'heading-two';
  align?: string;
  children: Descendant[];
};

export type ImageElement = {
  type: 'image';
  url: string;
  children: EmptyText[];
};

export type LinkElement = { type: 'link'; url: string; children: Descendant[] };

export type ButtonElement = { type: 'button'; children: Descendant[] };

export type ListItemElement = { type: 'list-item'; children: Descendant[] };

export type ParagraphElement = {
  type: 'paragraph';
  align?: string;
  children: Descendant[];
};

// export type TableElement = { type: 'table'; children: TableRow[] };

// export type TableCellElement = { type: 'table-cell'; children: CustomText[] };

// export type TableRowElement = { type: 'table-row'; children: TableCell[] };

export type VideoElement = {
  type: 'video';
  url: string;
  children: EmptyText[];
};

export type CodeBlockElement = {
  type: 'code-block';
  language: string;
  children: Descendant[];
};

export type CodeLineElement = {
  type: 'code-line';
  children: Descendant[];
};

type CustomElement =
  | BlockQuoteElement
  | BulletedListElement
  | CheckListItemElement
  | HeadingElement
  | HeadingTwoElement
  | ImageElement
  | LinkElement
  | ButtonElement
  | ListItemElement
  | ParagraphElement
  // | TableElement
  // | TableRowElement
  // | TableCellElement
  | VideoElement
  | CodeBlockElement
  | CodeLineElement;

export type CustomEditor = BaseEditor & SolidEditor;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
    Range: BaseRange & {
      [key: string]: unknown;
    };
  }
}
