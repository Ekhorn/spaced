import { type Descendant, type BaseEditor, type BaseRange } from 'slate';
import { type SolidEditor } from 'slate-solid';

export type EmptyText = {
  text: string;
};

export type CustomText = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  underline?: boolean;
  text: string;
};

interface BaseElement<T extends CustomElement['type']> {
  type: T;
}

export interface BlockQuoteElement extends BaseElement {
  type: 'block_quote';
  align?: string;
  children: Descendant[];
}

export interface BulletedListElement extends BaseElement {
  type: 'bulleted_list';
  align?: string;
  children: Descendant[];
}

export interface CheckListItemElement extends BaseElement {
  type: 'check_list_item';
  checked: boolean;
  children: Descendant[];
}

export interface HeadingElement extends BaseElement {
  type: 'heading';
  align?: string;
  children: Descendant[];
}

export interface HeadingTwoElement extends BaseElement {
  type: 'heading_two';
  align?: string;
  children: Descendant[];
}

export interface ImageElement extends BaseElement {
  type: 'image';
  mime: string;
  name: string;
  uuid: string | number;
}

export interface LinkElement extends BaseElement {
  type: 'link';
  url: string;
  children: Descendant[];
}

export interface ButtonElement extends BaseElement {
  type: 'button';
  children: Descendant[];
}

export interface ListItemElement extends BaseElement {
  type: 'list_item';
  children: Descendant[];
}

export interface ParagraphElement extends BaseElement {
  type: 'paragraph';
  align?: string;
  children: Descendant[];
}

// export interface TableElement extends BaseElement { type: 'table'; children: TableRow[] };

// export interface TableCellElement extends BaseElement { type: 'table_cell'; children: CustomText[] };

// export interface TableRowElement extends BaseElement { type: 'table_row'; children: TableCell[] };

// export interface VideoElement extends BaseElement {
//   type: 'video';
//   mime: string;
//   name: string;
//   uuid: string | number;
// };

export interface CodeBlockElement extends BaseElement {
  type: 'code_block';
  language: string;
  children: EmptyText[];
}

export interface CodeLineElement extends BaseElement {
  type: 'code_line';
  children: EmptyText[];
}

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
  // | VideoElement
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
