import { withCursors, withYjs, YjsEditor } from '@slate-yjs/core';
import {
  createEditor,
  Editor,
  Element as SlateElement,
  Node as SlateNode,
} from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, SolidEditor, withSolid } from 'slate-solid';
import isHotkey from 'slate-solid/utils/is-hotkey.js';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { SocketIOProvider } from 'y-socket.io';
import * as Y from 'yjs';

import { type RenderProps } from './Container.js';
import { Cursors } from './Cursors.jsx';
import { RenderElement, RenderLeaf } from './Elements.js';
import { useIPC } from './IPCProvider.js';
import { toggleMark, Toolbar } from './Toolbar.js';
import { type CustomEditor } from '../lib/editor-types.js';
import {
  MD_SHORTCUTS,
  withDelBackFix,
  withShortcuts,
  withValidNode,
} from '../lib/plugins.js';

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

export function CollaborativeEditor(props: RenderProps) {
  const [connected, setConnected] = createSignal(false);
  const [sharedType, setSharedType] = createSignal<Y.XmlText>();
  const [provider, setProvider] = createSignal<SocketIOProvider>();

  onMount(() => {
    const yDoc = new Y.Doc();
    const sharedDoc = yDoc.get('slate', Y.XmlText);

    const yProvider = new SocketIOProvider(
      window.origin,
      'test-room',
      yDoc,
      {},
    );

    yProvider.on('status', ({ status }: { status: string }) => {
      console.log(status); // Logs "connected" or "disconnected"
    });

    yProvider.on('sync', setConnected);
    setSharedType(sharedDoc);
    setProvider(yProvider);

    onCleanup(() => {
      yDoc?.destroy();
      yProvider?.off('sync', setConnected);
      yProvider?.destroy();
    });
  });

  return (
    <Show
      when={connected() && sharedType() && provider()}
      fallback={<div>Loading…</div>}
    >
      <SlateEditor sharedType={sharedType()} provider={provider()} {...props} />
    </Show>
  );
}

function SlateEditor(
  props: RenderProps & {
    sharedType?: Y.XmlText;
    provider?: SocketIOProvider;
  },
) {
  // eslint-disable-next-line solid/reactivity
  const isMarkdown = props.item.editor === 'markdown';

  const plugins: (<T extends CustomEditor>(editor: T) => T)[] = [
    withValidNode,
    withDelBackFix,
    withSolid,
    withHistory,
  ];
  if (isMarkdown) {
    plugins.push(withShortcuts);
  }

  const editor = withCursors(
    // eslint-disable-next-line unicorn/no-array-reduce
    plugins.reduce(
      (acc, fn) => fn(acc),
      // eslint-disable-next-line solid/reactivity
      withYjs(createEditor(), props.sharedType),
    ),
    // eslint-disable-next-line solid/reactivity
    props.provider?.awareness,
    {
      // The current user's name and color
      data: {
        name: 'Chris',
        color: '#00ff00',
      },
    },
  );

  const { updateItem } = useIPC();

  const handleDOMBeforeInput = () => {
    queueMicrotask(() => {
      const pendingDiffs = SolidEditor.androidPendingDiffs(editor);

      const scheduleFlush = pendingDiffs?.some(({ diff, path }) => {
        if (!diff.text.endsWith(' ')) {
          return false;
        }

        const { text } = SlateNode.leaf(editor, path);
        const beforeText = text.slice(0, diff.start) + diff.text.slice(0, -1);
        if (!(beforeText in MD_SHORTCUTS)) {
          return;
        }

        const blockEntry = Editor.above(editor, {
          at: path,
          match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        });
        if (!blockEntry) {
          return false;
        }

        const [, blockPath] = blockEntry;
        return Editor.isStart(editor, Editor.start(editor, path), blockPath);
      });

      if (scheduleFlush) {
        SolidEditor.androidScheduleFlush(editor);
      }
    });
  };

  createEffect(() => {
    if (YjsEditor.connect && props.sharedType) {
      YjsEditor.connect(editor);
    }
    onCleanup(() => YjsEditor.disconnect(editor));
  });

  return (
    <Slate
      initialValue={props.initialValue}
      editor={editor}
      // eslint-disable-next-line solid/reactivity
      onValueChange={async () => {
        const [item] = await updateItem([
          {
            ...props.item,
            schema: JSON.stringify(editor.children),
          },
        ]);
        // eslint-disable-next-line solid/reactivity
        props.setItems((prev) => prev.with(props.index, item));
      }}
    >
      <Show when={!isMarkdown}>
        <Toolbar selected={props.selected} />
        <div class="h-1 w-[424px]" />
      </Show>
      {/* <Cursors> */}
      <Editable
        onDOMBeforeInput={isMarkdown ? handleDOMBeforeInput : undefined}
        readOnly={!props.selected()}
        renderElement={RenderElement}
        renderLeaf={RenderLeaf}
        placeholder="Enter some rich text…"
        spellCheck
        style={{
          padding: '4px',
          'background-color': 'white',
          'border-radius': '4px',
        }}
        onKeyDown={(event: KeyboardEvent) => {
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event)) {
              event.preventDefault();
              const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
              toggleMark(editor, mark);
            }
          }
        }}
      />
      {/* </Cursors> */}
    </Slate>
  );
}

export const TextEditor = ({
  collaborative,
  ...props
}: RenderProps & { collaborative: boolean }) =>
  (collaborative ? CollaborativeEditor : SlateEditor)(props);
