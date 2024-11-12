import {
  type Operation,
  type Selection,
  type Descendant,
  Editor,
  Node,
  Scrubber,
} from 'slate';
import {
  createEffect,
  type JSXElement,
  createSignal,
  onCleanup,
  onMount,
  on,
} from 'solid-js';

import { SlateSelectorContext, useSelectorContext } from './selector.js';
import { FocusedContext } from '../hooks/use-focused.js';
import { EditorContext } from '../hooks/use-slate-static.js';
import { type SlateContextValue, SlateContext } from '../hooks/use-slate.js';
import { SolidEditor } from '../plugin/solid-editor.js';
import { EDITOR_TO_ON_CHANGE } from '../utils/weakmaps.js';

export function Slate(props: {
  editor: SolidEditor;
  readonly children: JSXElement;
  initialValue: Descendant[];
  onChange?: (value: Descendant[]) => void;
  onSelectionChange?: (selection: Selection) => void;
  onValueChange?: (value: Descendant[]) => void;
}) {
  // eslint-disable-next-line solid/reactivity
  Object.assign(props.editor, { children: props.initialValue });

  const [context, setContext] = createSignal<SlateContextValue>(
    (() => {
      if (!Node.isNodeList(props.initialValue)) {
        throw new Error(
          `[Slate] initialValue is invalid! Expected a list of elements but got: ${Scrubber.stringify(
            props.initialValue,
          )}`,
        );
      }
      // eslint-disable-next-line solid/reactivity
      if (!Editor.isEditor(props.editor)) {
        throw new Error(
          // eslint-disable-next-line solid/reactivity
          `[Slate] editor is invalid! You passed: ${Scrubber.stringify(props.editor)}`,
        );
      }

      // TODO: allow custom stuff later on...
      // Object.assign(EditorContext.defaultValue.editor, rest);
      // eslint-disable-next-line solid/reactivity
      return { v: 0, editor: props.editor };
    })(),
  );

  const { onChange: handleSelectorChange, selectorContext } =
    // eslint-disable-next-line solid/reactivity
    useSelectorContext(props.editor);

  const onContextChange = (options?: { operation?: Operation }) => {
    if (props.onChange) {
      props.onChange(props.editor.children);
    }

    switch (options?.operation?.type) {
      case 'set_selection': {
        props.onSelectionChange?.(props.editor.selection);
        break;
      }
      default: {
        props.onValueChange?.(props.editor.children);
      }
    }

    setContext((prevContext) => ({
      v: prevContext.v + 1,
      editor: props.editor,
    }));
    handleSelectorChange(props.editor);
  };

  onMount(() => {
    EDITOR_TO_ON_CHANGE.set(props.editor, onContextChange);

    onCleanup(() => {
      EDITOR_TO_ON_CHANGE.set(props.editor, () => {});
    });
  });

  const [hasFocus, setIsFocused] = createSignal<boolean>(false);
  createEffect(
    on(
      () => props.editor,
      (editor) => setIsFocused(SolidEditor.isFocused(editor)),
    ),
  );

  const fn = () => setIsFocused(SolidEditor.isFocused(props.editor));

  onMount(() => {
    document.addEventListener('focusin', fn);
    document.addEventListener('focusout', fn);

    onCleanup(() => {
      document.removeEventListener('focusin', fn);
      document.removeEventListener('focusout', fn);
    });
  });

  return (
    <>
      {() => {
        return (
          <SlateSelectorContext.Provider value={selectorContext()}>
            <SlateContext.Provider value={context}>
              <EditorContext.Provider value={context().editor}>
                <FocusedContext.Provider value={hasFocus()}>
                  {props.children}
                </FocusedContext.Provider>
              </EditorContext.Provider>
            </SlateContext.Provider>
          </SlateSelectorContext.Provider>
        );
      }}
    </>
  );
}
