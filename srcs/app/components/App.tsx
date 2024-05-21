import { For, onMount } from 'solid-js';

import { Actions } from './Actions/index.js';
import { AuthProvider } from './AuthProvider.js';
import { Background } from './Background.js';
import { Container } from './Container.js';
import { IPCProvider, useIPC } from './IPCProvider.js';
import { useState } from './StateProvider.js';
import { ViewportProvider, useViewport } from './ViewportProvider.js';
import { allowedMimeTypes } from '../lib/const.js';
import { type MimeTypes } from '../lib/types.js';
// import { getBoundingBox, throttle } from '../lib/utils.js';
import { relativeToAbsolute, Vec2D } from '../lib/vector.js';

export function App() {
  const { absoluteViewportPosition, scalar } = useViewport();
  const { items, setItems } = useState();
  const { connect, createItem, getNearByItems } = useIPC();

  async function handleDrop(e: DragEvent): Promise<void> {
    const file = e.dataTransfer?.files[0];
    if (!file) {
      return;
    }
    if (allowedMimeTypes.has(file.type as MimeTypes)) {
      const absolute = relativeToAbsolute(
        new Vec2D(e.clientX, -e.clientY),
        absoluteViewportPosition(),
        scalar(),
      );
      try {
        const item = await createItem({
          x: Math.floor(absolute.x),
          y: Math.floor(absolute.y),
          w: 0,
          h: 0,
          name: 'test',
          mime: file.type as MimeTypes,
          schema: file.type.startsWith('text') ? await file.text() : '',
          blob: file.type.startsWith('text')
            ? undefined
            : await file.arrayBuffer(),
        });
        // eslint-disable-next-line unicorn/prefer-spread
        setItems((value) => value.concat(item));
      } catch {
        /**/
      }
    }
  }

  // onMount(() => {
  //   socket.on('item:updates', (item: Item) => {
  //     setItems((value) =>
  //       value.map((i) => {
  //         if (item.id === i.id) {
  //           item.schema = i.schema;
  //         }
  //         return item;
  //       }),
  //     );
  //   });
  // });

  onMount(async () => {
    try {
      await connect();

      const items = await getNearByItems();
      setItems(items);
    } catch (error) {
      console.log(error);
    }
  });

  // createEffect(
  //   on(
  //     absoluteViewportPosition,
  //     throttle(async (pos) => {
  //       const bb = getBoundingBox(pos as Vec2D);
  //       const response = (await socket.emitWithAck('item:get_nearby', bb)) as
  //         | Item
  //         | Item[];
  //       if (response) {
  //         setItems((items) => {
  //           // eslint-disable-next-line unicorn/prefer-array-flat
  //           const newItems = []
  //             // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //             // @ts-ignore
  //             // eslint-disable-next-line unicorn/prefer-spread
  //             .concat(response)
  //             // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //             // @ts-ignore
  //             .filter((item2) => !items.some((item1) => item1.id === item2.id));
  //           // eslint-disable-next-line unicorn/prefer-spread
  //           return items.concat(newItems);
  //         });
  //       }
  //     }, 200),
  //   ),
  // );

  return (
    <AuthProvider>
      <ViewportProvider>
        <IPCProvider>
          {/* TODO: resolve FOUC */}
          <Background />
          <main
            class="absolute h-full w-full"
            // onDragOver={(e) => {
            //   e.preventDefault();
            //   console.log('drag');
            //   console.log(e.dataTransfer?.files);
            // }}
            onDrop={handleDrop}
          >
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
