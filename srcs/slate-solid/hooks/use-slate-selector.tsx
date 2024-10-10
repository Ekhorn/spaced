/* eslint-disable unicorn/no-null */
import { type Editor } from 'slate';
import { createContext, createEffect, createMemo, useContext } from 'solid-js';

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

type EditorChangeHandler = (editor: Editor) => void;
/**
 * A React context for sharing the editor selector context in a way to control rerenders
 */

export const SlateSelectorContext = createContext<{
  getSlate: () => Editor;
  addEventListener: (callback: EditorChangeHandler) => () => void;
}>({} as never);

const refEquality = (a: unknown, b: unknown) => a === b;

/**
 * use redux style selectors to prevent rerendering on every keystroke.
 * Bear in mind rerendering can only prevented if the returned value is a value type or for reference types (e.g. objects and arrays) add a custom equality function.
 *
 * Example:
 * ```
 *  const isSelectionActive = useSlateSelector(editor => Boolean(editor.selection));
 * ```
 */
export function useSlateSelector<T>(
  selector: (editor: Editor) => T,
  equalityFn: (a: T, b: T) => boolean = refEquality,
) {
  // const [, forceRender] = useReducer((s) => s + 1, 0);
  const context = useContext(SlateSelectorContext);
  if (!context) {
    throw new Error(
      `The \`useSlateSelector\` hook must be used inside the <Slate> component's context.`,
    );
  }
  const { addEventListener, getSlate } = context;

  let latestSubscriptionCallbackError: Error | undefined;
  let latestSelector: (editor: Editor) => T = () => null as unknown as T;
  let latestSelectedState: T = null as unknown as T;
  let selectedState: T;

  try {
    selectedState =
      selector !== latestSelector || latestSubscriptionCallbackError
        ? selector(getSlate())
        : latestSelectedState;
  } catch (error) {
    if (latestSubscriptionCallbackError && isError(error)) {
      error.message += `\nThe error may be correlated with this previous error:\n${latestSubscriptionCallbackError.stack}\n\n`;
    }

    throw error;
  }
  createEffect(() => {
    latestSelector = selector;
    latestSelectedState = selectedState;
    latestSubscriptionCallbackError = undefined;
  });

  function checkForUpdates() {
    try {
      const newSelectedState = latestSelector(getSlate());

      if (equalityFn(newSelectedState, latestSelectedState)) {
        return;
      }

      latestSelectedState = newSelectedState;
    } catch (error) {
      // we ignore all errors here, since when the component
      // is re-rendered, the selectors are called again, and
      // will throw again, if neither props nor store state
      // changed
      latestSubscriptionCallbackError =
        error instanceof Error ? error : new Error(String(error));
    }

    // forceRender();
  }

  createEffect(
    () => {
      const unsubscribe = addEventListener(checkForUpdates);

      checkForUpdates();

      return () => unsubscribe();
    },
    // don't rerender on equalityFn change since we want to be able to define it inline
  );

  return selectedState;
}

/**
 * Create selector context with editor updating on every editor change
 */
export function useSelectorContext(editor: Editor) {
  const eventListeners: EditorChangeHandler[] = [];
  const slateRef: { editor: Editor } = { editor };
  const onChange = (editor: Editor) => {
    slateRef.editor = editor;
    for (const listener of eventListeners) listener(editor);
  };

  const selectorContext = createMemo(() => {
    return {
      getSlate: () => slateRef.editor,
      addEventListener: (callback: EditorChangeHandler) => {
        eventListeners.push(callback);
        return () => {
          eventListeners.splice(eventListeners.indexOf(callback), 1);
        };
      },
    };
  });
  return { selectorContext, onChange };
}
