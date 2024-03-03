import { HiSolidArrowRight } from 'solid-icons/hi';
import { Show } from 'solid-js';

import { useAuth } from '../AuthProvider.js';

export function LogOutButton() {
  const { isLoggedIn, logout } = useAuth();
  return (
    <Show when={isLoggedIn()}>
      <button
        onClick={logout}
        class="z-50 flex h-8 w-8 place-content-center place-items-center overflow-visible rounded border-[1px] border-[#505050] bg-[#2D2D2D] text-gray-400 transition-colors hover:border-[#777777] hover:bg-[#333333]"
        title="Log Out"
      >
        <HiSolidArrowRight />
      </button>
    </Show>
  );
}
