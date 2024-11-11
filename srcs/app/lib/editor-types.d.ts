import { type Descendant, type BaseEditor, type BaseRange } from 'slate';
import { type SolidEditor } from 'slate-solid';
import { type JSX } from 'solid-js';

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

export type TextAlign = JSX.CSSProperties['text-align'];
export type ListTypes =
  | BulletedListElement['type']
  | OrderedListElement['type'];

interface BaseElement<T extends CustomElement['type']> {
  type: T;
}

export interface BlockQuoteElement extends BaseElement {
  type: 'block_quote';
  align?: TextAlign;
  children: Descendant[];
}

export interface ListItemElement extends BaseElement {
  type: 'list_item';
  children: Descendant[];
}

export interface BulletedListElement extends BaseElement {
  type: 'bulleted_list';
  align?: TextAlign;
  children: Descendant[];
}

export interface OrderedListElement extends BaseElement {
  type: 'ordered_list';
  align?: TextAlign;
  children: Descendant[];
}

export interface CheckListElement extends BaseElement {
  type: 'check_list';
  align?: TextAlign;
  checked: boolean;
  children: Descendant[];
}

export interface HeadingOneElement extends BaseElement {
  type: 'heading_one';
  align?: TextAlign;
  children: Descendant[];
}

// export interface HeadingTwoElement extends BaseElement {
//   type: 'heading_two';
//   align?: TextAlign;
//   children: Descendant[];
// }

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

// export interface ButtonElement extends BaseElement {
//   type: 'button';
//   children: Descendant[];
// }

export interface ParagraphElement extends BaseElement {
  type: 'paragraph';
  align?: TextAlign;
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

// export interface CodeBlockElement extends BaseElement {
//   type: 'code_block';
//   language: string;
//   children: EmptyText[];
// }

type CustomElement =
  | BlockQuoteElement
  | ListItemElement
  | BulletedListElement
  | OrderedListElement
  | CheckListElement
  | HeadingOneElement
  // | HeadingTwoElement
  // | HeadingThreeElement
  // | HeadingFourElement
  // | HeadingFiveElement
  // | HeadingSixElement
  | ImageElement
  | LinkElement
  // | ButtonElement
  | ParagraphElement;
// | TableElement
// | TableRowElement
// | TableCellElement
// | VideoElement
// | CodeBlockElement;

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
