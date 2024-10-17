import {
  type Descendant,
  Editor,
  Element as SlateElement,
  Transforms,
  createEditor,
} from 'slate';
import {
  type RenderElementProps,
  type RenderLeafProps,
  Editable,
  Slate,
  useSlate,
  withSolid,
} from 'slate-solid';
import {
  FaSolidAlignCenter,
  FaSolidAlignJustify,
  FaSolidAlignLeft,
  FaSolidAlignRight,
  FaSolidBold,
  FaSolidCode,
  FaSolidHeading,
  FaSolidItalic,
  FaSolidListOl,
  FaSolidListUl,
  FaSolidQuoteLeft,
  FaSolidUnderline,
} from 'solid-icons/fa';
import { type Setter, type JSX, type JSXElement } from 'solid-js';

import { useIPC } from './IPCProvider.jsx';
import { type Item } from '../lib/types.js';

const ElementMap: Record<
  string,
  (props: {
    attributes: object;
    children: JSXElement;
    style: JSX.CSSProperties;
  }) => JSXElement
> = {
  'block-quote': (props) => (
    <blockquote
      style={props.style}
      {...props.attributes}
      children={props.children}
    />
  ),
  'bulleted-list': (props) => (
    <ul style={props.style} {...props.attributes} children={props.children} />
  ),
  'heading-one': (props) => (
    <h1 style={props.style} {...props.attributes} children={props.children} />
  ),
  'heading-two': (props) => (
    <h2 style={props.style} {...props.attributes} children={props.children} />
  ),
  'numbered-list': (props) => (
    <ol style={props.style} {...props.attributes} children={props.children} />
  ),
  'list-item': (props) => (
    <li style={props.style} {...props.attributes} children={props.children} />
  ),
};

function Element(props: RenderElementProps): JSXElement {
  return (
    // @ts-expect-error ingore textAlign -> text-align
    <Dynamic
      component={
        ElementMap?.[props?.element?.type] ??
        ((props) => (
          <p
            {...props.attributes}
            style={props.style}
            children={props.children}
          />
        ))
      }
      {...{
        ...props,
        style: {
          'text-align':
            props && 'align' in props.element ? props.element.align : undefined,
        },
      }}
    />
  );
}

function Leaf(props: RenderLeafProps) {
  const children = () => {
    if (props.leaf.bold) {
      return <strong>{props.children}</strong>;
    }

    if (props.leaf.code) {
      return <code>{props.children}</code>;
    }

    if (props.leaf.italic) {
      return <em>{props.children}</em>;
    }

    if (props.leaf.underline) {
      return <u>{props.children}</u>;
    }
    return props.children;
  };

  return <span {...props.attributes}>{children()}</span>;
}

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

const LIST_TYPES = new Set(['numbered_list', 'bulleted_list']);

const TEXT_ALIGN_TYPES = new Set(['left', 'center', 'right', 'justify']);

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
      LIST_TYPES.has((n as SlateElement).type) &&
      !TEXT_ALIGN_TYPES.has(format),
    split: true,
  });
  const newProperties: Partial<SlateElement> = TEXT_ALIGN_TYPES.has(format)
    ? {
        align: isActive ? undefined : format,
      }
    : {
        type: isActive
          ? 'paragraph'
          : // eslint-disable-next-line unicorn/no-nested-ternary
            isList
            ? 'list_item'
            : (format as SlateElement['type']),
      };
  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block as SlateElement);
  }
}

function toggleMark(editor: Editor, format: string) {
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
      class="rounded px-2 py-[1px] hover:bg-[#ecedef]"
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, props.format);
      }}
      style={{
        color: isMarkActive(editor, props.format) ? 'white' : '#aaa',
      }}
    >
      {props.icon}
    </button>
  );
}

function BlockButton(props: { format: string; icon: JSXElement }) {
  const editor = useSlate();
  return (
    <button
      class="rounded px-2 py-[1px] hover:bg-[#ecedef]"
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, props.format);
      }}
      style={{
        color: isBlockActive(
          editor,
          props.format,
          TEXT_ALIGN_TYPES.has(props.format) ? 'align' : 'type',
        )
          ? 'white'
          : '#aaa',
      }}
    >
      {props.icon}
    </button>
  );
}

function ToolBar(props: { style: JSX.CSSProperties; children: JSXElement }) {
  return (
    <div class="flex" style={props.style}>
      {props.children}
    </div>
  );
}

export function Wysiwyg(props: {
  initialValue: Descendant[];
  style: JSX.CSSProperties;
  setItems: Setter<Item[]>;
  index: number;
  item: Item;
}) {
  const editor = withSolid(createEditor());
  const { updateItem } = useIPC();

  return (
    <Slate
      initialValue={props.initialValue}
      editor={editor}
      // eslint-disable-next-line solid/reactivity
      onValueChange={async () => {
        const [item] = await updateItem([
          {
            ...props.item,
            schema: JSON.stringify(editor.children),
          },
        ]);
        // eslint-disable-next-line solid/reactivity
        props.setItems((prev) => prev.with(props.index, item));
      }}
    >
      <ToolBar style={props.style}>
        <MarkButton format="bold" icon={<FaSolidBold />} />
        <MarkButton format="italic" icon={<FaSolidItalic />} />
        <MarkButton format="underline" icon={<FaSolidUnderline />} />
        <MarkButton format="code" icon={<FaSolidCode />} />
        <BlockButton format="heading-one" icon={<FaSolidHeading />} />
        <BlockButton format="heading-two" icon={<FaSolidHeading />} />
        <BlockButton format="block-quote" icon={<FaSolidQuoteLeft />} />
        <BlockButton format="numbered-list" icon={<FaSolidListOl />} />
        <BlockButton format="bulleted-list" icon={<FaSolidListUl />} />
        <BlockButton format="left" icon={<FaSolidAlignLeft />} />
        <BlockButton format="center" icon={<FaSolidAlignCenter />} />
        <BlockButton format="right" icon={<FaSolidAlignRight />} />
        <BlockButton format="justify" icon={<FaSolidAlignJustify />} />
      </ToolBar>
      <div class="h-1" />
      {/* @ts-expect-error TODO: resolve */}
      <Editable
        renderElement={Element}
        renderLeaf={Leaf}
        placeholder="Enter some rich text…"
        spellCheck
        style={props.style}
      ></Editable>
    </Slate>
  );
}
