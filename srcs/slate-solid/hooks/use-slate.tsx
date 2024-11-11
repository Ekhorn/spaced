import { type Editor } from 'slate';
import { type Accessor, createContext, useContext } from 'solid-js';

import { type SolidEditor } from '../plugin/solid-editor.js';

/**
 * A Solid context for sharing the editor object, in a way that re-renders the
 * context whenever changes occur.
 */
export interface SlateContextValue {
  v: number;
  editor: SolidEditor;
}

export const SlateContext = createContext<Accessor<{
  v: number;
  editor: SolidEditor;
}> | null>();

/**
 * Get the current editor object from the React context.
 */
export const useSlate = (): Editor => {
  const context = useContext(SlateContext);

  if (!context) {
    throw new Error(
      `The \`useSlate\` hook must be used inside the <Slate> component's context.`,
    );
  }

  const { editor } = context();
  return editor;
};

export const useSlateWithV = () => {
  const context = useContext(SlateContext);

  if (!context) {
    throw new Error(
      `The \`useSlate\` hook must be used inside the <Slate> component's context.`,
    );
  }

  return context;
};
