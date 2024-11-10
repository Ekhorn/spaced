import { ReactiveWeakMap } from '@solid-primitives/map';
import {
  type JSXElement,
  useContext,
  createContext,
  createSignal,
} from 'solid-js';

export const ITEM_TO_SELECTION: Record<number, HTMLElement> = {};

const selections = new ReactiveWeakMap<HTMLElement, boolean>();

const [selecting, setSelecting] = createSignal(false);
const [holdingCtrl, setHoldingCtrl] = createSignal(false);
const [holdingShift, setHoldingShift] = createSignal(false);
window.addEventListener('keydown', (e) => {
  setHoldingCtrl(e.ctrlKey);
  setHoldingShift(e.shiftKey);
});
window.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'Control': {
      return setHoldingCtrl(false);
    }
    case 'Shift': {
      return setHoldingShift(false);
    }
  }
});
window.addEventListener('click', (e) => {
  setHoldingCtrl(e.ctrlKey);
  setHoldingShift(e.shiftKey);
});

const SelectiontContext = createContext({
  selections,
  selecting,
  setSelecting,
  holdingCtrl,
  holdingShift,
});

type ProviderProps = {
  readonly children: JSXElement;
};

export function SelectionProvider(props: ProviderProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <SelectiontContext.Provider>{props.children}</SelectiontContext.Provider>
  );
}

export function useSelection() {
  return useContext(SelectiontContext);
}
