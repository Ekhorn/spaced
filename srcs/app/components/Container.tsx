// import { invoke } from '@tauri-apps/api/tauri';
import { createMemo, type Setter } from 'solid-js';

// import { useContextmenu } from './ContextmenuProvider.js';
import { useSelection } from './SelectionProvider.js';
import { useViewport } from './ViewportProvider.js';
import { useWebSocket } from './WebSocketProvider.js';
import { type Item } from '../lib/types.js';
import { absoluteToRelative, Vec2D } from '../lib/vector.js';

type ContainerProps = {
  readonly index: number;
  readonly setItems: Setter<Item[]>;
} & Item;

export function Container(properties: ContainerProps) {
  const { absoluteViewportPosition, scalar } = useViewport();
  const { getSelected, holdingCtrl, holdingShift, register, unregister } =
    useSelection();
  const { socket } = useWebSocket();
  const selected = createMemo(() => getSelected().has(properties.id!));
  const translation = createMemo(() =>
    absoluteToRelative(
      new Vec2D(properties.x, properties.y),
      absoluteViewportPosition(),
      scalar(),
    ),
  );
  // function handleContextmenu(event: MouseEvent) {
  //   event.preventDefault();
  //   setAbsoluteMenuPosition(translation());
  //   setIsOpen((prev) => !prev);
  //   setCallback(() => {
  //     invoke('update', {
  //       ...properties,
  //       color: selectedMenuItem(),
  //       data: ref.textContent,
  //     }).then(() => {
  //       properties.mutate((prev) => {
  //         const items = [...prev!];
  //         items[properties.index] = {
  //           ...items[properties.index],
  //           color: selectedMenuItem() as string | undefined,
  //           data: ref.textContent!,
  //         };
  //         return items;
  //       });
  //     });
  //   });
  // }
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
  function handleKeyUp() {
    // if (event.shiftKey && event.key === 'Delete') {
    //   invoke('delete', { id: properties.id }).then(() => {
    //     properties.mutate((prev) => {
    //       // TODO: needs to be copied?
    //       const items = [...prev!];
    //       items?.splice(properties.index, 1);
    //       return items;
    //     });
    //   });
    // } else if (event.key === 'Escape') {
    //   ref.blur();
    // }
    socket.emit('item:update_inner', {
      ...properties,
      schema: ref.textContent,
    } as Item);
    // .then((response: Item) => {
    //   // eslint-disable-next-line unicorn/prefer-spread
    //   setItems((value) => value.concat(response));
    // });
    // invoke('update', {
    //   ...properties,
    //   // TODO: create class with normalize method for items...
    //   x: Math.floor(properties.x),
    //   y: Math.floor(properties.y),
    //   data: ref.textContent,
    // });
  }
  // eslint-disable-next-line unicorn/consistent-function-scoping
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
  return (
    <div
      ref={ref}
      onBeforeInput={handleBeforeInput}
      onKeyUp={handleKeyUp}
      onClick={handleClick}
      onBlur={handleBlur}
      // onContextMenu={handleContextmenu}
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
