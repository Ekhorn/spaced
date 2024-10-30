import {
  createEditor,
  Editor,
  Element as SlateElement,
  Node as SlateNode,
  Transforms,
  type Descendant,
} from 'slate';
import { withHistory } from 'slate-history';
import {
  Editable,
  type RenderElementProps,
  type RenderLeafProps,
  Slate,
  SolidEditor,
  useSlateStatic,
  withSolid,
} from 'slate-solid';
import isHotkey from 'slate-solid/utils/is-hotkey.js';
import {
  type JSX,
  type Accessor,
  type JSXElement,
  createMemo,
  type Setter,
  mergeProps,
  ErrorBoundary,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { useIPC } from './IPCProvider.js';
import { useSelection } from './SelectionProvider.js';
import { toggleMark, Toolbar } from './Toolbar.jsx';
import { useViewport } from './ViewportProvider.js';
import {
  type CheckListElement,
  type CustomEditor,
  type CustomElement,
} from '../lib/editor-types.js';
import { withDelBackFix, withShortcuts, MD_SHORTCUTS } from '../lib/plugins.js';
import { type Item } from '../lib/types.js';
import { absoluteToRelative, Vec2D } from '../lib/vector.js';

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

interface ContainerProps {
  readonly index: number;
  readonly item: Item;
  readonly setItems: Setter<Item[]>;
}

export function Container(props: ContainerProps) {
  const { absoluteViewportPosition, scalar } = useViewport();
  const translation = createMemo(() =>
    absoluteToRelative(
      new Vec2D(props.item.x, props.item.y),
      absoluteViewportPosition(),
      scalar(),
    ),
  );

  const { getSelected, holdingCtrl, holdingShift, register, unregister } =
    useSelection();
  const { deleteItem } = useIPC();
  const selected = createMemo(() => getSelected().has(props.item.id!));

  function handleClick() {
    register(props.item.id!);
  }
  function handleFocusOut(event: FocusEvent) {
    if (
      (event.currentTarget as Node).contains(event.relatedTarget as Node) ||
      holdingCtrl() ||
      holdingShift()
    ) {
      return;
    }
    unregister(props.item.id!);
  }
  async function handleKeyUp(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === 'Delete' && selected()) {
      try {
        const id = await deleteItem(props.item.id!);
        props.setItems((prev) => prev.filter((item) => item.id != id));
      } catch {
        /**/
      }
      return;
    }
  }
  const schema = createMemo<Descendant[]>(() => JSON.parse(props.item.schema!));
  const renderProps = mergeProps({ selected }, props);

  return (
    <div
      class="absolute min-h-8 min-w-8 whitespace-pre rounded"
      style={{
        'pointer-events': 'all',
        'transform-origin': 'top left',
        translate: `
          ${translation().x}px
          ${-translation().y}px
        `,
        scale: String(scalar()),
      }}
      tabIndex={0}
      onClick={handleClick}
      onKeyUp={handleKeyUp}
      onFocusOut={handleFocusOut}
    >
      <ErrorBoundary fallback={<RenderFallback {...props} />}>
        <Render initialValue={schema()} {...renderProps} />
      </ErrorBoundary>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RenderFallback(_props: ContainerProps) {
  return 'Error occured';
}

interface RenderProps extends ContainerProps {
  readonly selected: Accessor<boolean>;
}

export function Render(
  props: RenderProps & {
    initialValue: Descendant[];
  },
) {
  // eslint-disable-next-line solid/reactivity
  const isMarkdown = props.item.editor === 'markdown';

  const plugins: (<T extends CustomEditor>(editor: T) => T)[] = [
    withDelBackFix,
    withSolid,
    withHistory,
  ];
  if (isMarkdown) {
    plugins.push(withShortcuts);
  }

  // eslint-disable-next-line unicorn/no-array-reduce
  const editor = plugins.reduce((acc, fn) => fn(acc), createEditor());

  const { updateItem } = useIPC();

  const handleDOMBeforeInput = () => {
    queueMicrotask(() => {
      const pendingDiffs = SolidEditor.androidPendingDiffs(editor);

      const scheduleFlush = pendingDiffs?.some(({ diff, path }) => {
        if (!diff.text.endsWith(' ')) {
          return false;
        }

        const { text } = SlateNode.leaf(editor, path);
        const beforeText = text.slice(0, diff.start) + diff.text.slice(0, -1);
        if (!(beforeText in MD_SHORTCUTS)) {
          return;
        }

        const blockEntry = Editor.above(editor, {
          at: path,
          match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        });
        if (!blockEntry) {
          return false;
        }

        const [, blockPath] = blockEntry;
        return Editor.isStart(editor, Editor.start(editor, path), blockPath);
      });

      if (scheduleFlush) {
        SolidEditor.androidScheduleFlush(editor);
      }
    });
  };

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
      <Toolbar selected={props.selected} />
      <div class="h-1 w-[424px]" />
      <Editable
        onDOMBeforeInput={isMarkdown ? handleDOMBeforeInput : undefined}
        readOnly={!props.selected()}
        renderElement={RenderElement}
        renderLeaf={RenderLeaf}
        placeholder="Enter some rich text…"
        spellCheck
        style={{
          padding: '4px',
          'background-color': 'white',
          'border-radius': '4px',
        }}
        onKeyDown={(event: KeyboardEvent) => {
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event)) {
              event.preventDefault();
              const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
              toggleMark(editor, mark);
            }
          }
        }}
      />
    </Slate>
  );
}

type Element = (
  props: Omit<RenderElementProps, 'attributes'> &
    RenderElementProps['attributes'] & { style?: string | JSX.CSSProperties },
) => JSXElement;

/* eslint-disable solid/no-destructure, @typescript-eslint/no-unused-vars */
const block_quote: Element = ({ element, ...p }) => <blockquote {...p} />,
  bulleted_list: Element = ({ element, ...props }) => <ul {...props} />,
  heading_one: Element = ({ element, ...props }) => <h1 {...props} />,
  // heading_two: Element = ({element, ...props}) => <h2 {...props} />,
  ordered_list: Element = ({ element, ...props }) => <ol {...props} />,
  list_item: Element = ({ element, ...props }) => <li {...props} />,
  link: Element = ({ element, ...props }) => <a {...props} />,
  paragraph: Element = ({ element, ...props }) => <p {...props} />;
/* eslint-enable solid/no-destructure, @typescript-eslint/no-unused-vars */

// eslint-disable-next-line solid/no-destructure
const check_list: Element = ({ children, element, ...attributes }) => {
  const editor = useSlateStatic();
  // const readOnly = useReadOnly()
  const { checked } = element as CheckListElement;
  return (
    <div class="flex flex-row items-center" {...attributes}>
      <span contenteditable={false} class="mx-1">
        <input
          type="checkbox"
          checked={checked}
          class="w-max"
          onChange={(event) => {
            const path = SolidEditor.findPath(editor, element);
            const newProperties: Partial<SlateElement> = {
              checked: event.target.checked,
            };
            Transforms.setNodes(editor, newProperties, { at: path });
          }}
        />
      </span>
      <span
        // contenteditable={false /*!readOnly*/}
        class="flex-1"
        style={{
          opacity: `${checked ? 0.666 : 1}`,
          'text-decoration': `${checked ? 'line-through' : 'none'}`,
          // "&:focus" {
          //   "outline": none;
          // }
        }}
      >
        {children}
      </span>
    </div>
  );
};

const elementsMap: Record<Exclude<CustomElement['type'], 'image'>, Element> = {
  block_quote,
  list_item,
  ordered_list,
  bulleted_list,
  check_list,
  heading_one,
  // heading_two,
  // image,
  link,
  paragraph,
};

function RenderElement(props: RenderElementProps): JSXElement {
  return (
    <Dynamic
      children={props.children}
      component={
        elementsMap[
          props.element.type as Exclude<CustomElement['type'], 'image'>
        ] ?? ((props) => <p {...props} />)
      }
      element={props.element}
      style={{
        'text-align':
          'align' in props.element ? props.element.align : undefined,
      }}
      {...props.attributes}
    />
  );
}

function RenderLeaf(props: RenderLeafProps) {
  return (
    <span {...props.attributes}>
      {(() => {
        let children = props.children as JSXElement;
        if (props.leaf.bold) {
          children = <strong>{children}</strong>;
        }
        if (props.leaf.code) {
          children = <code>{children}</code>;
        }
        if (props.leaf.italic) {
          children = <em>{children}</em>;
        }
        if (props.leaf.underline) {
          children = <u>{children}</u>;
        }
        return children;
      })()}
    </span>
  );
}

// function renderImage(props: RenderImage) {
//   const { getAsset } = useIPC();

//   let ref!: HTMLImageElement;

//   onMount(async () => {
//     const { content } = props.schema();
//     if (content) {
//       const asset = await getAsset(content);
//       const blob = new Blob([new Uint8Array(asset.data)], { type: asset.mime });
//       ref.src = URL.createObjectURL(blob);
//     }
//   });

//   return <img ref={ref} class="pointer-events-none" />;
// }

// type RenderPdf = RenderProps;

// function renderPdf(props: RenderPdf) {
//   const { getAsset } = useIPC();

//   let ref!: HTMLObjectElement;

//   onMount(async () => {
//     const { content } = props.schema();
//     if (content) {
//       const asset = await getAsset(content);
//       const blob = new Blob([new Uint8Array(asset.data)], { type: asset.mime });
//       ref.data = URL.createObjectURL(blob);
//     }
//   });

//   return (
//     <object
//       style={{
//         'pointer-events': 'all',
//       }}
//       ref={ref}
//     ></object>
//   );
// }
