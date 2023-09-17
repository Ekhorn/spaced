import {
  type JSXElement,
  createContext,
  createSignal,
  useContext,
  For,
  createMemo,
  Show,
} from 'solid-js';
import { Portal } from 'solid-js/web';

import { useViewport } from './ViewportProvider.js';
import { Vec2D, absoluteToRelative } from '../lib/vector.js';

const [isOpen, setIsOpen] = createSignal(false);
const [absoluteMenuPosition, setAbsoluteMenuPosition] = createSignal(
  new Vec2D(0, 0),
);
const [selectedMenuItem, setSelectedMenuItem] = createSignal();
let callback: () => void;
function setCallback(cb: () => void) {
  callback = cb;
}

const context = {
  isOpen,
  setIsOpen,
  absoluteMenuPosition,
  setAbsoluteMenuPosition,
  selectedMenuItem,
  setSelectedMenuItem,
  setCallback,
};

const MenuContext = createContext(context);

type ContextmenuProps = {
  children: JSXElement;
};

export function ContextmenuProvider(props: ContextmenuProps) {
  const { absoluteViewportPosition, scalar } = useViewport();
  const translation = createMemo(() =>
    absoluteToRelative(
      absoluteMenuPosition(),
      absoluteViewportPosition(),
      scalar(),
    ),
  );

  // eslint-disable-next-line unicorn/consistent-function-scoping
  function handleClick(event: MouseEvent, color: string) {
    setSelectedMenuItem(color);
    setIsOpen(false);
    callback();
  }

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <MenuContext.Provider>
      {/* TODO: probably don't need this */}
      <Portal mount={document.querySelector('#viewport')!}>
        <Show when={isOpen()}>
          <ul
            class="absolute z-[99999] rounded"
            style={{
              'transform-origin': 'top left',
              translate: `
                      ${translation().x}px
                      ${-translation().y}px
                    `,
            }}
          >
            <For
              each={[
                { color: '#ffa75a', thing: 'Domain event' },
                { color: '#fffaba', thing: 'Actor' },
                { color: '#abb3ff', thing: 'Command' },
                { color: '#ccacd7', thing: 'Business process' },
                { color: '#f6d53d', thing: 'Aggregrate' },
                { color: '#eda2c4', thing: 'External system' },
                { color: '#d0e36c', thing: 'Read model' },
                { color: '#f096a0', thing: 'Hotspot' },
              ]}
            >
              {({ color, thing }) => (
                <li
                  onClick={(e) => handleClick(e, color)}
                  style={{ 'background-color': color }}
                >
                  {thing}
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Portal>
      {props.children}
    </MenuContext.Provider>
  );
}

export function useContextmenu() {
  return useContext(MenuContext);
}
