import { type Element, type Text } from 'slate';
import {
  createEffect,
  createMemo,
  createSignal,
  type JSXElement,
} from 'solid-js';

import {
  type RenderLeafProps,
  type RenderPlaceholderProps,
} from './editable.js';
import String from './string.js';
import { useSlateStatic } from '../hooks/use-slate-static.js';
import { IS_WEBKIT, IS_ANDROID } from '../utils/environment.js';
import {
  PLACEHOLDER_SYMBOL,
  EDITOR_TO_PLACEHOLDER_ELEMENT,
} from '../utils/weakmaps.js';

// Delay the placeholder on Android to prevent the keyboard from closing.
// (https://github.com/ianstormtaylor/slate/pull/5368)
const PLACEHOLDER_DELAY = IS_ANDROID ? 300 : 0;

function disconnectPlaceholderResizeObserver(
  placeholderResizeObserver: ResizeObserver | null,
  releaseObserver: boolean,
) {
  if (placeholderResizeObserver) {
    placeholderResizeObserver.disconnect();
    if (releaseObserver) {
      placeholderResizeObserver = null;
    }
  }
}

type TimerId = ReturnType<typeof setTimeout> | null;

function clearTimeoutRef(timeoutRef: TimerId) {
  if (timeoutRef) {
    clearTimeout(timeoutRef);
    timeoutRef = null;
  }
}

/**
 * Individual leaves in a text node with unique formatting.
 */
export const Leaf = (props: {
  isLast: boolean;
  leaf: Text;
  parent: Element;
  renderPlaceholder: (props: RenderPlaceholderProps) => JSXElement;
  renderLeaf?: (props: RenderLeafProps) => JSXElement;
  text: Text;
}) => {
  const editor = useSlateStatic();
  const [showPlaceholder, setShowPlaceholder] = createSignal(false);
  let placeholderResizeObserver: ResizeObserver | null = null;
  let showPlaceholderTimeoutRef: TimerId | null = null;

  const callbackPlaceholderRef = createMemo(
    (placeholderEl: HTMLElement | null) => {
      disconnectPlaceholderResizeObserver(
        placeholderResizeObserver,
        placeholderEl == undefined,
      );

      if (placeholderEl == undefined) {
        EDITOR_TO_PLACEHOLDER_ELEMENT.delete(editor);
        props.leaf.onPlaceholderResize?.(null);
      } else {
        EDITOR_TO_PLACEHOLDER_ELEMENT.set(editor, placeholderEl);

        if (!placeholderResizeObserver) {
          // Create a new observer and observe the placeholder element.
          const ResizeObserver = window.ResizeObserver;
          placeholderResizeObserver = new ResizeObserver(() => {
            props.leaf.onPlaceholderResize?.(placeholderEl);
          });
        }
        placeholderResizeObserver.observe(placeholderEl);
      }
    },
  );

  let children = (
    <String
      isLast={props.isLast}
      leaf={props.leaf}
      parent={props.parent}
      text={props.text}
    />
  );

  createEffect(() => {
    const leafIsPlaceholder = Boolean(props.leaf[PLACEHOLDER_SYMBOL]);
    if (leafIsPlaceholder) {
      if (!showPlaceholderTimeoutRef) {
        // Delay the placeholder, so it will not render in a selection
        showPlaceholderTimeoutRef = setTimeout(() => {
          setShowPlaceholder(true);
          showPlaceholderTimeoutRef = null;
        }, PLACEHOLDER_DELAY);
      }
    } else {
      clearTimeoutRef(showPlaceholderTimeoutRef);
      setShowPlaceholder(false);
    }
    return () => clearTimeoutRef(showPlaceholderTimeoutRef);
  });

  createEffect(() => {
    const leafIsPlaceholder = Boolean(props.leaf[PLACEHOLDER_SYMBOL]);
    if (leafIsPlaceholder && showPlaceholder()) {
      const placeholderProps: RenderPlaceholderProps = {
        children: props.leaf.placeholder,
        attributes: {
          'data-slate-placeholder': true,
          style: {
            position: 'absolute',
            top: 0,
            'pointer-events': 'none',
            width: '100%',
            'max-width': '100%',
            display: 'block',
            opacity: '0.333',
            'user-select': 'none',
            'text-decoration': 'none',
            // Fixes https://github.com/udecode/plate/issues/2315
            '-webkit-user-modify': IS_WEBKIT ? 'inherit' : undefined,
          },
          contentEditable: false,
          ref: callbackPlaceholderRef,
        },
      };

      children = (
        <>
          {props.renderPlaceholder(placeholderProps)}
          {children}
        </>
      );
    }
  });

  // COMPAT: Having the `data-` attributes on these leaf elements ensures that
  // in certain misbehaving browsers they aren't weirdly cloned/destroyed by
  // contenteditable behaviors. (2019/05/08)
  const attributes: {
    'data-slate-leaf': true;
  } = {
    'data-slate-leaf': true,
  };

  return (
    <>
      {(props?.renderLeaf ?? DefaultLeaf)({
        attributes,
        children,
        leaf: props.leaf,
        text: props.text,
      })}
    </>
  );
};

export const DefaultLeaf = (props: RenderLeafProps) => {
  return <span {...props.attributes}>{props.children}</span>;
};
