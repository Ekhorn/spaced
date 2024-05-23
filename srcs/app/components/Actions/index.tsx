import { Show } from 'solid-js';

import { CreateButton } from './CreateButton.js';
import { LogOutButton } from './LogOutButton.jsx';
import { StorageSelector } from './StorageSelector.jsx';
import { isTauri } from '../../lib/const.js';

export function Actions() {
  return (
    <div class="absolute right-1 top-1 flex flex-col gap-1 overflow-visible">
      <Show when={!isTauri}>
        <LogOutButton />
      </Show>
      <StorageSelector />
      <CreateButton />
    </div>
  );
}
