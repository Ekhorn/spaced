/* eslint-disable unicorn/no-null */
import { type CursorState } from '@slate-yjs/core';
import { type BaseRange, type NodeMatch, type Text } from 'slate';
import { createEffect, createMemo, createSignal, onMount } from 'solid-js';

import { useRemoteCursorEditor } from './useRemoteCursorEditor.js';
import { useRemoteCursorStates } from './useRemoteCursorStates.js';
import { useOnResize, useRequestRerender } from './utils.js';
import { getCursorRange } from '../utils/getCursorRange.js';
import {
  getOverlayPosition,
  type CaretPosition,
  type OverlayPosition,
  type SelectionRect,
} from '../utils/getOverlayPosition.js';

const FROZEN_EMPTY_ARRAY = Object.freeze([]);

export type UseRemoteCursorOverlayPositionsOptions<T extends HTMLElement> = {
  shouldGenerateOverlay?: NodeMatch<Text>;
} & (
  | {
      // Container the overlay will be rendered in. If set, all returned overlay positions
      // will be relative to this container and the cursor positions will be automatically
      // updated on container resize.
      containerRef?: undefined;
    }
  | {
      containerRef: T;

      // Whether to refresh the cursor overlay positions on container resize. Defaults
      // to true. If set to 'debounced', the remote cursor positions will be updated
      // each animation frame.
      refreshOnResize?: boolean | 'debounced';
    }
);

export type CursorOverlayData<TCursorData extends Record<string, unknown>> =
  CursorState<TCursorData> & {
    range: BaseRange | null;
    caretPosition: CaretPosition | null;
    selectionRects: SelectionRect[];
  };

export function useRemoteCursorOverlayPositions<
  TCursorData extends Record<string, unknown>,
  TContainer extends HTMLElement = HTMLDivElement,
>({
  containerRef,
  shouldGenerateOverlay,
  ...opts
}: UseRemoteCursorOverlayPositionsOptions<TContainer> = {}) {
  const editor = useRemoteCursorEditor<TCursorData>();
  const cursorStates = useRemoteCursorStates<TCursorData>();
  const requestRerender = useRequestRerender();

  let overlayPositionCache = new WeakMap<BaseRange, OverlayPosition>();
  const [overlayPositions, setOverlayPositions] = createSignal<
    Record<string, OverlayPosition>
  >({});

  const refreshOnResize =
    'refreshOnResize' in opts ? (opts.refreshOnResize ?? true) : true;

  useOnResize(refreshOnResize ? containerRef : undefined, () => {
    overlayPositionCache = new WeakMap();
    requestRerender(refreshOnResize !== 'debounced');
  });

  // Update selection rects after paint
  createEffect(() => {
    console.log('DSOIFJOIDSJFI', containerRef);

    // We have a container ref but the ref is null => container
    // isn't mounted to we can't calculate the selection rects.
    if (!containerRef) {
      return;
    }

    const containerRect = containerRef?.getBoundingClientRect();
    const xOffset = containerRect?.x ?? 0;
    const yOffset = containerRect?.y ?? 0;

    let overlayPositionsChanged =
      Object.keys(overlayPositions).length !==
      Object.keys(cursorStates()).length;

    const updated = Object.fromEntries(
      Object.entries(cursorStates()).map(([key, state]) => {
        const range = state.relativeSelection && getCursorRange(editor, state);

        if (!range) {
          return [key, FROZEN_EMPTY_ARRAY];
        }

        const cached = overlayPositionCache.get(range);
        if (cached) {
          return [key, cached];
        }

        const overlayPosition = getOverlayPosition(editor, range, {
          xOffset,
          yOffset,
          shouldGenerateOverlay,
        });
        overlayPositionsChanged = true;
        overlayPositionCache.set(range, overlayPosition);
        return [key, overlayPosition];
      }),
    );

    if (overlayPositionsChanged) {
      setOverlayPositions(updated);
    }
  });

  const overlayData = createMemo<CursorOverlayData<TCursorData>[]>(() =>
    Object.entries(cursorStates()).map(([clientId, state]) => {
      const range = state.relativeSelection && getCursorRange(editor, state);
      const overlayPosition = overlayPositions[clientId];

      return {
        ...state,
        range,
        caretPosition: overlayPosition?.caretPosition ?? null,
        selectionRects: overlayPosition?.selectionRects ?? FROZEN_EMPTY_ARRAY,
      };
    }),
  );

  const refresh = () => {
    overlayPositionCache = new WeakMap();
    requestRerender(true);
  };

  return [overlayData, refresh] as const;
}
