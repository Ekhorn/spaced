import { HiOutlinePlus } from 'solid-icons/hi';

import { Vec2D, relativeToAbsolute } from '../../lib/vector.js';
import { useIPC } from '../IPCProvider.js';
import { useState } from '../StateProvider.js';
import { useViewport } from '../ViewportProvider.js';

export function CreateButton() {
  const { absoluteViewportPosition, scalar } = useViewport();
  const { setItems } = useState();
  const { createItem } = useIPC();

  async function handleClick() {
    const absolute = relativeToAbsolute(
      new Vec2D(window.innerWidth / 2 - 24, -(window.innerHeight / 2 - 24)),
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
          schema: JSON.stringify({
            type: 'div',
            name: 'Untitled',
            content: 'test',
            mime: 'text/plain',
          }),
        },
        [],
      );

      // eslint-disable-next-line unicorn/prefer-spread
      setItems((value) => value.concat(item));
    } catch {
      /**/
    }
  }

  return (
    <button
      onClick={handleClick}
      class="z-50 flex h-8 w-8 place-content-center place-items-center rounded border-[1px] border-[#505050] bg-[#2D2D2D] text-gray-400 transition-colors hover:border-[#777777] hover:bg-[#333333]"
      title="Create Item"
    >
      <HiOutlinePlus />
    </button>
  );
}
