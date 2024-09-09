import { type Text } from 'slate';
import { Editable, TheEditor } from 'slate-solid';
import { type JSX, type JSXElement } from 'solid-js';

type ElementProps = {
  attributes: object;
  children: JSXElement;
  style: JSX.CSSProperties;
};
const ElementMap: Record<string, (props: ElementProps) => JSXElement> = {
  'block-quote': (props) => (
    <blockquote
      style={props.style}
      {...props.attributes}
      children={props.children}
    />
  ),
  'bulleted-list': (props) => (
    <ul style={props.style} {...props.attributes} children={props.children} />
  ),
  'heading-one': (props) => (
    <h1 style={props.style} {...props.attributes} children={props.children} />
  ),
  'heading-two': (props) => (
    <h2 style={props.style} {...props.attributes} children={props.children} />
  ),
  'numbered-list': (props) => (
    <ol style={props.style} {...props.attributes} children={props.children} />
  ),
  'list-item': (props) => (
    <li style={props.style} {...props.attributes} children={props.children} />
  ),
};

function Element(props: {
  attributes: object;
  children: JSXElement;
  element: { type: string; align: string };
}) {
  return (
    // @ts-expect-error ingore textAlign -> text-align
    <Dynamic
      component={
        ElementMap?.[props?.element?.type] ??
        ((props) => (
          <p
            {...props.attributes}
            style={props.style}
            children={props.children}
          />
        ))
      }
      {...{
        ...props,
        style: { 'text-align': props?.element?.align },
      }}
    />
  );
}

function Leaf(props: { attributes: object; children: JSXElement; leaf: Text }) {
  const children = () => {
    if (props.leaf.bold) {
      return <strong>{props.children}</strong>;
    }

    if (props.leaf.code) {
      return <code>{props.children}</code>;
    }

    if (props.leaf.italic) {
      return <em>{props.children}</em>;
    }

    if (props.leaf.underline) {
      return <u>{props.children}</u>;
    }
    return props.children;
  };

  return <span {...props.attributes}>{children()}</span>;
}

export function Wysiwyg(props: { style: JSX.CSSProperties }) {
  return (
    <TheEditor initialValue={example}>
      <Editable
        renderElement={Element}
        renderLeaf={Leaf}
        placeholder="Enter some rich text…"
        spellCheck
        autoFocus
        style={props.style}
      ></Editable>
    </TheEditor>
  );
}

const example = [
  {
    type: 'paragraph',
    children: [
      { text: 'This is editable ' },
      { text: 'rich', bold: true },
      { text: ' text, ' },
      { text: 'much', italic: true },
      { text: ' better than a ' },
      { text: '<textarea>', code: true },
      { text: '!' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: "Since it's rich text, you can do things like turn a selection of text ",
      },
      { text: 'bold', bold: true },
      {
        text: ', or add a semantically rendered block quote in the middle of the page, like this:',
      },
    ],
  },
  {
    type: 'block-quote',
    children: [{ text: 'A wise quote.' }],
  },
  {
    type: 'paragraph',
    align: 'center',
    children: [{ text: 'Try it out for yourself!' }],
  },
];
