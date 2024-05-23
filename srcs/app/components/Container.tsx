import { micromark } from 'micromark';
import {
  type Accessor,
  type ValidComponent,
  createMemo,
  onMount,
  type Setter,
  ErrorBoundary,
  mergeProps,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { useIPC } from './IPCProvider.jsx';
import { useSelection } from './SelectionProvider.js';
import { useViewport } from './ViewportProvider.js';
import { type MimeTypes, type Item } from '../lib/types.js';
import { absoluteToRelative, Vec2D } from '../lib/vector.js';

type ContainerProps = {
  readonly index: number;
  readonly setItems: Setter<Item[]>;
} & Item;

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

export function Container(props: ContainerProps) {
  const { absoluteViewportPosition, scalar } = useViewport();
  const translation = createMemo(() =>
    absoluteToRelative(
      new Vec2D(props.x, props.y),
      absoluteViewportPosition(),
      scalar(),
    ),
  );

  let ref!: HTMLDivElement;

  const renderProps = mergeProps(
    {
      ref,
      scalar,
      translation,
    },
    props,
  );

  return (
    <ErrorBoundary fallback={<RenderFallback {...renderProps} />}>
      <Render {...renderProps} />
    </ErrorBoundary>
  );
}

function RenderFallback(props: RenderProps) {
  return (
    <div
      class="absolute min-h-[30px] min-w-[30px] whitespace-pre bg-white p-1 outline outline-1"
      style={{
        'transform-origin': 'top left',
        translate: `
  ${props.translation().x}px
  ${-props.translation().y}px
`,
        scale: `${props.scalar()}`,
      }}
    >
      Error occured
    </div>
  );
}

type RenderProps = {
  readonly index: number;
  readonly setItems: Setter<Item[]>;
  readonly translation: Accessor<Vec2D>;
  readonly scalar: Accessor<number>;
  ref: HTMLDivElement;
} & Item;

const renderMap: Record<MimeTypes, ValidComponent> = {
  'text/plain': RenderText,
  'text/markdown': RenderMarkdown,
  'image/png': renderImage,
  'image/svg+xml': renderImage,
  'image/jpeg': renderImage,
};

function Render(props: RenderProps) {
  return <Dynamic component={renderMap[props.mime]} {...props} />;
}

type RenderTextProps = RenderProps;

function RenderText(props: RenderTextProps) {
  const { getSelected, holdingCtrl, holdingShift, register, unregister } =
    useSelection();
  const { deleteItem, updateItem } = useIPC();
  const selected = createMemo(() => getSelected().has(props.id!));

  function handleClick() {
    register(props.id!);
  }

  function handleBlur() {
    if (holdingCtrl() || holdingShift()) {
      return;
    }
    unregister(props.id!);
  }

  async function handleKeyUp(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
      try {
        const id = await deleteItem(props.id!);
        props.setItems((prev) => prev.filter((item) => item.id != id));
      } catch {
        /**/
      }
      return;
    } else {
      await updateItem({
        ...props,
        schema: props.ref.textContent,
      } as Item);
      return;
    }
  }

  return (
    <div
      ref={props.ref}
      onPaste={(e) => e.stopPropagation()}
      onBeforeInput={handleBeforeInput}
      onKeyUp={handleKeyUp}
      onClick={handleClick}
      onBlur={handleBlur}
      class="absolute min-h-[30px] min-w-[30px] whitespace-pre p-1 outline outline-1"
      tabIndex="0"
      contenteditable={selected()}
      style={{
        'outline-color': selected() ? 'black' : props.schema && 'transparent',
        'transform-origin': 'top left',
        'background-color': 'transparent',
        'pointer-events': 'all',
        'line-height': '1rem',
        translate: `
          ${props.translation().x}px
          ${-props.translation().y}px
        `,
        scale: `${props.scalar()}`,
      }}
    >
      {props.schema}
    </div>
  );
}

type RenderMarkdownProps = RenderProps;

function RenderMarkdown(props: RenderMarkdownProps) {
  const { deleteItem } = useIPC();

  onMount(async () => {
    const result = micromark(props.schema ?? '', {
      // extensions: [gfm()],
      // htmlExtensions: [gfmHtml()],
    });
    props.ref.innerHTML = String(result);
  });

  async function handleKeyUp(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
      try {
        const id = await deleteItem(props.id!);
        props.setItems((prev) => prev.filter((item) => item.id != id));
      } catch {
        /**/
      }
      return;
    }
  }

  return (
    <div
      onKeyUp={handleKeyUp}
      id="markdown-content"
      class="absolute min-h-[30px] min-w-[30px] bg-white p-1 outline outline-1"
      tabIndex="0"
      style={{
        'transform-origin': 'top left',
        'pointer-events': 'all',
        translate: `
          ${props.translation().x}px
          ${-props.translation().y}px
        `,
        scale: `${props.scalar()}`,
      }}
      ref={props.ref}
    />
  );
}

type RenderImage = RenderProps;

function renderImage(props: RenderImage) {
  const { deleteItem } = useIPC();

  async function handleKeyUp(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
      try {
        const id = await deleteItem(props.id!);
        props.setItems((prev) => prev.filter((item) => item.id != id));
      } catch {
        /**/
      }
      return;
    }
  }

  onMount(() => {
    if (props.file) {
      const uint8Array = new Uint8Array(props.file);
      const blob = new Blob([uint8Array], { type: props.mime });
      (props.ref as HTMLImageElement).src = URL.createObjectURL(blob);
    }
  });

  return (
    <img
      onKeyUp={handleKeyUp}
      class="absolute min-h-[30px] min-w-[30px] whitespace-pre bg-white p-1 outline outline-1"
      tabIndex="0"
      style={{
        'transform-origin': 'top left',
        'pointer-events': 'all',
        translate: `
          ${props.translation().x}px
          ${-props.translation().y}px
        `,
        scale: `${props.scalar()}`,
      }}
      ref={props.ref as HTMLImageElement}
    />
  );
}
