import {
  Editor,
  normalizeNode,
  Point,
  Range,
  Element as SlateElement,
  Transforms,
} from 'slate';

import { LIST_TYPES, TEXT_ALIGN_TYPES } from './const.js';
import { type TextAlign, type CustomElement } from './editor-types.js';

export const withDelBackFix = <T extends Editor>(editor: T): T => {
  const { deleteBackward } = editor;

  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      });

      if (match) {
        const [block, path] = match;
        const start = Editor.start(editor, path);

        if (
          !Editor.isEditor(block) &&
          // TODO: redundant?
          SlateElement.isElement(block) &&
          block.type !== 'paragraph' &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties: Partial<SlateElement> = {
            type: 'paragraph',
          };
          Transforms.setNodes(editor, newProperties);

          if (block.type === 'list_item') {
            Transforms.unwrapNodes(editor, {
              match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                LIST_TYPES.has(n.type),
              split: true,
            });
          }

          return;
        }
      }

      deleteBackward(...args);
    }
  };

  return editor;
};

export const MD_SHORTCUTS: Record<string, CustomElement['type']> = {
  // TODO: Fix text marks
  // '**': 'bold',
  // _: 'italic',
  // '`': 'code',
  '*': 'bulleted_list',
  '-': 'bulleted_list',
  '+': 'bulleted_list',
  '1.': 'ordered_list',
  '>': 'block_quote',
  '#': 'heading_one',
  // '##': 'heading_two',
  // '###': 'heading_three',
  // '####': 'heading_four',
  // '#####': 'heading_five',
  // '######': 'heading_six',
  '-[]': 'check_list',
} as const;

/**
 * @link original source: https://github.com/ianstormtaylor/slate/blob/f9ebbb88084b9f4b34c2a2e0523defb52cae88c2/site/examples/ts/markdown-shortcuts.tsx#L85
 */
export const withShortcuts = <T extends Editor>(editor: T) => {
  const { insertText } = editor;

  editor.insertText = (text) => {
    const { selection } = editor;

    if (text.endsWith(' ') && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const block = Editor.above(editor, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      });
      const path = block ? block[1] : [];
      const start = Editor.start(editor, path);
      const range = { anchor, focus: start };
      const beforeText = Editor.string(editor, range) + text.slice(0, -1);
      const format = MD_SHORTCUTS[beforeText as keyof typeof MD_SHORTCUTS];

      if (format) {
        Transforms.select(editor, range);

        if (!Range.isCollapsed(range)) {
          Transforms.delete(editor);
        }

        const isList = LIST_TYPES.has(format);

        const resolveList = isList
          ? 'list_item'
          : (format as SlateElement['type']);

        const newProperties: Partial<SlateElement> = TEXT_ALIGN_TYPES.has(
          format as Exclude<TextAlign, undefined>,
        )
          ? {
              align: format as Exclude<TextAlign, undefined>,
            }
          : {
              type: resolveList,
            };

        Transforms.setNodes<SlateElement>(editor, newProperties, {
          match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        });

        if (isList) {
          const block = { type: format, children: [] };
          Transforms.wrapNodes(editor, block as SlateElement);
        }

        return;
      }
    }

    insertText(text);
  };

  return editor;
};

export const withValidNode = <T extends Editor>(editor: T) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node] = entry;

    if (!Editor.isEditor(node) || node.children.length > 0) {
      return normalizeNode(entry);
    }

    Transforms.insertNodes(
      editor,
      [{ type: 'paragraph', children: [{ text: '' }] }],
      { at: [0] },
    );
  };

  return editor;
};
