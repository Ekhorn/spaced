import { type CursorState } from '@slate-yjs/core';
import { createSignal, onCleanup, createMemo } from 'solid-js';

import { useRemoteCursorStateStore } from './useRemoteCursorStateStore.js';

// export function useRemoteCursorStatesSelector<
//   TCursorData extends Record<string, unknown> = Record<string, unknown>,
//   TSelection = unknown,
// >(
//   selector: (cursors: Record<string, CursorState<TCursorData>>) => TSelection,
//   isEqual?: (a: TSelection, b: TSelection) => boolean,
// ): TSelection {
//   const [subscribe, getSnapshot] = useRemoteCursorStateStore<TCursorData>();
//   return useSyncExternalStoreWithSelector(
//     subscribe,
//     getSnapshot,
//     null,
//     selector,
//     isEqual,
//   );
// }

// useRemoteCursorStatesSelector.ts

// export function useRemoteCursorStates<
//   TCursorData extends Record<string, unknown> = Record<string, unknown>,
// >() {
//   const [subscribe, getSnapshot] = useRemoteCursorStateStore<TCursorData>();
//   return useSyncExternalStore(subscribe, getSnapshot);
// }

export function useRemoteCursorStates<
  TCursorData extends Record<string, unknown> = Record<string, unknown>,
>() {
  const [subscribe, getSnapshot] = useRemoteCursorStateStore<TCursorData>();

  // Set up a reactive signal based on the external store's current state.
  const [state, setState] = createSignal(getSnapshot());

  // Subscribe to the store and update the signal on changes
  const unsubscribe = subscribe(() => setState(getSnapshot()));

  // Ensure we unsubscribe when the component using this hook is unmounted
  onCleanup(unsubscribe);

  return state;
}

export function useRemoteCursorStatesSelector<
  TCursorData extends Record<string, unknown> = Record<string, unknown>,
  TSelection = unknown,
>(
  selector: (cursors: Record<string, CursorState<TCursorData>>) => TSelection,
  isEqual?: (a: TSelection, b: TSelection) => boolean,
): () => TSelection {
  const [subscribe, getSnapshot] = useRemoteCursorStateStore<TCursorData>();

  // Track the snapshot state
  const [snapshot, setSnapshot] = createSignal(getSnapshot());

  // Subscribe to updates and refresh the signal
  const unsubscribe = subscribe(() => setSnapshot(getSnapshot()));
  onCleanup(unsubscribe);

  // Create a memoized selector that only updates if the selected state actually changes
  const selectedState = createMemo(() => {
    const newSelection = selector(snapshot());
    const prevSelection = selectedState.peek?.();

    if (
      isEqual
        ? !isEqual(newSelection, prevSelection)
        : prevSelection !== newSelection
    ) {
      return newSelection;
    }

    return prevSelection;
  });

  return selectedState;
}
