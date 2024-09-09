import {
  type Operation,
  type Selection,
  type Descendant,
  Editor,
  Node,
  Scrubber,
  createEditor,
} from 'slate';
import {
  createEffect,
  type JSXElement,
  createSignal,
  onCleanup,
  onMount,
  ErrorBoundary,
  on,
} from 'solid-js';

import { SlateSelectorContext, useSelectorContext } from './selector.js';
import { EditorContext } from '../hooks/use-slate-static.js';
import { type SlateContextValue, SlateContext } from '../hooks/use-slate.js';
import { SolidEditor } from '../plugin/solid-editor.js';
import { withSolid } from '../plugin/with-solid.js';
import { FocusedContext } from '../utils/focus.js';
import { EDITOR_TO_ON_CHANGE } from '../utils/weakmaps.js';

export function TheEditor(props: {
  readonly children: JSXElement;
  initialValue: Descendant[];
  onChange?: (value: Descendant[]) => void;
  onSelectionChange?: (selection: Selection) => void;
  onValueChange?: (value: Descendant[]) => void;
}) {
  const [editor] = createSignal(
    withSolid(Object.assign(createEditor(), { children: props.initialValue })),
  );

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
      if (!Editor.isEditor(editor())) {
        throw new Error(
          // eslint-disable-next-line solid/reactivity
          `[Slate] editor is invalid! You passed: ${Scrubber.stringify(editor())}`,
        );
      }

      // TODO: allow custom stuff later on...
      // Object.assign(EditorContext.defaultValue.editor, rest);
      // eslint-disable-next-line solid/reactivity
      return { v: 0, editor: editor() };
    })(),
  );

  const { onChange: handleSelectorChange, selectorContext } =
    // eslint-disable-next-line solid/reactivity
    useSelectorContext(editor());

  const onContextChange = (options?: { operation?: Operation }) => {
    if (props.onChange) {
      props.onChange(editor().children);
    }

    switch (options?.operation?.type) {
      case 'set_selection': {
        props.onSelectionChange?.(editor().selection);
        break;
      }
      default: {
        props.onValueChange?.(editor().children);
      }
    }

    setContext((prevContext) => ({
      v: prevContext.v + 1,
      editor: editor(),
    }));
    handleSelectorChange(editor());
  };

  onMount(() => {
    EDITOR_TO_ON_CHANGE.set(editor(), onContextChange);

    onCleanup(() => {
      EDITOR_TO_ON_CHANGE.set(editor(), () => {});
    });
  });

  const [hasFocus, setIsFocused] = createSignal<boolean>();
  createEffect(
    on(editor, (editor) => setIsFocused(SolidEditor.isFocused(editor))),
  );

  const fn = () => setIsFocused(SolidEditor.isFocused(editor()));

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
