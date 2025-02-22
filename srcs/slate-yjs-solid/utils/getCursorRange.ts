/* eslint-disable unicorn/no-null */
import {
  type CursorEditor,
  type CursorState,
  relativeRangeToSlateRange,
} from '@slate-yjs/core';
import { type BaseRange, type Descendant, type Range } from 'slate';

const CHILDREN_TO_CURSOR_STATE_TO_RANGE: WeakMap<
  Descendant[],
  WeakMap<CursorState, Range | null>
> = new WeakMap();

export function getCursorRange<
  TCursorData extends Record<string, unknown> = Record<string, unknown>,
>(
  editor: CursorEditor<TCursorData>,
  cursorState: CursorState<TCursorData>,
): BaseRange | null {
  if (!cursorState.relativeSelection) {
    return null;
  }

  let cursorStates = CHILDREN_TO_CURSOR_STATE_TO_RANGE.get(editor.children);
  if (!cursorStates) {
    cursorStates = new WeakMap();
    CHILDREN_TO_CURSOR_STATE_TO_RANGE.set(editor.children, cursorStates);
  }

  let range = cursorStates.get(cursorState);
  if (range === undefined) {
    try {
      range = relativeRangeToSlateRange(
        editor.sharedRoot,
        editor,
        cursorState.relativeSelection,
      ) as BaseRange | null;

      cursorStates.set(cursorState, range);
    } catch {
      return null;
    }
  }

  return range;
}
