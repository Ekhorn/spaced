// import { micromark } from 'micromark';
import { createEditor, type Descendant } from 'slate';
import {
  Editable,
  type RenderElementProps,
  type RenderLeafProps,
  Slate,
  withSolid,
} from 'slate-solid';
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
import { Toolbar } from './Toolbar.jsx';
import { useViewport } from './ViewportProvider.js';
import { type CustomElement } from '../lib/editor-types.js';
import { type Item } from '../lib/types.js';
import { absoluteToRelative, Vec2D } from '../lib/vector.js';

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
      <Toolbar selected={props.selected} />
      <div class="h-1 w-[424px]" />
      <Editable
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
      />
    </Slate>
  );
}

type Element = (
  props: {
    children: JSXElement;
    style: JSX.CSSProperties;
  } & object,
) => JSXElement;

/* eslint-disable solid/no-destructure */
const block_quote: Element = (props) => <blockquote {...props} />,
  bulleted_list: Element = (props) => <ul {...props} />,
  heading_one: Element = (props) => <h1 {...props} />,
  heading_two: Element = (props) => <h2 {...props} />,
  numbered_list: Element = (props) => <ol {...props} />,
  list_item: Element = (props) => <li {...props} />;
/* eslint-enable solid/no-destructure */

const elementsMap: Record<CustomElement['type'], Element> = {
  block_quote,
  bulleted_list,
  heading_one,
  heading_two,
  numbered_list,
  list_item,
};

function RenderElement(props: RenderElementProps): JSXElement {
  return (
    <Dynamic
      children={props.children}
      component={
        elementsMap[props.element.type] ?? ((props) => <p {...props} />)
      }
      style={{
        'text-align':
          props && 'align' in props.element ? props.element.align : undefined,
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

// type RenderMarkdownProps = RenderProps;

// function RenderMarkdown(props: RenderMarkdownProps) {
//   let ref!: HTMLDivElement;

//   onMount(async () => {
//     const result = micromark(props.schema().content ?? '', {
//       // extensions: [gfm()],
//       // htmlExtensions: [gfmHtml()],
//     });
//     ref.innerHTML = String(result);
//   });

//   return <div id="markdown-content" ref={ref} />;
// }

// type RenderImage = RenderProps;

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
