import { type Descendant } from 'slate';
import {
  type Accessor,
  createMemo,
  type Setter,
  mergeProps,
  ErrorBoundary,
  onMount,
  onCleanup,
  Match,
  Switch,
} from 'solid-js';
import { type Item } from 'types';

import { TextEditor } from './Editors.jsx';
import { useIPC } from './IPCProvider.js';
import { ITEM_TO_SELECTION, useSelection } from './SelectionProvider.js';
import { useViewport } from './ViewportProvider.js';
import { absoluteToRelative, Vec2D } from '../lib/vector.js';

export interface ContainerProps {
  readonly index: number;
  readonly item: Item;
  readonly setItems: Setter<Item[]>;
}

export interface RenderProps extends ContainerProps {
  readonly initialValue: Descendant[];
  readonly selected: Accessor<boolean>;
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

  const { holdingCtrl, holdingShift, selections, setSelecting } =
    useSelection();
  const { deleteItem } = useIPC();

  let ref!: HTMLDivElement;

  onMount(() => {
    ITEM_TO_SELECTION[props.item.id!] = ref;
    onCleanup(() => {
      delete ITEM_TO_SELECTION[props.item.id!];
    });
  });

  const selected = () => Boolean(ref && selections.get(ref));
  function handleClick() {
    selections.set(ref, true);
  }
  function handlePointerMove(event: PointerEvent) {
    if (event.buttons === 1 && !holdingShift() && selections.get(ref)) {
      event.stopPropagation();
      setSelecting(true);
    }
  }

  function handleFocusOut(event: FocusEvent) {
    if (
      (event.currentTarget as Node).contains(event.relatedTarget as Node) ||
      holdingCtrl() ||
      holdingShift()
    ) {
      return;
    }
    selections.set(ref, false);
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
      data-spaced-item={props.item.id}
      style={{
        'pointer-events': 'all',
        'transform-origin': 'top left',
        translate: `
          ${translation().x}px
          ${-translation().y}px
        `,
        scale: String(scalar()),
        width: `${props.item.w}px`,
      }}
      tabIndex={0}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onKeyUp={handleKeyUp}
      onFocusOut={handleFocusOut}
      ref={ref}
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

export function Render(
  props: RenderProps & {
    initialValue: Descendant[];
  },
) {
  return (
    <Switch fallback={'unkown editor'}>
      <Match
        when={props.item.editor === 'rich' || props.item.editor === 'markdown'}
      >
        <TextEditor {...props} />
      </Match>
    </Switch>
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
