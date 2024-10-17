// import { micromark } from 'micromark';
import { type Descendant } from 'slate';
import {
  createMemo,
  onMount,
  type Setter,
  mergeProps,
  ErrorBoundary,
} from 'solid-js';

import { useIPC } from './IPCProvider.js';
import { useSelection } from './SelectionProvider.js';
import { useViewport } from './ViewportProvider.js';
import { Wysiwyg } from './WYSIWYG.js';
import { type Item } from '../lib/types.js';
import { absoluteToRelative, Vec2D } from '../lib/vector.js';

type ContainerProps = {
  readonly index: number;
  readonly item: Item;
  readonly setItems: Setter<Item[]>;
};

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
  function handleBlur() {
    if (holdingCtrl() || holdingShift()) {
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
  let ref!: HTMLDivElement;

  onMount(() => {
    document.addEventListener('focusout', handleBlur);
  });

  const schema = createMemo<Descendant[]>(() => JSON.parse(props.item.schema!));

  const renderProps = mergeProps(
    {
      ref,
      scalar,
      selected,
      translation,
      schema,
    },
    props,
  );

  return (
    <div
      class="absolute min-h-8 min-w-8 whitespace-pre rounded outline-1 hover:outline"
      style={{
        'pointer-events': 'all',
        'transform-origin': 'top left',
        'outline-style': selected() ? 'solid' : 'unset',
        translate: `
          ${translation().x}px
          ${-translation().y}px
        `,
        scale: String(scalar()),
      }}
      tabIndex={0}
      onClick={handleClick}
      onKeyUp={handleKeyUp}
      ref={ref}
    >
      <ErrorBoundary fallback={<RenderFallback {...renderProps} />}>
        <Wysiwyg
          initialValue={schema()}
          style={{
            padding: '4px',
            'background-color': 'white',
            'border-radius': '4px',
          }}
          index={props.index}
          item={props.item}
          setItems={props.setItems}
        />
      </ErrorBoundary>
    </div>
  );
}

function RenderFallback() {
  return 'Error occured';
}

// type RenderProps = {
//   readonly index: number;
//   readonly item: Item;
//   readonly ref: HTMLDivElement;
//   readonly schema: Accessor<Descendant[]>;
//   readonly selected: Accessor<boolean>;
//   readonly setItems: Setter<Item[]>;
//   readonly translation: Accessor<Vec2D>;
//   readonly scalar: Accessor<number>;
// };

// const renderMap: Record<MimeTypes, ValidComponent> = {
//   'text/markdown': RenderMarkdown,
//   'image/png': renderImage,
//   'image/svg+xml': renderImage,
//   'image/jpeg': renderImage,
//   'image/gif': renderImage,
//   'application/pdf': renderPdf,
// };

// function RenderUnkown(props: RenderProps) {
//   // eslint-disable-next-line solid/reactivity
//   return `Unkown media type:\n${props.schema().mime}`;
// }

// function Render(props: RenderProps) {
//   return (
//     <Dynamic
//       component={renderMap?.[props.schema().mime as MimeTypes] ?? RenderUnkown}
//       {...props}
//     />
//   );
// }

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
