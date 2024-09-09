import { type Range, type Element as SlateElement, Editor, Node } from 'slate';
import { type Accessor, type JSXElement, Match, Switch } from 'solid-js';

import { createChildren } from './children.js';
import {
  type RenderElementProps,
  type RenderLeafProps,
  type RenderPlaceholderProps,
} from './editable.js';
import { Text } from './text.js';
import { useSlateStatic } from '../hooks/use-slate-static.js';
import { SolidEditor } from '../plugin/solid-editor.js';
import { getDirection } from '../utils/direction.js';
import {
  EDITOR_TO_KEY_TO_ELEMENT,
  ELEMENT_TO_NODE,
  NODE_TO_ELEMENT,
  NODE_TO_INDEX,
  NODE_TO_PARENT,
} from '../utils/weakmaps.js';

export const Element = (props: {
  decorations: Range[];
  element: SlateElement;
  renderElement?: (props: RenderElementProps) => JSXElement;
  renderPlaceholder: (props: RenderPlaceholderProps) => JSXElement;
  renderLeaf?: (props: RenderLeafProps) => JSXElement;
  selection: Range | null;
}) => {
  const defaultEl = (p: RenderElementProps) => <DefaultElement {...p} />;

  const editor = useSlateStatic();
  const readOnly = false; /*useReadOnly();*/
  const ref = (ref: HTMLElement | null) => {
    const key = SolidEditor.findKey(editor, props.element);
    // Update element-related weak maps with the DOM element ref.
    const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor);
    if (ref) {
      KEY_TO_ELEMENT?.set(key, ref);
      NODE_TO_ELEMENT.set(props.element, ref);
      ELEMENT_TO_NODE.set(ref, props.element);
    } else {
      KEY_TO_ELEMENT?.delete(key);
      NODE_TO_ELEMENT.delete(props.element);
    }
  };

  let children: JSXElement;

  return (
    <>
      {() => {
        children = createChildren({
          node: props.element,
          renderElement: props.renderElement ?? defaultEl,
          ...props,
        });

        // Attributes that the developer must mix into the element in their
        // custom node renderer component.
        const attributes: {
          'data-slate-node': 'element';
          'data-slate-void'?: true;
          'data-slate-inline'?: true;
          contentEditable?: false;
          dir?: 'rtl';
          ref: Accessor<void>;
        } = {
          'data-slate-node': 'element',
          ref: ref,
        };

        const isInline = editor.isInline(props.element);
        if (isInline) {
          attributes['data-slate-inline'] = true;
        }

        // If it's a block node with inline children, add the proper `dir` attribute
        // for text direction.
        if (!isInline && Editor.hasInlines(editor, props.element)) {
          const text = Node.string(props.element);
          const dir = getDirection(text);

          if (dir === 'rtl') {
            attributes.dir = dir;
          }
        }

        // If it's a void node, wrap the children in extra void-specific elements.
        if (Editor.isVoid(editor, props.element)) {
          attributes['data-slate-void'] = true;

          if (!readOnly && isInline) {
            attributes.contentEditable = false;
          }

          const Tag = isInline ? 'span' : 'div';
          const [[text]] = Node.texts(props.element);

          children = (
            <Tag
              data-slate-spacer
              style={{
                height: '0',
                color: 'transparent',
                outline: 'none',
                position: 'absolute',
              }}
            >
              <Text
                renderPlaceholder={props.renderPlaceholder}
                decorations={[]}
                isLast={false}
                parent={props.element}
                text={text}
              />
            </Tag>
          );

          NODE_TO_INDEX.set(text, 0);
          NODE_TO_PARENT.set(text, props.element);
        }
        return (props?.renderElement ?? defaultEl)({
          attributes,
          children,
          element: props.element,
        });
      }}
    </>
  );
};

/**
 * The default element renderer.
 */

export const DefaultElement = (props: RenderElementProps) => {
  const editor = useSlateStatic();

  return (
    <Switch>
      <Match when={editor.isInline(props.element)}>
        <span {...props.attributes} style={{ position: 'relative' }}>
          {props.children}
        </span>
      </Match>
      <Match when={true}>
        <div {...props.attributes} style={{ position: 'relative' }}>
          {props.children}
        </div>
      </Match>
    </Switch>
  );
};
