import { invoke } from '@tauri-apps/api';
import { Show } from 'solid-js';

import { CreateButton } from './CreateButton.js';
import { LogOutButton } from './LogOutButton.jsx';
import { StorageButton } from './StorageButton.js';
import { isTauri } from '../../lib/const.js';

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
      <button onClick={() => invoke('detect')}></button>
    </div>
  );
}
