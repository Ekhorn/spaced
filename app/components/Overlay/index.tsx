import {
  createContext,
  createMemo,
  createSignal,
  Index,
  ParentComponent,
  Show,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { Search } from './Search';
import { useView } from '../Viewport';

let menuRef: HTMLDivElement;

export type OverlayState = {
  readonly isEdit: boolean;
};
export type OverlayContextValue = [
  state: OverlayState,
  actions: {
    toggleEditOverlay: () => void;
  },
];

const defaultState: OverlayState = {
  isEdit: false,
};

const OverlayContext = createContext<OverlayContextValue>([
  defaultState,
  {
    toggleEditOverlay: () => undefined,
  },
]);

export const OverlayProvider: ParentComponent<{
  isEdit?: boolean;
}> = (props) => {
  const [state, setState] = createStore<OverlayState>({
    isEdit: props.isEdit ?? defaultState.isEdit,
  });

  const [view] = useView();

  const [els, setEls] = createSignal<Node[]>([(<Search />) as Node]);

  function createControl() {
    const d = document.createElement('div');
    d.classList.add('absolute', 'z-50');
    d.appendChild((<span>{createMemo(() => view.position.x)}</span>) as Node);
    d.appendChild((<span>{createMemo(() => view.position.y)}</span>) as Node);
    setEls((e) => [...e, d]);
  }

  const [menu, setMenu] = createSignal(false);

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    setMenu(true);
    menuRef.style.setProperty('top', e.clientY + 'px'); //  issue with window scaling
    menuRef.style.setProperty('left', e.clientX + 'px');
    // menuRef.firstChild?.focus()
  };

  const handleBlur = () => {
    setMenu(false);
  };

  const toggleEditOverlay = () => setState('isEdit', (e) => !e);

  return (
    <OverlayContext.Provider value={[state, { toggleEditOverlay }]}>
      {props.children}
      <Index each={els()}>{(el) => el()}</Index>
      <Show when={state.isEdit}>
        <canvas
          class="absolute z-40 w-screen h-screen bg-black opacity-50"
          oncontextmenu={handleContextMenu}
        />
        <Show when={menu()}>
          <div
            ref={menuRef}
            onblur={handleBlur}
            class="flex flex-col absolute z-50 rounded w-16 bg-slate-200"
          >
            <button tabindex="-1" onclick={createControl} class="">
              test
            </button>
          </div>
        </Show>
      </Show>
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => useContext(OverlayContext);
