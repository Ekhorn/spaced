import { invoke } from '@tauri-apps/api';
import { HiOutlineCircleStack } from 'solid-icons/hi';
import { Show, createSignal, onMount } from 'solid-js';

import { useIPC } from '../IPCProvider.jsx';

export function StorageButton() {
  const { connectTauri } = useIPC();
  const [hasPath, setHasPath] = createSignal();

  async function handleConnection(path?: string | null) {
    setHasPath(path);
    try {
      if (path) {
        await connectTauri(path);
        localStorage.setItem('path', path);
      } else {
        localStorage.removeItem('path');
      }
    } catch {
      localStorage.removeItem('path');
    }
  }

  async function onClick() {
    const newPath = await invoke('save');
    await handleConnection(newPath);
  }

  onMount(async () => {
    if (localStorage) {
      const path = localStorage.getItem('path');
      await handleConnection(path);
    }
  });

  return (
    <button
      class="z-50 flex h-8 w-8 place-content-center place-items-center overflow-visible rounded border-[1px] border-[#505050] bg-[#2D2D2D] text-gray-400 transition-colors hover:border-[#777777] hover:bg-[#333333]"
      onClick={onClick}
      title="Connect with database"
    >
      <Show when={!hasPath()}>
        <span class="before:absolute before:-left-[0.125rem] before:-top-[0.125rem] before:h-[0.375rem] before:w-[0.375rem] before:rounded-full before:bg-yellow-600 before:shadow before:shadow-[#2D2D2D]"></span>
      </Show>
      <HiOutlineCircleStack />
    </button>
  );
}
