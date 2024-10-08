import { micromark } from 'micromark';
import {
  type Accessor,
  type ValidComponent,
  createMemo,
  onMount,
  type Setter,
  ErrorBoundary,
  mergeProps,
  onCleanup,
  createEffect,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { useIPC } from './IPCProvider.jsx';
import { useSelection } from './SelectionProvider.js';
import { useViewport } from './ViewportProvider.js';
import {
  type MimeTypes,
  type Item,
  type ComponentSchemas,
} from '../lib/types.js';
import { absoluteToRelative, Vec2D } from '../lib/vector.js';

type ContainerProps = {
  readonly index: number;
  readonly item: Item;
  readonly setItems: Setter<Item[]>;
};

function handleBeforeInput(event: InputEvent) {
  if (event.inputType === 'insertParagraph') {
    event.preventDefault();
    const text = document.createTextNode('\n');
    const selection = window.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(text);
      range.setStartAfter(text);
      range.setEndAfter(text);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}

export function makeEventListener(
  target: EventTarget,
  type: string,
  handler: (event: Event) => void,
  options?: EventListenerOptions,
): void {
  createEffect(() => {
    target.addEventListener(type, handler, options);
    onCleanup(() => {
      target.removeEventListener(type, handler, options);
    });
  });
}

export function useClickOutside(
  ref: EventTarget,
  handler: (event: Event) => void,
): void {
  function listener(event: Event): void {
    if (!ref) {
      return;
    }
    const composedPath = event.composedPath();
    if (composedPath.includes(ref)) {
      return;
    }

    handler(event);
  }

  makeEventListener(document, 'mousedown', listener);
  makeEventListener(document, 'touchstart', listener);
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
    useClickOutside(ref, handleBlur);
  });

  const schema = createMemo<ComponentSchemas>(() =>
    JSON.parse(props.item.schema!),
  );

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
      class="absolute min-h-8 min-w-8 whitespace-pre rounded bg-white p-1 outline-1 hover:outline"
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
        <Render {...renderProps} />
      </ErrorBoundary>
    </div>
  );
}

function RenderFallback() {
  return 'Error occured';
}

type RenderProps = {
  readonly index: number;
  readonly item: Item;
  readonly ref: HTMLDivElement;
  readonly schema: Accessor<ComponentSchemas>;
  readonly selected: Accessor<boolean>;
  readonly setItems: Setter<Item[]>;
  readonly translation: Accessor<Vec2D>;
  readonly scalar: Accessor<number>;
};

const renderMap: Record<MimeTypes, ValidComponent> = {
  'text/plain': RenderText,
  'text/markdown': RenderMarkdown,
  'image/png': renderImage,
  'image/svg+xml': renderImage,
  'image/jpeg': renderImage,
  'image/gif': renderImage,
  'application/pdf': renderPdf,
};

function RenderUnkown(props: RenderProps) {
  // eslint-disable-next-line solid/reactivity
  return `Unkown media type:\n${props.schema().mime}`;
}

function Render(props: RenderProps) {
  return (
    <Dynamic
      component={renderMap?.[props.schema().mime as MimeTypes] ?? RenderUnkown}
      {...props}
    />
  );
}

type RenderTextProps = RenderProps;

function RenderText(props: RenderTextProps) {
  const { updateItem } = useIPC();

  let ref!: HTMLDivElement;

  async function handleKeyUp(e: KeyboardEvent) {
    e.stopPropagation();

    const schema: ComponentSchemas = {
      ...props.schema(),
      content: ref.textContent!,
    };

    const [item] = await updateItem([
      {
        ...props.item,
        schema: JSON.stringify(schema),
      },
    ]);
    // eslint-disable-next-line solid/reactivity
    props.setItems((prev) => prev.with(props.index, item));
  }

  onMount(() => {
    ref.textContent = props.schema().content ?? '';
  });

  return (
    <div
      onPaste={(e) => e.stopPropagation()}
      onBeforeInput={handleBeforeInput}
      onKeyUp={handleKeyUp}
      contenteditable={props.selected()}
      style={{
        'line-height': '1rem',
      }}
      ref={ref}
    ></div>
  );
}

type RenderMarkdownProps = RenderProps;

function RenderMarkdown(props: RenderMarkdownProps) {
  let ref!: HTMLDivElement;

  onMount(async () => {
    const result = micromark(props.schema().content ?? '', {
      // extensions: [gfm()],
      // htmlExtensions: [gfmHtml()],
    });
    ref.innerHTML = String(result);
  });

  return <div id="markdown-content" ref={ref} />;
}

type RenderImage = RenderProps;

function renderImage(props: RenderImage) {
  const { getAsset } = useIPC();

  let ref!: HTMLImageElement;

  onMount(async () => {
    const { content } = props.schema();
    if (content) {
      const asset = await getAsset(content);
      const blob = new Blob([new Uint8Array(asset.data)], { type: asset.mime });
      ref.src = URL.createObjectURL(blob);
    }
  });

  return <img ref={ref} class="pointer-events-none" />;
}

type RenderPdf = RenderProps;

function renderPdf(props: RenderPdf) {
  const { getAsset } = useIPC();

  let ref!: HTMLObjectElement;

  onMount(async () => {
    const { content } = props.schema();
    if (content) {
      const asset = await getAsset(content);
      const blob = new Blob([new Uint8Array(asset.data)], { type: asset.mime });
      ref.data = URL.createObjectURL(blob);
    }
  });

  return (
    <object
      style={{
        'pointer-events': 'all',
      }}
      ref={ref}
    ></object>
  );
}
