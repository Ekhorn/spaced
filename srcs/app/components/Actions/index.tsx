import { invoke } from '@tauri-apps/api';
import { Show } from 'solid-js';

import { CreateButton } from './CreateButton.js';
import { LogOutButton } from './LogOutButton.jsx';
import { StorageButton } from './StorageButton.js';
import { isTauri } from '../../lib/const.js';

async function d(e: InputEvent): Promise<void> {
  // eslint-disable-next-line unicorn/prefer-spread
  const file = e?.target?.files?.[0] as Blob;

  console.log(file);
  invoke('detect', {
    imageData: [...new Uint8Array(await file.arrayBuffer())],
  });
}

export function Actions() {
  return (
    <div class="absolute right-1 top-1 flex flex-col gap-1 overflow-visible">
      <Show when={!isTauri}>
        <LogOutButton />
      </Show>
      <Show when={isTauri}>
        <StorageButton />
      </Show>
      <CreateButton />
      <input type="file" onInput={d}>
        Detect
      </input>
    </div>
  );
}
