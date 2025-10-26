import { Index, onMount } from 'solid-js';

import { AuthProvider } from './AuthProvider.tsx';
import { Background } from './Background.tsx';
import { Container } from './Container.tsx';
import { Controls } from './Controls.tsx';
import { IPCProvider, useIPC } from './IPCProvider.tsx';
import { useState } from './StateProvider.tsx';
import { useViewport, ViewportProvider } from './ViewportProvider.tsx';
import { allowedMimeTypes } from '../lib/const.ts';
import { type ImageElement } from '../lib/editor-types.d.ts';
import { type MimeTypes } from '../lib/types.ts';
// import { getBoundingBox, throttle } from '../lib/utils.ts';
import { relativeToAbsolute, Vec2D } from '../lib/vector.ts';

export function App() {
  const { absoluteViewportPosition, lastRelativePointerPosition, scalar } =
    useViewport();
  const { items, setItems } = useState();
  const { connect, createItem, getNearbyItems } = useIPC();

  async function handleDrop(e: DragEvent): Promise<void> {
    const file = e.dataTransfer?.files[0];
    if (!file) {
      return;
    }

    const absolute = relativeToAbsolute(
      new Vec2D(e.clientX, -e.clientY),
      absoluteViewportPosition(),
      scalar(),
    );
    try {
      const item = await createItem(
        {
          x: Math.floor(absolute.x),
          y: Math.floor(absolute.y),
          w: 0,
          h: 0,
          editor: 'rich',
          schema: JSON.stringify({
            type: 'image',
            name: file.name,
            mime: file.type,
            uuid: file.type.startsWith('text') ? await file.text() : '0',
          } as ImageElement),
        },
        [[...new Uint8Array(await file.arrayBuffer())]],
      );

      setItems((value) => value.concat(item));
    } catch {
      /**/
    }
  }

  window.addEventListener('paste', async (event: ClipboardEvent) => {
    event.preventDefault();

    const absolute = relativeToAbsolute(
      lastRelativePointerPosition(),
      absoluteViewportPosition(),
      scalar(),
    );

    if (!event.clipboardData || event.clipboardData.items.length === 0) {
      return;
    }
    const data: DataTransferItem = [...event.clipboardData.items].at(-1)!;

    if (data.kind === 'string') {
      data.getAsString(async (text) => {
        try {
          const item = await createItem(
            {
              x: Math.floor(absolute.x),
              y: Math.floor(absolute.y),
              w: 0,
              h: 0,
              editor: 'rich',
              schema: JSON.stringify({
                type: 'div',
                name: 'Untitled',
                content: text,
                mime: 'text/plain',
              }),
            },
            [],
          );

          setItems((value) => value.concat(item));
        } catch {
          /**/
        }
      });
      return;
    }

    const file = data?.getAsFile();
    if (!file || !allowedMimeTypes.has(file.type as MimeTypes)) {
      return;
    }

    try {
      const item = await createItem(
        {
          x: Math.floor(absolute.x),
          y: Math.floor(absolute.y),
          w: 0,
          h: 0,
          editor: 'rich',
          schema: JSON.stringify({
            type: 'image',
            name: file.name,
            mime: file.type,
            uuid: file.type.startsWith('text') ? await file.text() : '0',
          } as ImageElement),
        },
        [[...new Uint8Array(await file.arrayBuffer())]],
      );

      setItems((value) => value.concat(item));
    } catch {
      /**/
    }
  });

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

      const items = await getNearbyItems();
      setItems(items);
    } catch {
      /**/
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
  //           const newItems = []
  //             // @ts-ignore
  //             .concat(response)
  //             // @ts-ignore
  //             .filter((item2) => !items.some((item1) => item1.id === item2.id));
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
          <main class='absolute h-full w-full' onDrop={handleDrop}>
            <Controls />
            <Index each={items()}>
              {(item, index) => (
                <Container index={index} item={item()} setItems={setItems} />
              )}
            </Index>
          </main>
        </IPCProvider>
      </ViewportProvider>
    </AuthProvider>
  );
}
