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
  onCleanup,
  createEffect,
  Show,
  createSignal,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { useIPC } from './IPCProvider.jsx';
import { useSelection } from './SelectionProvider.js';
import { useViewport } from './ViewportProvider.js';
import { type MimeTypes, type Item } from '../lib/types.js';
import { absoluteToRelative, Vec2D } from '../lib/vector.js';
import { worker } from '../main.js';
import {
  OcrEngine,
  OcrEngineInit,
  default as initOcrLib,
} from '../wasm/ocrs.js';
import wasmUrl from '../wasm/ocrs_bg.wasm?url';
import detectionUrl from '../wasm/text-detection.rten?url';
import recognitionUrl from '../wasm/text-recognition.rten?url';

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
    if (event.key === 'Delete') {
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

  const renderProps = mergeProps(
    {
      ref,
      scalar,
      selected,
      translation,
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
  return `Unkown media type:\n${props.item.mime}`;
}

function Render(props: RenderProps) {
  return (
    <Dynamic
      component={renderMap?.[props.item.mime as MimeTypes] ?? RenderUnkown}
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

    await updateItem({
      ...props.item,
      schema: ref.textContent!,
    });
  }

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
    >
      {props.item.schema}
    </div>
  );
}

type RenderMarkdownProps = RenderProps;

function RenderMarkdown(props: RenderMarkdownProps) {
  let ref!: HTMLDivElement;

  onMount(async () => {
    const result = micromark(props.item.schema ?? '', {
      // extensions: [gfm()],
      // htmlExtensions: [gfmHtml()],
    });
    ref.innerHTML = String(result);
  });

  return <div id="markdown-content" ref={ref} />;
}

type RenderImage = RenderProps;

function renderImage(props: RenderImage) {
  let ref!: HTMLImageElement;

  const [menu, setMenu] = createSignal(true);
  const [selected, setSelected] = createSignal<'tesserect' | 'ocrs'>(
    'tesserect',
  );

  async function onChange(event: Event) {
    // @ts-expect-error ignore
    setSelected(event.target!.value);
  }

  async function handleClick() {
    if (!props.item.file) {
      return;
    }
    console.log(`recognizing with ${selected()}`);
    let result;
    switch (selected()) {
      case 'ocrs': {
        await initOcrLib(fetch(wasmUrl));

        const ocrInit = new OcrEngineInit();
        const detection = await fetch(detectionUrl);
        const recognition = await fetch(recognitionUrl);

        ocrInit.setDetectionModel(
          new Uint8Array(await detection.arrayBuffer()),
        );
        ocrInit.setRecognitionModel(
          new Uint8Array(await recognition.arrayBuffer()),
        );

        const ocrEngine = new OcrEngine(ocrInit);
        const uint8Array = new Uint8Array(props.item.file);
        const blob = new Blob([uint8Array], { type: props.item.mime });
        const objectURL = URL.createObjectURL(blob);

        await createImageBitmap(blob).then((imageBitmap) => {
          const offscreenCanvas = new OffscreenCanvas(
            imageBitmap.width,
            imageBitmap.height,
          );
          const ctx = offscreenCanvas.getContext('2d');
          ctx!.drawImage(imageBitmap, 0, 0);

          const imageData = ctx!.getImageData(
            0,
            0,
            imageBitmap.width,
            imageBitmap.height,
          );
          const ocrInput = ocrEngine.loadImage(
            imageData.width,
            imageData.height,
            new Uint8Array(imageData.data),
          );
          result = ocrEngine.getText(ocrInput);

          URL.revokeObjectURL(objectURL);
        });

        break;
      }
      case 'tesserect': {
        const response = await worker.recognize(props.item.file);
        result = response.data.text;
        break;
      }
      default:
    }
    console.log(result);
    // window.navigator.clipboard.writeText(response);
  }

  createEffect(() => {
    setMenu(props.selected());
  });

  onMount(() => {
    if (props.item.file) {
      const uint8Array = new Uint8Array(props.item.file);
      const blob = new Blob([uint8Array], { type: props.item.mime });
      ref.src = URL.createObjectURL(blob);
    }
  });

  return (
    <>
      <Show when={menu()}>
        <div class="z-50 flex gap-1">
          <button
            onClick={handleClick}
            class="flex h-8 w-8 place-content-center place-items-center rounded border-[1px] border-[#505050] bg-[#2D2D2D] text-gray-400 transition-colors hover:border-[#777777] hover:bg-[#333333]"
          >
            <HiSolidDocumentMagnifyingGlass />
          </button>
          <select
            onChange={onChange}
            value={selected()}
            class="flex h-8 w-24 place-content-center place-items-center rounded border-[1px] border-[#505050] bg-[#2D2D2D] px-1 text-gray-400 transition-colors hover:border-[#777777] hover:bg-[#333333]"
          >
            <option value="tesserect">Tesserect.js</option>
            <option value="ocrs">Ocrs</option>
          </select>
        </div>
      </Show>
      <img ref={ref} />
    </>
  );
}

type RenderPdf = RenderProps;

function renderPdf(props: RenderPdf) {
  let ref!: HTMLObjectElement;

  onMount(() => {
    if (props.item.file) {
      const uint8Array = new Uint8Array(props.item.file);
      const blob = new Blob([uint8Array], { type: props.item.mime });
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
