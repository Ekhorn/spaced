import { CursorEditor } from '@slate-yjs/core';
import { type SolidEditor, useSlateStatic } from 'slate-solid';

export function useRemoteCursorEditor<
  TCursorData extends Record<string, unknown> = Record<string, unknown>,
>(): CursorEditor<TCursorData> & SolidEditor {
  const editor = useSlateStatic();
  if (!CursorEditor.isCursorEditor(editor)) {
    throw new Error(
      'Cannot use useSyncExternalStore outside the context of a RemoteCursorEditor',
    );
  }

  return editor as CursorEditor & SolidEditor;
}
