/* eslint-disable unicorn/no-null */
import { type BaseRange } from 'slate';
import { SolidEditor } from 'slate-solid';

export function solidEditorToDomRangeSafe(
  editor: SolidEditor,
  range: BaseRange,
): Range | null {
  try {
    return SolidEditor.toDOMRange(editor, range);
  } catch {
    return null;
  }
}
