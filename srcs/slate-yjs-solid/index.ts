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
} from './hooks/useDecorateRemoteCursors.js';

export {
  useRemoteCursorStates,
  useRemoteCursorStatesSelector,
} from './hooks/useRemoteCursorStates.js';

export { useUnsetCursorPositionOnBlur } from './hooks/useUnsetCursorPositionOnBlur.js';

export { getCursorRange } from './utils/getCursorRange.js';

export {
  type CursorOverlayData,
  useRemoteCursorOverlayPositions,
  type UseRemoteCursorOverlayPositionsOptions,
} from './hooks/useRemoteCursorOverlayPositions.js';
