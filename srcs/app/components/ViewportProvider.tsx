import {
  type JSXElement,
  useContext,
  createContext,
  createSignal,
  onMount,
  onCleanup,
} from 'solid-js';

import { useIPC } from './IPCProvider.jsx';
import { ITEM_TO_SELECTION, useSelection } from './SelectionProvider.js';
import { useState } from './StateProvider.js';
import {
  Vec2D,
  scaleViewportOutFrom,
  scaleViewportUpTo,
} from '../lib/vector.js';

const [wheelFactor, setWheelFactor] = createSignal(1.2);
const [pinchFactor, setPinchFactor] = createSignal(1.05);
const [scalar, setScalar] = createSignal(1);
const [absoluteViewportPosition, setAbsoluteViewportPosition] = createSignal(
  new Vec2D(0, 0),
);

function handleZoomIn(relativeMousePosition: Vec2D, factor: number) {
  setAbsoluteViewportPosition((prev) =>
    scaleViewportUpTo(relativeMousePosition, prev, scalar(), factor),
  );
  setScalar((prev) => prev * factor);
}

function handleZoomOut(relativeMousePosition: Vec2D, factor: number) {
  setAbsoluteViewportPosition((prev) =>
    scaleViewportOutFrom(relativeMousePosition, prev, scalar(), factor),
  );
  setScalar((prev) => prev / factor);
}

type ViewportProps = {
  readonly children: JSXElement;
};

const { items, setItems } = useState();
const { updateItem } = useIPC();
const { selecting, selections, setSelecting } = useSelection();

let pointerDelta = new Vec2D(0, 0);
let lastDistance: number;
let pointers: PointerEvent[] = [];
const [lastRelativePointerPosition, setLastRelativePointerPosition] =
  createSignal(new Vec2D(0, 0));

function getDistance(pointer1: PointerEvent, pointer2: PointerEvent) {
  const dx = pointer1.clientX - pointer2.clientX;
  const dy = pointer1.clientY - pointer2.clientY;
  return Math.hypot(dx, dy);
}

function getLocation(pointer1: PointerEvent, pointer2: PointerEvent): Vec2D {
  const midX = (pointer1.clientX + pointer2.clientX) / 2;
  const midY = -(pointer1.clientY + pointer2.clientY) / 2;
  return new Vec2D(midX, midY);
}

function handlePointerDown(event: PointerEvent) {
  if (event.pointerType === 'touch') {
    pointers.push(event);
    setLastRelativePointerPosition(new Vec2D(event.clientX, -event.clientY));
    if (pointers.length === 2) {
      lastDistance = getDistance(pointers[0], pointers[1]);
    }
  }
}

async function handlePointerMove(event: PointerEvent) {
  if (event.pointerType === 'touch' && pointers.length === 2) {
    for (let i = 0; i < pointers.length; i++) {
      if (pointers[i].pointerId === event.pointerId) {
        pointers[i] = event;
        break;
      }
    }

    const distance = getDistance(pointers[0], pointers[1]);
    const relativePointerPosition = getLocation(pointers[0], pointers[1]);
    const isZoomIn = distance > lastDistance;
    const isZoomOut = distance < lastDistance;

    if (isZoomIn && scalar() < 160) {
      handleZoomIn(relativePointerPosition, pinchFactor());
    } else if (isZoomOut && scalar() > 0.01) {
      handleZoomOut(relativePointerPosition, pinchFactor());
    }
    lastDistance = distance;
    return;
  }

  pointerDelta = new Vec2D(event.clientX, -event.clientY)
    .sub(lastRelativePointerPosition())
    .div(scalar());
  if (event.shiftKey && event.buttons === 1) {
    const allItems = [],
      movedItems = [];
    for (let item of items()) {
      if (selections.get(ITEM_TO_SELECTION[item.id!])) {
        item = {
          ...item,
          x: Math.floor(item.x + pointerDelta.x),
          y: Math.floor(item.y + pointerDelta.y),
        };
        movedItems.push(item);
      }
      allItems.push(item);
    }

    // Not awaiting to avoid blocking the UI
    updateItem(movedItems);
    setItems(allItems);
  } else if (event.buttons === 1 && !selecting()) {
    setAbsoluteViewportPosition((prev) => prev.add(pointerDelta.neg()));
  }
  setLastRelativePointerPosition(new Vec2D(event.clientX, -event.clientY));

  if (event.buttons === 0) {
    setSelecting(false);
  }
}

function handlePointerRemove(event: PointerEvent) {
  pointers = pointers.filter((p) => p.pointerId !== event.pointerId);
  const [pointer] = pointers;
  if (pointer) {
    setLastRelativePointerPosition(
      new Vec2D(pointer.clientX, -pointer.clientY),
    );
  }
}

function handleWheel(event: WheelEvent) {
  const isZoomIn = event.deltaY < 0;
  const isZoomOut = event.deltaY > 0;
  const relativeMousePosition = new Vec2D(event.clientX, -event.clientY);

  if (isZoomIn && scalar() < 160) {
    handleZoomIn(relativeMousePosition, wheelFactor());
  } else if (isZoomOut && scalar() > 0.01) {
    handleZoomOut(relativeMousePosition, wheelFactor());
  }
}

const ViewportContext = createContext({
  wheelFactor,
  setWheelFactor,
  pinchFactor,
  setPinchFactor,
  scalar,
  setScalar,
  handleZoomIn,
  handleZoomOut,
  absoluteViewportPosition,
  setAbsoluteViewportPosition,
  lastRelativePointerPosition,
});

let ref!: HTMLDivElement;

export function ViewportProvider(props: ViewportProps) {
  onMount(() => {
    // Wheel event since chromium 125 only fires, when handler is attached after render cycle
    ref.addEventListener('wheel', handleWheel);
    onCleanup(() => {
      ref.removeEventListener('wheel', handleWheel);
    });
  });

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <ViewportContext.Provider>
      <div
        id="viewport"
        class="h-full w-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerRemove}
        onPointerUp={handlePointerRemove}
        ref={ref}
      >
        {props.children}
      </div>
    </ViewportContext.Provider>
  );
}

export function useViewport() {
  return useContext(ViewportContext);
}
