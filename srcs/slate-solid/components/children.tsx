import { type Ancestor, type Descendant, Editor, Element, Range } from 'slate';
import { createRenderEffect, type JSXElement } from 'solid-js';

import {
  type RenderElementProps,
  type RenderLeafProps,
  type RenderPlaceholderProps,
} from './editable.tsx';
import { Element as ElementComponent } from './element.tsx';
import { Text } from './text.tsx';
import { useDecorate } from '../hooks/use-decorate.ts';
import { SelectedContext } from '../hooks/use-selected.ts';
import { useSlateStatic } from '../hooks/use-slate-static.tsx';
import { useSlateWithV } from '../hooks/use-slate.tsx';
import { SolidEditor } from '../plugin/solid-editor.ts';
import { NODE_TO_INDEX, NODE_TO_PARENT } from '../utils/weakmaps.ts';

export function createChildren(props: {
  decorations: Range[];
  node: Ancestor;
  renderElement?: (props: RenderElementProps) => JSXElement;
  renderPlaceholder: (props: RenderPlaceholderProps) => JSXElement;
  renderLeaf?: (props: RenderLeafProps) => JSXElement;
  selection: Range | null;
}) {
  // SOLID: force re-render children after update??
  // TODO: implement fine grain updates
  useSlateWithV()();

  const decorate = useDecorate();
  const editor = useSlateStatic();

  const children: JSXElement[] = [];

  createRenderEffect(() => {
    const path = SolidEditor.findPath(editor, props.node);
    const isLeafBlock = Element.isElement(props.node) &&
      !editor.isInline(props.node) &&
      Editor.hasInlines(editor, props.node);

    for (let i = 0; i < props.node.children.length; i++) {
      const p = path.concat(i);
      const n = props.node.children[i] as Descendant;
      const range = Editor.range(editor, p);
      const sel = props.selection && Range.intersection(range, props.selection);
      const ds = decorate([n, p]);

      for (const dec of props.decorations) {
        const d = Range.intersection(dec, range);

        if (d) {
          ds.push(d);
        }
      }

      NODE_TO_INDEX.set(n, i);
      NODE_TO_PARENT.set(n, props.node);

      if (Element.isElement(n)) {
        children.push(
          <SelectedContext.Provider value={!!sel}>
            <ElementComponent
              decorations={ds}
              element={n}
              renderElement={props.renderElement}
              renderPlaceholder={props.renderPlaceholder}
              renderLeaf={props.renderLeaf}
              selection={sel}
            />
          </SelectedContext.Provider>,
        );
      } else {
        children.push(
          <Text
            decorations={ds}
            isLast={isLeafBlock && i === props.node.children.length - 1}
            parent={props.node as Element}
            renderPlaceholder={props.renderPlaceholder}
            renderLeaf={props.renderLeaf}
            text={n}
          />,
        );
      }
    }
  });

  return children;
}
