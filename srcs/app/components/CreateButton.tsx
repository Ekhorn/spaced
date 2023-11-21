import { useState } from './StateProvider.js';
import { useViewport } from './ViewportProvider.js';
import { useWebSocket } from './WebSocketProvider.js';
import type { Item } from '../lib/types.js';
import { Vec2D, relativeToAbsolute } from '../lib/vector.js';

export function CreateButton() {
  const { absoluteViewportPosition, scalar } = useViewport();
  const { setItems } = useState();
  const { socket } = useWebSocket();

  function handleClick() {
    const absolute = relativeToAbsolute(
      new Vec2D(window.innerWidth / 2 - 24, -(window.innerHeight / 2 - 24)),
      absoluteViewportPosition(),
      scalar(),
    );

    socket
      .emitWithAck('item:create', {
        id: 0,
        x: Math.floor(absolute.x),
        y: Math.floor(absolute.y),
        w: 0,
        h: 0,
        name: 'test',
        schema: 'test',
      } as Item)
      .then((response: Item) => {
        // eslint-disable-next-line unicorn/prefer-spread
        setItems((value) => value.concat(response));
      });
  }

  return (
    <button
      onClick={handleClick}
      class="absolute bottom-1 left-1 z-50 rounded border-2 border-slate-600 bg-slate-500 text-white shadow"
    >
      Create 🚀
    </button>
  );
}
