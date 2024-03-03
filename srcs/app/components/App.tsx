import { invoke } from '@tauri-apps/api';
import { For, createEffect, on, onMount } from 'solid-js';

import { Actions } from './Actions/index.js';
import { AuthProvider } from './AuthProvider.js';
import { Background } from './Background.js';
import { Container } from './Container.js';
import { IPCProvider, useIPC } from './IPCProvider.js';
import { useState } from './StateProvider.js';
import { ViewportProvider, useViewport } from './ViewportProvider.js';
import { isTauri } from '../lib/const.js';
import { type Item } from '../lib/types.js';
import { getBoundingBox, throttle } from '../lib/utils.js';
import { type Vec2D } from '../lib/vector.js';

export function App() {
  const { absoluteViewportPosition } = useViewport();
  const { items, setItems } = useState();
  const { connectTauri, socket } = useIPC();

  onMount(() => {
    socket.on('item:updates', (item: Item) => {
      setItems((value) =>
        value.map((i) => {
          if (item.id === i.id) {
            item.schema = i.schema;
          }
          return item;
        }),
      );
    });
  });

  if (isTauri) {
    onMount(async () => {
      try {
        const path = localStorage.getItem('path');
        if (path) {
          await connectTauri(path);
          localStorage.setItem('path', path);
          const items = await invoke('get_nearby_items');
          setItems(items);
        } else {
          localStorage.removeItem('path');
        }
      } catch {
        localStorage.removeItem('path');
      }
    });
  }

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
    <AuthProvider>
      <ViewportProvider>
        <IPCProvider>
          {/* TODO: resolve FOUC */}
          <Background />
          <main class="absolute h-full w-full">
            <Actions />
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
        </IPCProvider>
      </ViewportProvider>
    </AuthProvider>
  );
}
