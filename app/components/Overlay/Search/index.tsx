import { Component, createEffect, createSignal } from 'solid-js';

export const Search: Component = () => {
  const [state, setState] = createSignal('');

  createEffect(() => console.log(state()));

  return (
    <form class="absolute left-1/2 -translate-x-1/2 z-50">
      <div class="flex relative flex-row">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20.48"
          height="20.48"
          class="absolute w-4 h-4 m-2 mt-[0.875rem]"
          viewBox="0 0 64 64"
        >
          <path
            stroke="#000"
            d="M60 53c-.38 1.07-.45 1.8-1.13 2.85-5.28 8.24-12.52-5.99-17.87-7.2-3.59-.8-4.67 2.61-16 2.34C11.8 50.67 2.33 41.2 2.01 28 1.83 20.47 3.38 13.59 9.1 8.21 20.59-2.58 41.82.58 48.67 15c2.23 4.69 2.44 7.91 2.32 13-.18 7.34-2.54 9.29-2.44 12 .16 4.28 8.1 10.61 11.45 13ZM26 8.46c-7.18.77-12.78 3.66-15.93 10.54C4.4 31.4 14.33 45.74 28 44.47c13.28-1.23 21.04-16.05 13.86-27.46-3.78-5.99-9.04-8.25-15.86-8.55Z"
          />
        </svg>
        <input
          onkeydown={(e) => setState(e.currentTarget.value)}
          class="pl-6 py-1 mt-1 rounded focus:border-blue-300 focus:shadow-blue-300 shadow border-2 outline-none"
        />
      </div>
    </form>
  );
};
