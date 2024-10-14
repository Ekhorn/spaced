import { createEffect } from 'solid-js';

import { useSlateStatic } from './use-slate-static.js';
import { SolidEditor } from '../plugin/solid-editor.js';

export function useTrackUserInput() {
  const editor = useSlateStatic();

  let receivedUserInput = false;
  let animationFrameIdRef = 0;

  const onUserInput = () => {
    if (receivedUserInput) {
      return;
    }

    receivedUserInput = true;

    const window = SolidEditor.getWindow(editor);
    window.cancelAnimationFrame(animationFrameIdRef);

    animationFrameIdRef = window.requestAnimationFrame(() => {
      receivedUserInput = false;
    });
  };

  createEffect(() => cancelAnimationFrame(animationFrameIdRef));

  return {
    receivedUserInput,
    onUserInput,
  };
}
