import { createSignal, For } from 'solid-js';

import { Background } from './Background.js';
import { Container } from './Container.js';
import {
  absoluteToRelative,
  scaleViewportOutFrom,
  scaleViewportUpTo,
  Vec2D,
} from '../lib/vector.js';

let pointerDelta = new Vec2D(0, 0);
let lastRelativePointerPosition = new Vec2D(0, 0);

const [factor] = createSignal(1.2);
const [scalar, setScalar] = createSignal(1);
const [absoluteViewportPosition, setAbsoluteViewportPosition] = createSignal(
  new Vec2D(0, 0),
);

function handlePointerMove(event: PointerEvent) {
  pointerDelta = new Vec2D(event.clientX, -event.clientY)
    .sub(lastRelativePointerPosition)
    .div(scalar());
  if (event.buttons === 1) {
    setAbsoluteViewportPosition((prev) => prev.add(pointerDelta.neg()));
  }
  lastRelativePointerPosition = new Vec2D(event.clientX, -event.clientY);
}

function handleWheel(event: WheelEvent) {
  if (event.deltaY < 0 && scalar() < 160) {
    setAbsoluteViewportPosition((prev) =>
      scaleViewportUpTo(
        new Vec2D(event.clientX, -event.clientY),
        prev,
        scalar(),
        factor(),
      ),
    );
    setScalar((prev) => prev * factor());
  } else if (event.deltaY > 0 && scalar() > 0.01) {
    setAbsoluteViewportPosition((prev) =>
      scaleViewportOutFrom(
        new Vec2D(event.clientX, -event.clientY),
        prev,
        scalar(),
        factor(),
      ),
    );
    setScalar((prev) => prev / factor());
  }
}

export function App() {
  return (
    <div
      class="h-full w-full overflow-hidden"
      onPointerMove={handlePointerMove}
      onWheel={handleWheel}
    >
      {/* TODO: resolve FOUC */}
      <Background />
      <main class="absolute h-full w-full">
        <For
          each={[
            { text: 'foo', x: 0, y: 0 },
            { text: 'bar', x: 50, y: 0 },
            { text: 'baz', x: -70, y: 25 },
          ]}
        >
          {(item) => (
            <Container
              text={item.text}
              translation={absoluteToRelative(
                new Vec2D(item.x, item.y),
                absoluteViewportPosition(),
                scalar(),
              )}
              scale={scalar()}
            />
          )}
        </For>
      </main>
    </div>
  );
}
