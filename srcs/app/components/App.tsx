import { For, createEffect, on } from 'solid-js';

import { Background } from './Background.js';
import { ConfigProvider } from './ConfigProvider.js';
import { Container } from './Container.js';
import { CreateButton } from './CreateButton.js';
import { StateProvider, useState } from './StateProvider.js';
import { useViewport, ViewportProvider } from './ViewportProvider.js';
import { useWebSocket, WebSocketProvider } from './WebSocketProvider.js';
import { type Item } from '../lib/types.js';
import { getBoundingBox, throttle } from '../lib/utils.js';
import { type Vec2D } from '../lib/vector.js';

export function App() {
  const { absoluteViewportPosition } = useViewport();
  const { items, setItems } = useState();
  const { socket } = useWebSocket();

  createEffect(
    on(
      absoluteViewportPosition,
      throttle(async (pos) => {
        const bb = getBoundingBox(pos as Vec2D);
        const response = (await socket.emitWithAck('item:get_nearby', bb)) as
          | Item
          | Item[];
        if (response) {
          setItems((items) => {
            // eslint-disable-next-line unicorn/prefer-array-flat
            const newItems = []
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              // eslint-disable-next-line unicorn/prefer-spread
              .concat(response)
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              .filter((item2) => !items.some((item1) => item1.id === item2.id));
            // eslint-disable-next-line unicorn/prefer-spread
            return items.concat(newItems);
          });
        }
      }, 200),
    ),
  );

  return (
    <ConfigProvider>
      <ViewportProvider>
        <StateProvider>
          <WebSocketProvider>
            {/* TODO: resolve FOUC */}
            <Background />
            <main class="absolute h-full w-full">
              <CreateButton />
              <For each={items()}>
                {(item, index) => (
                  <Container
                    index={index()}
                    id={item.id!}
                    {...item}
                    setItems={setItems}
                  />
                )}
              </For>
            </main>
          </WebSocketProvider>
        </StateProvider>
      </ViewportProvider>
    </ConfigProvider>
  );
}
