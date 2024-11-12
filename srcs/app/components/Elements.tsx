import { type Element as SlateElement, Transforms } from 'slate';
import {
  type RenderElementProps,
  type RenderLeafProps,
  SolidEditor,
  useSlateStatic,
} from 'slate-solid';
import { type JSX, type JSXElement } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import {
  type CheckListElement,
  type CustomElement,
} from '../lib/editor-types.js';

type Element = (
  props: Omit<RenderElementProps, 'attributes'> &
    RenderElementProps['attributes'] & { style?: string | JSX.CSSProperties },
) => JSXElement;

/* eslint-disable solid/no-destructure, @typescript-eslint/no-unused-vars */
const block_quote: Element = ({ element, ...p }) => <blockquote {...p} />,
  bulleted_list: Element = ({ element, ...props }) => <ul {...props} />,
  heading_one: Element = ({ element, ...props }) => <h1 {...props} />,
  // heading_two: Element = ({element, ...props}) => <h2 {...props} />,
  ordered_list: Element = ({ element, ...props }) => <ol {...props} />,
  list_item: Element = ({ element, ...props }) => <li {...props} />,
  link: Element = ({ element, ...props }) => <a {...props} />,
  paragraph: Element = ({ element, ...props }) => <p {...props} />;
/* eslint-enable solid/no-destructure, @typescript-eslint/no-unused-vars */

// eslint-disable-next-line solid/no-destructure
const check_list: Element = ({ children, element, ...attributes }) => {
  const editor = useSlateStatic();
  // const readOnly = useReadOnly()
  const { checked } = element as CheckListElement;
  return (
    <div class="flex flex-row items-center" {...attributes}>
      <span contenteditable={false} class="mx-1">
        <input
          type="checkbox"
          checked={checked}
          class="w-max"
          onChange={(event) => {
            const path = SolidEditor.findPath(editor, element);
            const newProperties: Partial<SlateElement> = {
              checked: event.target.checked,
            };
            Transforms.setNodes(editor, newProperties, { at: path });
          }}
        />
      </span>
      <span
        // contenteditable={false /*!readOnly*/}
        class="flex-1"
        style={{
          opacity: `${checked ? 0.666 : 1}`,
          'text-decoration': `${checked ? 'line-through' : 'none'}`,
          // "&:focus" {
          //   "outline": none;
          // }
        }}
      >
        {children}
      </span>
    </div>
  );
};

const elementsMap: Record<Exclude<CustomElement['type'], 'image'>, Element> = {
  block_quote,
  list_item,
  ordered_list,
  bulleted_list,
  check_list,
  heading_one,
  // heading_two,
  // image,
  link,
  paragraph,
};

export function RenderElement(props: RenderElementProps): JSXElement {
  return (
    <Dynamic
      children={props.children}
      component={
        elementsMap[
          props.element.type as Exclude<CustomElement['type'], 'image'>
        ] ?? ((props) => <p {...props} />)
      }
      element={props.element}
      style={{
        'text-align':
          'align' in props.element ? props.element.align : undefined,
      }}
      {...props.attributes}
    />
  );
}

export function RenderLeaf(props: RenderLeafProps) {
  return (
    <span {...props.attributes}>
      {(() => {
        let children = props.children as JSXElement;
        if (props.leaf.bold) {
          children = <strong>{children}</strong>;
        }
        if (props.leaf.code) {
          children = <code>{children}</code>;
        }
        if (props.leaf.italic) {
          children = <em>{children}</em>;
        }
        if (props.leaf.underline) {
          children = <u>{children}</u>;
        }
        return children;
      })()}
    </span>
  );
}
