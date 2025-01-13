import { Editor, Element as SlateElement, Transforms } from 'slate';
import { useSlate } from 'slate-solid';
import {
  FaSolidAlignCenter,
  FaSolidAlignJustify,
  FaSolidAlignLeft,
  FaSolidAlignRight,
  FaSolidBold,
  FaSolidCode,
  FaSolidHeading,
  FaSolidItalic,
  FaSolidList,
  FaSolidListOl,
  FaSolidListUl,
  FaSolidQuoteLeft,
  FaSolidUnderline,
} from 'solid-icons/fa';
import { type JSXElement, type Accessor } from 'solid-js';

import { LIST_TYPES, TEXT_ALIGN_TYPES } from '../lib/const.js';
import { type TextAlign, type CustomElement } from '../lib/editor-types.js';

function isMarkActive(editor: Editor, format: string) {
  const marks = Editor.marks(editor);
  return marks ? marks[format as keyof typeof marks] === true : false;
}

function isBlockActive(editor: Editor, format: string, blockType = 'type') {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = [
    ...Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType as keyof typeof n] === format,
    }),
  ];

  return !!match;
}

function toggleBlock(editor: Editor, format: string) {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.has(format) ? 'align' : 'type',
  );
  const isList = LIST_TYPES.has(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.has(n.type) &&
      !TEXT_ALIGN_TYPES.has(format),
    split: true,
  });
  const resolveList = isList ? 'list_item' : (format as SlateElement['type']);
  const newProperties: Partial<SlateElement> = TEXT_ALIGN_TYPES.has(format)
    ? {
        align: isActive ? undefined : (format as Exclude<TextAlign, undefined>),
      }
    : {
        type: isActive ? 'paragraph' : resolveList,
      };
  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block as SlateElement);
  }
}

export function toggleMark(editor: Editor, format: string) {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

function MarkButton(props: { format: string; icon: JSXElement }) {
  const editor = useSlate();
  return (
    <button
      class="rounded px-2 py-[1px] text-[#aaa] hover:bg-[#ecedef]"
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, props.format);
      }}
      style={{
        'background-color': isMarkActive(useSlate(), props.format)
          ? '#ecedef'
          : '',
      }}
    >
      {props.icon}
    </button>
  );
}

function BlockButton(props: {
  format: CustomElement['type'] | 'left' | 'center' | 'right' | 'justify';
  icon: JSXElement;
}) {
  const editor = useSlate();
  return (
    <button
      class="rounded px-2 py-[1px] text-[#aaa] hover:bg-[#ecedef]"
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, props.format);
      }}
      style={{
        'background-color': isBlockActive(
          useSlate(),
          props.format,
          TEXT_ALIGN_TYPES.has(props.format) ? 'align' : 'type',
        )
          ? '#ecedef'
          : '',
      }}
    >
      {props.icon}
    </button>
  );
}

export function Toolbar(props: {
  selected: Accessor<boolean>;
  fullscreen: Accessor<boolean>;
}) {
  return (
    <div
      class="absolute -z-20 flex w-full -translate-y-full rounded bg-white p-1"
      style={
        props.selected()
          ? {}
          : props.fullscreen()
            ? { translate: 'unset' }
            : { display: 'none' }
      }
      data-testid="toolbar"
    >
      <MarkButton format="bold" icon={<FaSolidBold />} />
      <MarkButton format="italic" icon={<FaSolidItalic />} />
      <MarkButton format="underline" icon={<FaSolidUnderline />} />
      <MarkButton format="code" icon={<FaSolidCode />} />
      <BlockButton format="heading_one" icon={<FaSolidHeading />} />
      {/* <BlockButton format="heading_two" icon={<FaSolidHeading />} /> */}
      <BlockButton format="block_quote" icon={<FaSolidQuoteLeft />} />
      <BlockButton format="bulleted_list" icon={<FaSolidListUl />} />
      <BlockButton format="ordered_list" icon={<FaSolidListOl />} />
      <BlockButton format="check_list" icon={<FaSolidList />} />
      <BlockButton format="left" icon={<FaSolidAlignLeft />} />
      <BlockButton format="center" icon={<FaSolidAlignCenter />} />
      <BlockButton format="right" icon={<FaSolidAlignRight />} />
      <BlockButton format="justify" icon={<FaSolidAlignJustify />} />
    </div>
  );
}
