import { invoke } from '@tauri-apps/api';
import { createMemo, type Setter } from 'solid-js';

import { useIPC } from './IPCProvider.jsx';
import { useSelection } from './SelectionProvider.js';
import { useViewport } from './ViewportProvider.js';
import { isTauri } from '../lib/const.js';
import { type Item } from '../lib/types.js';
import { absoluteToRelative, Vec2D } from '../lib/vector.js';

type ContainerProps = {
  readonly index: number;
  readonly setItems: Setter<Item[]>;
} & Item;

function handleBeforeInput(event: InputEvent) {
  if (event.inputType === 'insertParagraph') {
    event.preventDefault();
    const text = document.createTextNode('\n');
    const selection = window.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(text);
      range.setStartAfter(text);
      range.setEndAfter(text);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}

export function Container(properties: ContainerProps) {
  const { absoluteViewportPosition, scalar } = useViewport();
  const { getSelected, holdingCtrl, holdingShift, register, unregister } =
    useSelection();
  const { socket } = useIPC();
  const selected = createMemo(() => getSelected().has(properties.id!));
  const translation = createMemo(() =>
    absoluteToRelative(
      new Vec2D(properties.x, properties.y),
      absoluteViewportPosition(),
      scalar(),
    ),
  );

  let ref!: HTMLDivElement;
  function handleClick() {
    register(properties.id!);
  }

  function handleBlur() {
    if (holdingCtrl() || holdingShift()) {
      return;
    }
    unregister(properties.id!);
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (isTauri) {
      if (e.shiftKey && e.key === 'Delete') {
        invoke('delete_item', {
          id: properties.id,
        }).then((id: number) => {
          properties.setItems((prev) => prev.filter((item) => item.id != id));
        });
        return;
      } else {
        invoke('patch_item', {
          ...properties,
          schema: ref.textContent,
        } as Item);
        return;
      }
    }

    socket.emit('item:update_inner', {
      ...properties,
      schema: ref.textContent,
    } as Item);
  }

  return (
    <div
      ref={ref}
      onBeforeInput={handleBeforeInput}
      onKeyUp={handleKeyUp}
      onClick={handleClick}
      onBlur={handleBlur}
      class="absolute min-h-[30px] min-w-[30px] whitespace-pre p-1 outline outline-1"
      tabIndex="0"
      contenteditable={selected()}
      style={{
        'outline-color': selected()
          ? 'black'
          : properties.schema && 'transparent',
        'transform-origin': 'top left',
        'background-color': 'transparent',
        'pointer-events': 'all',
        'line-height': '1rem',
        translate: `
          ${translation().x}px
          ${-translation().y}px
        `,
        scale: `${scalar()}`,
      }}
    >
      {properties.schema}
    </div>
  );
}
