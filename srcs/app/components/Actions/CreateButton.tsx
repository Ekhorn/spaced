import { invoke } from '@tauri-apps/api';
import { HiOutlinePlus } from 'solid-icons/hi';

import { isTauri } from '../../lib/const.js';
import { type Item } from '../../lib/types.js';
import { Vec2D, relativeToAbsolute } from '../../lib/vector.js';
import { useIPC } from '../IPCProvider.js';
import { useState } from '../StateProvider.js';
import { useViewport } from '../ViewportProvider.js';

export function CreateButton() {
  const { absoluteViewportPosition, scalar } = useViewport();
  const { setItems } = useState();
  const { socket } = useIPC();

  function handleClick() {
    const absolute = relativeToAbsolute(
      new Vec2D(window.innerWidth / 2 - 24, -(window.innerHeight / 2 - 24)),
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
        schema: 'test',
      } as Item).then((response: Item) => {
        // eslint-disable-next-line unicorn/prefer-spread
        setItems((value) => value.concat(response));
      });
      return;
    }

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
      class="z-50 flex h-8 w-8 place-content-center place-items-center rounded border-[1px] border-[#505050] bg-[#2D2D2D] text-gray-400 transition-colors hover:border-[#777777] hover:bg-[#333333]"
      title="Create Item"
    >
      <HiOutlinePlus />
    </button>
  );
}
