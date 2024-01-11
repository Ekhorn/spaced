import {
  type JSXElement,
  useContext,
  createContext,
  createSignal,
} from 'solid-js';

import { useSelection } from './SelectionProvider.js';
import { useState } from './StateProvider.js';
import {
  Vec2D,
  scaleViewportOutFrom,
  scaleViewportUpTo,
} from '../lib/vector.js';

const [factor, setFactor] = createSignal(1.2);
const [scalar, setScalar] = createSignal(1);
const [absoluteViewportPosition, setAbsoluteViewportPosition] = createSignal(
  new Vec2D(0, 0),
);

function handleZoomIn(relativeMousePosition: Vec2D) {
  setAbsoluteViewportPosition((prev) =>
    scaleViewportUpTo(relativeMousePosition, prev, scalar(), factor()),
  );
  setScalar((prev) => prev * factor());
}

function handleZoomOut(relativeMousePosition: Vec2D) {
  setAbsoluteViewportPosition((prev) =>
    scaleViewportOutFrom(relativeMousePosition, prev, scalar(), factor()),
  );
  setScalar((prev) => prev / factor());
}

const ViewportContext = createContext({
  factor,
  setFactor,
  scalar,
  setScalar,
  handleZoomIn,
  handleZoomOut,
  absoluteViewportPosition,
  setAbsoluteViewportPosition,
});

type ViewportProps = {
  readonly children: JSXElement;
};

const { items, setItems } = useState();
const { getSelected } = useSelection();

let pointerDelta = new Vec2D(0, 0);
let lastRelativePointerPosition = new Vec2D(0, 0);

function handlePointerMove(event: PointerEvent) {
  pointerDelta = new Vec2D(event.clientX, -event.clientY)
    .sub(lastRelativePointerPosition)
    .div(scalar());
  if (event.shiftKey && event.buttons === 1) {
    const selected = getSelected();
    const moved_items = items().map((item) =>
      selected.has(item.id!)
        ? {
            ...item,
            x: item.x + pointerDelta.x,
            y: item.y + pointerDelta.y,
          }
        : item,
    );
    // for (const _item of moved_items!
    //   .map((item) => ({
    //     ...item,
    //     x: Math.floor(item.x),
    //     y: Math.floor(item.y),
    //   }))
    //   .filter((item) => selected.has(item.id!))) {
    //   // debounce(async () => {
    //   //   await invoke('update', item);
    //   // }, 100)();
    // }
    setItems(moved_items);
  } else if (event.buttons === 1) {
    setAbsoluteViewportPosition((prev) => prev.add(pointerDelta.neg()));
  }
  lastRelativePointerPosition = new Vec2D(event.clientX, -event.clientY);
}

function handleWheel(event: WheelEvent) {
  const isZoomIn = event.deltaY < 0;
  const isZoomOut = event.deltaY > 0;
  const relativeMousePosition = new Vec2D(event.clientX, -event.clientY);

  if (isZoomIn && scalar() < 160) {
    handleZoomIn(relativeMousePosition);
  } else if (isZoomOut && scalar() > 0.01) {
    handleZoomOut(relativeMousePosition);
  }
}

export function ViewportProvider(props: ViewportProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <ViewportContext.Provider>
      <div
        id="viewport"
        class="h-full w-full overflow-hidden"
        onPointerMove={handlePointerMove}
        onWheel={handleWheel}
      >
        {props.children}
      </div>
    </ViewportContext.Provider>
  );
}

export function useViewport() {
  return useContext(ViewportContext);
}
