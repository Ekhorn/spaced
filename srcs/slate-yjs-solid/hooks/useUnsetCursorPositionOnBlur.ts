/* eslint-disable unicorn/no-null */
import { CursorEditor } from '@slate-yjs/core';
import { useFocused } from 'slate-solid';
import { onCleanup, onMount } from 'solid-js';

import { useRemoteCursorEditor } from './useRemoteCursorEditor.js';

export function useUnsetCursorPositionOnBlur() {
  const editor = useRemoteCursorEditor();
  const isSlateFocused = useFocused();

  console.log(isSlateFocused);

  const sendCursorPosition = (isFocused?: boolean) => {
    if (isFocused && editor.selection) {
      CursorEditor.sendCursorPosition(editor, editor.selection);
      return;
    }

    if (!isFocused) {
      CursorEditor.sendCursorPosition(editor, null);
    }
  };

  const handleWindowBlur = () => {
    if (isSlateFocused) {
      sendCursorPosition(false);
    }
  };

  const handleWindowFocus = () => {
    if (isSlateFocused) {
      sendCursorPosition(true);
    }
  };

  onMount(() => {
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    onCleanup(() => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    });
  });

  onMount(() => {
    sendCursorPosition(isSlateFocused);
  });
}
