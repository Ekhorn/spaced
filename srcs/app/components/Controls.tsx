import { invoke } from '@tauri-apps/api';
import { type Descendant } from 'slate';
import { FaBrandsMarkdown, FaSolidFileCirclePlus } from 'solid-icons/fa';
import { HiOutlineCircleStack, HiSolidArrowRight } from 'solid-icons/hi';
import { Show, createSignal, onMount } from 'solid-js';

import { useAuth } from './AuthProvider.js';
import { useIPC } from './IPCProvider.js';
import { useState } from './StateProvider.js';
import { useViewport } from './ViewportProvider.js';
import { isTauri } from '../lib/const.js';
import { type Storage, type Editors } from '../lib/types.js';
import { Vec2D, relativeToAbsolute } from '../lib/vector.js';

export function StorageSelector() {
  const { connect, getNearbyItems } = useIPC();
  const { setItems } = useState();
  const [connected, setConnected] = createSignal();

  let ref!: HTMLSelectElement;

  async function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    let newPath;
    if (target.value === 'local') {
      newPath = await invoke('save');
    }
    const con = await connect(target.value as Storage, newPath);
    setConnected(con);
    const items = await getNearbyItems();
    setItems(items);
  }

  onMount(async () => {
    const storage = localStorage.getItem('storage');
    if (storage) {
      ref.value = storage;
      setConnected(true);
      return;
    } else {
      let newPath;
      if (ref.value === 'local') {
        newPath = await invoke('save');
      }
      connect(isTauri ? 'local' : 'browser', newPath).then(setConnected);
    }
  });

  return (
    <div class="control-btn">
      <Show when={!connected()}>
        <span class="before:absolute before:-left-[0.125rem] before:-top-[0.125rem] before:h-[0.375rem] before:w-[0.375rem] before:rounded-full before:bg-yellow-600 before:shadow before:shadow-[#2D2D2D]"></span>
      </Show>
      <HiOutlineCircleStack class="absolute" />
      <select
        ref={ref}
        class="z-50 appearance-none overflow-visible bg-transparent text-transparent outline-none"
        onChange={handleChange}
        title="Connect to storage"
      >
        <option value="browser">Browser</option>
        <option disabled={!isTauri} value="local">
          Local
        </option>
        <option disabled value="cloud">
          Cloud
        </option>
      </select>
    </div>
  );
}

interface CreateBtnProps {
  createBaseItem: (editor: Editors) => Promise<void>;
}

export function RichTextButton(props: CreateBtnProps) {
  const handleClick = async () => await props.createBaseItem('rich');

  return (
    <button onClick={handleClick} class="control-btn" title="Create Item">
      <FaSolidFileCirclePlus />
    </button>
  );
}

export function MarkdownButton(props: CreateBtnProps) {
  const handleClick = async () => await props.createBaseItem('markdown');

  return (
    <button onClick={handleClick} class="control-btn" title="Create Markdown">
      <FaBrandsMarkdown />
    </button>
  );
}

export function LogOutButton() {
  const { isLoggedIn, logout } = useAuth();
  return (
    <Show when={isLoggedIn()}>
      <button onClick={logout} class="control-btn" title="Log Out">
        <HiSolidArrowRight />
      </button>
    </Show>
  );
}

export function Controls() {
  const width = 424;

  const { absoluteViewportPosition, scalar } = useViewport();
  const { setItems } = useState();
  const { createItem } = useIPC();

  const createBaseItem = async (editor: Editors) => {
    const { x, y } = relativeToAbsolute(
      new Vec2D((window.innerWidth - width) / 2, -(window.innerHeight / 2)),
      absoluteViewportPosition(),
      scalar(),
    );

    try {
      const item = await createItem(
        {
          x: Math.floor(x),
          y: Math.floor(y),
          w: width,
          h: 0,
          editor,
          schema: JSON.stringify([
            {
              type: 'paragraph',
              children: [{ text: '' }],
            },
          ] as Descendant[]),
        },
        [],
      );

      // eslint-disable-next-line unicorn/prefer-spread
      setItems((value) => value.concat(item));
    } catch {
      /**/
    }
  };

  const createBtnProps = { createBaseItem };

  return (
    <div class="absolute right-1 top-1 flex flex-col gap-1 overflow-visible">
      <Show when={!isTauri}>
        <LogOutButton />
      </Show>
      <StorageSelector />
      <RichTextButton {...createBtnProps} />
      <MarkdownButton {...createBtnProps} />
    </div>
  );
}