import {
  type Descendant,
  Editor,
  Node,
  type Operation,
  Scrubber,
  type Selection,
} from 'slate';
import {
  createEffect,
  createSignal,
  type JSXElement,
  on,
  onCleanup,
  onMount,
} from 'solid-js';

import { SlateSelectorContext, useSelectorContext } from './selector.tsx';
import { FocusedContext } from '../hooks/use-focused.ts';
import { EditorContext } from '../hooks/use-slate-static.tsx';
import { SlateContext, type SlateContextValue } from '../hooks/use-slate.tsx';
import { SolidEditor } from '../plugin/solid-editor.ts';
import { EDITOR_TO_ON_CHANGE } from '../utils/weakmaps.ts';

export function Slate(props: {
  editor: SolidEditor;
  readonly children: JSXElement;
  initialValue: Descendant[];
  onChange?: (value: Descendant[]) => void;
  onSelectionChange?: (selection: Selection) => void;
  onValueChange?: (value: Descendant[]) => void;
}) {
  Object.assign(props.editor, { children: props.initialValue });

  const [context, setContext] = createSignal<SlateContextValue>(
    (() => {
      if (!Node.isNodeList(props.initialValue)) {
        throw new Error(
          `[Slate] initialValue is invalid! Expected a list of elements but got: ${
            Scrubber.stringify(
              props.initialValue,
            )
          }`,
        );
      }

      if (!Editor.isEditor(props.editor)) {
        throw new Error(
          `[Slate] editor is invalid! You passed: ${
            Scrubber.stringify(props.editor)
          }`,
        );
      }

      // TODO: allow custom stuff later on...
      // Object.assign(EditorContext.defaultValue.editor, rest);

      return { v: 0, editor: props.editor };
    })(),
  );

  const { onChange: handleSelectorChange, selectorContext } =
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
