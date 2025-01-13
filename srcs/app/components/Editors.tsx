import { withCursors, withYHistory, withYjs, YjsEditor } from '@slate-yjs/core';
import { jsPDF } from 'jspdf';
import {
  type Range,
  type NodeEntry,
  createEditor,
  Editor,
  Element as SlateElement,
  Node as SlateNode,
} from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, SolidEditor, withSolid } from 'slate-solid';
import isHotkey from 'slate-solid/utils/is-hotkey.js';
import { useDecorateRemoteCursors } from 'slate-yjs-solid';
import {
  FaSolidCheck,
  FaSolidClipboard,
  FaSolidExpand,
  FaSolidFilePdf,
  FaSolidShareFromSquare,
  FaSolidUsersSlash,
  FaSolidXmark,
} from 'solid-icons/fa';
import {
  type Setter,
  type JSXElement,
  createEffect,
  createSignal,
  on,
  onCleanup,
  Show,
} from 'solid-js';
import { Portal } from 'solid-js/web';
import { SocketIOProvider } from 'y-socket.io';
import * as Y from 'yjs';

import { type RenderProps } from './Container.js';
import { Dialog, useDialog } from './Dialog.jsx';
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

const pdf = new jsPDF();

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

export function CollaborativeEditor(props: RenderProps) {
  // eslint-disable-next-line solid/reactivity
  const { initialValue } = props;
  // TODO: find better solution
  // eslint-disable-next-line solid/reactivity
  const init = 'initial' in props.item;
  if (init) {
    // eslint-disable-next-line solid/reactivity
    delete props.item.initial;
  }

  const [connected, setConnected] = createSignal(false);
  const [sharedType, setSharedType] = createSignal<Y.XmlText>();
  const [provider, setProvider] = createSignal<SocketIOProvider>();

  const yDoc = new Y.Doc();
  const sharedDoc = yDoc.get('slate', Y.XmlText);
  const yProvider = new SocketIOProvider(
    window.origin,
    // eslint-disable-next-line solid/reactivity
    props.item.shared!,
    yDoc,
    {},
  );

  yProvider.on(
    'status',
    ({ status }: { status: 'connected' | 'disconnected' }) => {
      console.log(status);
    },
  );

  yProvider.on('sync', setConnected);
  setSharedType(sharedDoc);
  setProvider(yProvider);

  onCleanup(() => {
    yDoc?.destroy();
    yProvider?.off('sync', setConnected);
    yProvider?.destroy();
  });

  const wrapper = () => {
    const editor = withCursors(
      // eslint-disable-next-line solid/reactivity
      withYHistory(withYjs(createEditor(), sharedType())),
      // eslint-disable-next-line solid/reactivity
      provider()?.awareness,
      {
        // The current user's name and color
        data: {
          name: localStorage.getItem('username') ?? '',
          color: localStorage.getItem('color') ?? '#fff',
        },
      },
    );

    if (init) {
      withValidNode(editor, initialValue);
    }

    createEffect(() => {
      if (YjsEditor.connect && sharedType() && provider()) {
        YjsEditor.connect(editor);
      }
      onCleanup(() => YjsEditor.disconnect(editor));
    });

    return (
      <SlateEditor
        {...props}
        editor={editor}
        decorate={useDecorateRemoteCursors() as (entry: NodeEntry) => Range[]}
        connected={connected()}
      />
    );
  };

  return (
    <Show
      when={connected() && sharedType() && provider()}
      fallback={<div class="flex rounded bg-white p-1">Loading…</div>}
    >
      {wrapper()}
    </Show>
  );
}

function SlateEditor(
  props: RenderProps & {
    editor?: Editor;
    decorate?: (entry: NodeEntry) => Range[];
    connected?: boolean;
  },
) {
  const [fullscreen, setFullscreen] = createSignal(false);

  // eslint-disable-next-line solid/reactivity
  const isMarkdown = props.item.editor === 'markdown';
  const plugins: (<T extends CustomEditor>(editor: T) => T)[] = [
    withDelBackFix,
    withSolid,
    withHistory,
  ];
  if (isMarkdown) {
    plugins.push(withShortcuts);
  }

  // eslint-disable-next-line unicorn/no-array-reduce
  const editor = plugins.reduce(
    (acc, fn) => fn(acc),
    // eslint-disable-next-line solid/reactivity
    props.editor ?? createEditor(),
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

  return (
    <Fullscreen fullscreen={fullscreen()}>
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
        <Show when={!isMarkdown || fullscreen()}>
          <Toolbar selected={props.selected} fullscreen={fullscreen} />
          <div class="h-1 w-[424px]" />
        </Show>
        <div class="pointer-events-none relative -z-20 rounded bg-white">
          <Editable
            decorate={props.decorate}
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
              'padding-bottom': '12px',
              'pointer-events': 'auto',
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
          <Show when={!fullscreen()}>
            <Footer editor={editor} setFullscreen={setFullscreen} {...props} />
          </Show>
        </div>
        <Show when={fullscreen()}>
          <Footer editor={editor} setFullscreen={setFullscreen} {...props} />
        </Show>
      </Slate>
    </Fullscreen>
  );
}

function Fullscreen(props: { fullscreen: boolean; children: JSXElement }) {
  const { isOpen, toggleDialog } = useDialog();

  createEffect(on(() => props.fullscreen, toggleDialog));

  return (
    <Show when={props.fullscreen && isOpen()} fallback={props.children}>
      <Portal
        mount={document.querySelector('#dialog')!}
        children={props.children}
      />
    </Show>
  );
}

function Footer(
  props: RenderProps & { editor: Editor; setFullscreen: Setter<boolean> },
) {
  const [sharing, setShare] = createSignal<'share' | 'configure' | 'sharing'>(
    // eslint-disable-next-line solid/reactivity
    props.item.shared ? 'sharing' : 'share',
  );
  const { updateItem } = useIPC();

  const configure = () => setShare('configure');
  const cancel = async () => {
    const [item] = await updateItem([
      {
        ...props.item,
        shared: undefined,
      },
    ]);
    // eslint-disable-next-line solid/reactivity
    props.setItems((prev) => prev.with(props.index, item));
    setShare('share');
  };

  const copyToClipboard = async () => {
    const type = 'text/plain';
    const blob = new Blob([props.item.shared!], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(data);
  };

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    for (const [key, value] of formData.entries()) {
      localStorage.setItem(key, value.toString());
    }

    const [item] = await updateItem([
      {
        ...props.item,
        shared: crypto.randomUUID(),
      },
    ]);
    // eslint-disable-next-line solid/reactivity
    props.setItems((prev) =>
      // @ts-expect-error TODO: find better solution
      prev.with(props.index, { ...item, initial: true }),
    );

    await copyToClipboard();
    setShare('sharing');
  };

  const handleUsername = (event: KeyboardEvent) => {
    const input = event.target as HTMLInputElement;
    localStorage.setItem('username', input.value);
    if ('sendCursorData' in props.editor) {
      // @ts-expect-error is function
      props.editor.sendCursorData({
        name: input.value,
        color: localStorage.getItem('color') ?? '',
      });
    }
  };

  const handleColor = (event: Event) => {
    const input = event.target as HTMLInputElement;
    localStorage.setItem('color', input.value);
    if ('sendCursorData' in props.editor) {
      // @ts-expect-error is function
      props.editor.sendCursorData({
        name: localStorage.getItem('username') ?? '',
        color: input.value,
      });
    }
  };

  return (
    <div class="pointer-events-auto relative -z-10 flex h-7 flex-row justify-between rounded-b bg-gray-50 p-1 text-xs text-[#aaa]">
      <div class="flex flex-row border-r pr-1">
        <button
          class="rounded px-1 hover:bg-[#ecedef]"
          title="Fullscreen"
          onClick={() => {
            props.setFullscreen((prev) => !prev);
          }}
        >
          <FaSolidExpand />
        </button>
        <button
          class="rounded px-1 hover:bg-[#ecedef]"
          title="Export to PDF"
          onClick={async () => {
            const content = document.querySelector('[data-slate-editor]')!;
            await pdf.html(content as HTMLElement, {
              callback: function (pdf) {
                pdf.save(`untitled.pdf`);
              },
              margin: 10,
              width: 190, // Width of the content in the PDF (max is 210 for A4)
              windowWidth: content.scrollWidth,
            });
          }}
        >
          <FaSolidFilePdf />
        </button>
      </div>
      <Show when={sharing() === 'share'}>
        <button
          class="row-end-auto rounded bg-gray-50 px-1 hover:bg-[#ecedef]"
          title="Share"
          onClick={configure}
        >
          <FaSolidShareFromSquare />
        </button>
      </Show>
      <Show when={sharing() === 'configure' || sharing() === 'sharing'}>
        <form class="flex flex-row" onSubmit={submit}>
          <input
            type="text"
            name="username"
            placeholder="username"
            class="w-full rounded-l border-0 bg-white p-1 ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset"
            value={localStorage.getItem('username') ?? ''}
            onKeyUp={handleUsername}
          />
          <input
            type="color"
            name="color"
            title="Pick a color"
            class="h-5 w-9 cursor-pointer rounded-r border-none p-0 hover:bg-[#ecedef]"
            value={localStorage.getItem('color') ?? ''}
            onChange={handleColor}
          />
          <Show when={sharing() === 'configure'}>
            <button
              type="submit"
              class="rounded px-1 hover:bg-[#ecedef]"
              title="Share & Copy"
            >
              <FaSolidCheck />
            </button>
            <button
              class="rounded px-1 hover:bg-[#ecedef]"
              title="Cancel"
              type="button"
              onClick={cancel}
            >
              <FaSolidXmark />
            </button>
          </Show>
        </form>
      </Show>
      <Show when={sharing() === 'sharing'}>
        <div class="flex flex-row">
          <button
            class="rounded px-1 hover:bg-[#ecedef]"
            title="Stop sharing"
            onClick={cancel}
          >
            <FaSolidUsersSlash />
          </button>
          <button
            type="submit"
            class="rounded px-1 hover:bg-[#ecedef]"
            title="Copy"
            onClick={copyToClipboard}
          >
            <FaSolidClipboard />
          </button>
        </div>
      </Show>
    </div>
  );
}

export const TextEditor = (props: RenderProps) => (
  <Show when={Boolean(props.item.shared)} fallback={<SlateEditor {...props} />}>
    <CollaborativeEditor {...props} />
  </Show>
);
