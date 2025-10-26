export {
  getRemoteCaretsOnLeaf,
  getRemoteCursorsOnLeaf,
  type RemoteCaretDecoratedRange,
  type RemoteCaretDecoration,
  type RemoteCursorDecoratedRange,
  type RemoteCursorDecoration,
  type TextWithRemoteCursors,
  useDecorateRemoteCursors,
  type UseDecorateRemoteCursorsOptions,
} from './hooks/useDecorateRemoteCursors.ts';

export {
  useRemoteCursorStates,
  useRemoteCursorStatesSelector,
} from './hooks/useRemoteCursorStates.ts';

export { useUnsetCursorPositionOnBlur } from './hooks/useUnsetCursorPositionOnBlur.ts';

export { getCursorRange } from './utils/getCursorRange.ts';

export {
  type CursorOverlayData,
  useRemoteCursorOverlayPositions,
  type UseRemoteCursorOverlayPositionsOptions,
} from './hooks/useRemoteCursorOverlayPositions.tsx';
