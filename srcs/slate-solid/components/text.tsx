import { type Element, type Range, Text as SlateText } from 'slate';
import { createRenderEffect, type JSXElement } from 'solid-js';

import {
  type RenderLeafProps,
  type RenderPlaceholderProps,
} from './editable.tsx';
import { Leaf } from './leaf.tsx';
import { useSlateStatic } from '../hooks/use-slate-static.tsx';
import { SolidEditor } from '../plugin/solid-editor.ts';
import {
  EDITOR_TO_KEY_TO_ELEMENT,
  ELEMENT_TO_NODE,
  NODE_TO_ELEMENT,
} from '../utils/weakmaps.ts';

export const Text = (props: {
  decorations: Range[];
  isLast: boolean;
  parent: Element;
  renderPlaceholder: (props: RenderPlaceholderProps) => JSXElement;
  renderLeaf?: (props: RenderLeafProps) => JSXElement;
  text: SlateText;
}) => {
  const editor = useSlateStatic();

  let ref: HTMLSpanElement | null;
  const children: JSXElement[] = [];

  createRenderEffect(() => {
    const leaves = SlateText.decorations(props.text, props.decorations);

    for (let i = 0; i < leaves.length; i++) {
      const leaf = leaves[i];

      children.push(
        <Leaf
          isLast={props.isLast && i === leaves.length - 1}
          renderPlaceholder={props.renderPlaceholder}
          leaf={leaf}
          text={props.text}
          parent={props.parent}
          renderLeaf={props.renderLeaf}
        />,
      );
    }
  });

  // Update element-related weak maps with the DOM element ref.
  const callbackRef = (span: HTMLSpanElement | null) => {
    const key = SolidEditor.findKey(editor, props.text);

    const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor);
    if (span) {
      KEY_TO_ELEMENT?.set(key, span);
      NODE_TO_ELEMENT.set(props.text, span);
      ELEMENT_TO_NODE.set(span, props.text);
    } else {
      KEY_TO_ELEMENT?.delete(key);
      NODE_TO_ELEMENT.delete(props.text);
      if (ref) {
        ELEMENT_TO_NODE.delete(ref);
      }
    }
    ref = span;
  };

  return (
    // eslint-disable-next-line solid/reactivity
    <span data-slate-node='text' ref={callbackRef}>
      {children}
    </span>
  );
};
