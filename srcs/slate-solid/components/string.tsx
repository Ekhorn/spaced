/* eslint-disable unicorn/no-null */
import { type Text, type Element, Editor, Path, Node } from 'slate';
import { createEffect, createMemo, createSignal } from 'solid-js';

import { useSlateStatic } from '../hooks/use-slate-static.js';
import { SolidEditor } from '../plugin/solid-editor.js';
import { IS_ANDROID, IS_IOS } from '../utils/environment.js';
import { MARK_PLACEHOLDER_SYMBOL } from '../utils/weakmaps.js';

/**
 * Leaf content strings.
 */

const String = (props: {
  isLast: boolean;
  leaf: Text;
  parent: Element;
  text: Text;
}) => {
  const editor = useSlateStatic();

  return (
    <>
      {() => {
        const path = SolidEditor.findPath(editor, props.text);
        const parentPath = Path.parent(path);
        const isMarkPlaceholder = Boolean(props.leaf[MARK_PLACEHOLDER_SYMBOL]);

        // COMPAT: Render text inside void nodes with a zero-width space.
        // So the node can contain selection but the text is not visible.
        if (editor.isVoid(props.parent)) {
          return <ZeroWidthString length={Node.string(props.parent).length} />;
        }

        // COMPAT: If this is the last text node in an empty block, render a zero-
        // width space that will convert into a line break when copying and pasting
        // to support expected plain text.
        if (
          props.leaf.text === '' &&
          props.parent.children.at(-1) === props.text &&
          !editor.isInline(props.parent) &&
          Editor.string(editor, parentPath) === ''
        ) {
          return (
            <ZeroWidthString
              isLineBreak
              isMarkPlaceholder={isMarkPlaceholder}
            />
          );
        }

        // COMPAT: If the text is empty, it's because it's on the edge of an inline
        // node, so we render a zero-width space so that the selection can be
        // inserted next to it still.
        if (props.leaf.text === '') {
          return <ZeroWidthString isMarkPlaceholder={isMarkPlaceholder} />;
        }

        // COMPAT: Browsers will collapse trailing new lines at the end of blocks,
        // so we need to add an extra trailing new lines to prevent that.
        if (props.isLast && props.leaf.text.slice(-1) === '\n') {
          return <TextString isTrailing text={props.leaf.text} />;
        }

        return <TextString text={props.leaf.text} />;
      }}
    </>
  );
};

/**
 * Leaf strings with text in them.
 */
const TextString = (props: { text: string; isTrailing?: boolean }) => {
  let ref: HTMLSpanElement;
  const getTextContent = () => {
    return `${props.text ?? ''}${props.isTrailing ? '\n' : ''}`;
  };
  const [initialText] = createSignal(getTextContent);

  // This is the actual text rendering boundary where we interface with the DOM
  // The text is not rendered as part of the virtual DOM, as since we handle basic character insertions natively,
  // updating the DOM is not a one way dataflow anymore. What we need here is not reconciliation and diffing
  // with previous version of the virtual DOM, but rather diffing with the actual DOM element, and replace the DOM <span> content
  // exactly if and only if its current content does not match our current virtual DOM.
  // Otherwise the DOM TextNode would always be replaced by React as the user types, which interferes with native text features,
  // eg makes native spellcheck opt out from checking the text node.

  // useLayoutEffect: updating our span before browser paint
  createEffect(() => {
    // null coalescing text to make sure we're not outputing "null" as a string in the extreme case it is nullish at runtime
    const textWithTrailing = getTextContent();

    if (ref && ref.textContent !== textWithTrailing) {
      ref.textContent = textWithTrailing;
    }

    // intentionally not specifying dependencies, so that this effect runs on every render
    // as this effectively replaces "specifying the text in the virtual DOM under the <span> below" on each render
  });

  // We intentionally render a memoized <span> that only receives the initial text content when the component is mounted.
  // We defer to the layout effect above to update the `textContent` of the span element when needed.
  return (
    <span data-slate-string ref={ref!}>
      {initialText()()}
    </span>
  );
};

/**
 * Leaf strings without text, render as zero-width strings.
 */

export const ZeroWidthString = (props: {
  length?: number;
  isLineBreak?: boolean;
  isMarkPlaceholder?: boolean;
}) => {
  const attributes = createMemo(() => {
    const attributes: Record<string, unknown> = {
      'data-slate-zero-width': props.isLineBreak ? 'n' : 'z',
      'data-slate-length': props?.length ?? 0,
    };
    if (props.isMarkPlaceholder) {
      attributes['data-slate-mark-placeholder'] = true;
    }
    return attributes;
  });

  return (
    <span {...attributes()}>
      {!(IS_ANDROID || IS_IOS) || !props.isLineBreak ? '\uFEFF' : null}
      {props.isLineBreak ? <br /> : null}
    </span>
  );
};

export default String;
