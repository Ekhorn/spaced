import { invoke } from '@tauri-apps/api';
import { HiOutlineCircleStack } from 'solid-icons/hi';
import { Show, createSignal, onMount } from 'solid-js';

import { isTauri } from '../../lib/const.js';
import { type Storage } from '../../lib/types.js';
import { useIPC } from '../IPCProvider.jsx';
import { useState } from '../StateProvider.jsx';

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
    <div class="z-50 flex h-8 w-8 place-content-center place-items-center rounded border-[1px] border-[#505050] bg-[#2D2D2D] text-gray-400 transition-colors hover:border-[#777777] hover:bg-[#333333]">
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
