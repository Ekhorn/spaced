/* eslint-disable unicorn/no-null */
import {
  type CursorState,
  type RemoteCursorChangeEventListener,
  CursorEditor,
} from '@slate-yjs/core';
import { type BaseEditor } from 'slate';

import { type Store } from '../types.js';
import { useRemoteCursorEditor } from './useRemoteCursorEditor.js';

export type CursorStore<
  TCursorData extends Record<string, unknown> = Record<string, unknown>,
> = Store<Record<string, CursorState<TCursorData>>>;

const EDITOR_TO_CURSOR_STORE: WeakMap<BaseEditor, CursorStore> = new WeakMap();

function createRemoteCursorStateStore<
  TCursorData extends Record<string, unknown>,
>(editor: CursorEditor<TCursorData>): CursorStore<TCursorData> {
  let cursors: Record<string, CursorState<TCursorData>> = {};

  const changed = new Set<number>();
  const addChanged = changed.add.bind(changed);
  const onStoreChangeListeners: Set<() => void> = new Set();

  let changeHandler: RemoteCursorChangeEventListener | null = null;

  const subscribe = (onStoreChange: () => void) => {
    onStoreChangeListeners.add(onStoreChange);
    if (!changeHandler) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      changeHandler = (event: any) => {
        // eslint-disable-next-line unicorn/no-array-for-each, unicorn/no-array-callback-reference
        event.added.forEach(addChanged);
        // eslint-disable-next-line unicorn/no-array-for-each, unicorn/no-array-callback-reference
        event.removed.forEach(addChanged);
        // eslint-disable-next-line unicorn/no-array-for-each, unicorn/no-array-callback-reference
        event.updated.forEach(addChanged);
        for (const listener of onStoreChangeListeners) listener();
      };
      CursorEditor.on(editor, 'change', changeHandler);
    }

    return () => {
      onStoreChangeListeners.delete(onStoreChange);
      if (changeHandler && onStoreChangeListeners.size === 0) {
        CursorEditor.off(editor, 'change', changeHandler);
        changeHandler = null;
      }
    };
  };

  const getSnapshot = () => {
    if (changed.size === 0) {
      return cursors;
    }

    for (const clientId of changed) {
      const state = CursorEditor.cursorState(editor, clientId);
      if (state === null) {
        delete cursors[clientId.toString()];
        continue;
      }

      cursors[clientId] = state;
    }

    changed.clear();
    cursors = { ...cursors };
    return cursors;
  };

  return [subscribe, getSnapshot];
}

function getCursorStateStore<TCursorData extends Record<string, unknown>>(
  editor: CursorEditor<TCursorData>,
): CursorStore<TCursorData> {
  const existing = EDITOR_TO_CURSOR_STORE.get(editor);
  if (existing) {
    return existing as CursorStore<TCursorData>;
  }

  const store = createRemoteCursorStateStore(editor);
  EDITOR_TO_CURSOR_STORE.set(editor, store);
  return store;
}

export function useRemoteCursorStateStore<
  TCursorData extends Record<string, unknown> = Record<string, unknown>,
>() {
  const editor = useRemoteCursorEditor<TCursorData>();
  return getCursorStateStore(editor);
}
