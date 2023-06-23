import { createSignal, For } from 'solid-js';

import { Background } from './Background.js';
import { Container } from './Container.js';
import {
  globalToView,
  scaleViewAwayFrom,
  scaleViewUpTo,
} from '../lib/utils.js';
import Vec2D from '../lib/vector.js';

let lastMousePosition = new Vec2D(0, 0);

const [zoom, setZoom] = createSignal({ level: 1, factor: 1.2 });
const [gpos, setGpos] = createSignal(new Vec2D(0, 0));
const vpos = () => globalToView(new Vec2D(0, 0), gpos(), zoom().level);

function handlePointerMove(event: PointerEvent) {
  if (event.buttons === 1) {
    setGpos((prev) =>
      prev.add(
        new Vec2D(-event.clientX, event.clientY)
          .sub(lastMousePosition)
          .div(zoom().level),
      ),
    );
  }
  lastMousePosition = new Vec2D(-event.clientX, event.clientY);
}

function handleWheel(event: WheelEvent) {
  if (event.deltaY < 0 && zoom().level < 160) {
    setGpos((prev) =>
      scaleViewUpTo(new Vec2D(event.clientX, -event.clientY), prev, zoom()),
    );
    setZoom(({ factor, level }) => ({
      level: level * factor,
      factor,
    }));
  } else if (event.deltaY > 0 && zoom().level > 0.01) {
    setGpos((prev) =>
      scaleViewAwayFrom(new Vec2D(event.clientX, -event.clientY), prev, zoom()),
    );
    setZoom(({ factor, level }) => ({
      level: level / factor,
      factor,
    }));
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
              x={item.x * zoom().level + vpos().x}
              y={item.y * zoom().level - vpos().y}
              scale={zoom().level}
            />
          )}
        </For>
      </main>
    </div>
  );
}
