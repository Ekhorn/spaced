import { invoke } from '@tauri-apps/api';
import { micromark } from 'micromark';
import { HiSolidDocumentMagnifyingGlass } from 'solid-icons/hi';
import {
  type Accessor,
  type ValidComponent,
  createMemo,
  onMount,
  type Setter,
  ErrorBoundary,
  mergeProps,
  Show,
  createSignal,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { useIPC } from './IPCProvider.jsx';
import { useSelection } from './SelectionProvider.js';
import { useViewport } from './ViewportProvider.js';
import { isTauri } from '../lib/const.js';
import { type MimeTypes, type Item } from '../lib/types.js';
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

export function Container(props: ContainerProps) {
  const { absoluteViewportPosition, scalar } = useViewport();
  const translation = createMemo(() =>
    absoluteToRelative(
      new Vec2D(props.item.x, props.item.y),
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
  readonly item: Item;
  readonly ref: HTMLDivElement;
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
  'application/pdf': renderPdf,
};

function Render(props: RenderProps) {
  return <Dynamic component={renderMap[props.item.mime]} {...props} />;
}

type RenderTextProps = RenderProps;

function RenderText(props: RenderTextProps) {
  const { getSelected, holdingCtrl, holdingShift, register, unregister } =
    useSelection();
  const { deleteItem, updateItem } = useIPC();
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

  async function handleKeyUp(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
      try {
        const id = await deleteItem(props.item.id!);
        props.setItems((prev) => prev.filter((item) => item.id != id));
      } catch {
        /**/
      }
      return;
    } else {
      await updateItem({
        ...props.item,
        schema: props.ref.textContent!,
      });
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
        'outline-color': selected()
          ? 'black'
          : props.item.schema && 'transparent',
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
      {props.item.schema}
    </div>
  );
}

type RenderMarkdownProps = RenderProps;

function RenderMarkdown(props: RenderMarkdownProps) {
  const { deleteItem } = useIPC();

  onMount(async () => {
    const result = micromark(props.item.schema ?? '', {
      // extensions: [gfm()],
      // htmlExtensions: [gfmHtml()],
    });
    props.ref.innerHTML = String(result);
  });

  async function handleKeyUp(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
      try {
        const id = await deleteItem(props.item.id!);
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
        const id = await deleteItem(props.item.id!);
        props.setItems((prev) => prev.filter((item) => item.id != id));
      } catch {
        /**/
      }
      return;
    }
  }

  const [menu, setMenu] = createSignal(true);

  async function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    setMenu(true);
  }

  async function handleClick() {
    if (isTauri && props.item.file) {
      const response = await invoke('detect', {
        imageData: [...new Uint8Array(props.item.file)],
      });
      window.navigator.clipboard.writeText(response);
    }
  }

  function handleBlur() {
    setMenu(false);
  }

  onMount(() => {
    if (props.item.file) {
      const uint8Array = new Uint8Array(props.item.file);
      const blob = new Blob([uint8Array], { type: props.item.mime });
      (props.ref as HTMLImageElement).src = URL.createObjectURL(blob);
    }
  });

  return (
    <>
      <img
        onBlur={handleBlur}
        onContextMenu={handleContextMenu}
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
      <Show when={menu()}>
        <button
          disabled={!isTauri}
          onClick={handleClick}
          class="absolute z-50 flex h-8 w-8 place-content-center place-items-center rounded border-[1px] border-[#505050] bg-[#2D2D2D] text-gray-400 transition-colors hover:border-[#777777] hover:bg-[#333333]"
          style={{
            'transform-origin': 'top left',
            'pointer-events': 'all',
            translate: `
            ${props.translation().x}px
            ${-props.translation().y - 50 * props.scalar()}px
        `,
            scale: `${props.scalar()}`,
          }}
        >
          <HiSolidDocumentMagnifyingGlass />
        </button>
      </Show>
    </>
  );
}

type RenderPdf = RenderProps;

function renderPdf(props: RenderPdf) {
  const { deleteItem } = useIPC();

  async function handleKeyUp(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
      try {
        const id = await deleteItem(props.item.id!);
        props.setItems((prev) => prev.filter((item) => item.id != id));
      } catch {
        /**/
      }
      return;
    }
  }

  onMount(() => {
    if (props.item.file) {
      const uint8Array = new Uint8Array(props.item.file);
      const blob = new Blob([uint8Array], { type: props.item.mime });
      (props.ref as HTMLObjectElement).data = URL.createObjectURL(blob);
    }
  });
  return (
    <object
      onKeyUp={handleKeyUp}
      class="absolute h-96 min-h-[30px] w-96 min-w-[30px] whitespace-pre bg-white p-1 outline outline-1"
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
      ref={props.ref as HTMLObjectElement}
    ></object>
  );
}
