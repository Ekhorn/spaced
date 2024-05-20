import { invoke } from '@tauri-apps/api';
import { micromark } from 'micromark';
// import rehypeSanitize from 'rehype-sanitize';
// import rehypeStringify from 'rehype-stringify';
// import remarkParse from 'remark-parse';
// import remarkRehype from 'remark-rehype';
import { For, createEffect, on, onMount } from 'solid-js';
// import { unified } from 'unified';

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
import { relativeToAbsolute, Vec2D } from '../lib/vector.js';

export function App() {
  const { absoluteViewportPosition, scalar } = useViewport();
  const { items, setItems } = useState();
  const { connectTauri, socket } = useIPC();

  async function handleDrop(e: DragEvent): Promise<void> {
    const file = e.dataTransfer?.files[0];
    if (file?.type == 'text/markdown') {
      const result = micromark(await file.text(), {
        // extensions: [gfm()],
        // htmlExtensions: [gfmHtml()],
      });
      const absolute = relativeToAbsolute(
        new Vec2D(e.clientX, -e.clientY),
        absoluteViewportPosition(),
        scalar(),
      );
      if (isTauri) {
        invoke('create_item', {
          x: Math.floor(absolute.x),
          y: Math.floor(absolute.y),
          w: 0,
          h: 0,
          name: 'test',
          mime: file.type,
          schema: result,
        } as Item).then((response: Item) => {
          // eslint-disable-next-line unicorn/prefer-spread
          setItems((value) => value.concat(response));
        });
        return;
      }
      // setItems((prev) => [
      //   ...prev,
      //   {
      //     x: e.clientX,
      //     y: e.clientY,
      //     w: 100,
      //     h: 100,
      //     mime: file.type,
      //     schema: result,
      //   } as Item,
      // ]);
      // .on('error', handleError)
      // .pipe(stream())
      // .pipe(process.stdout)
      // const output = await unified()
      //   .use(remarkParse)
      //   .use(remarkRehype)
      //   .use(rehypeSanitize)
      //   .use(rehypeStringify)
      //   .process(await file.text());
      // document.body.innerHTML = `<div id="markdown-content">$l{result}</div>`;
    }
    // console.log(file?.name);
    // const response = await invoke('detect', {
    // imageData: [...new Uint8Array((await file?.arrayBuffer()) ?? [])],
    // });
    // console.log(response);
  }

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
      } catch (error) {
        console.log(error);
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
