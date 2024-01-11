import {
  type JSXElement,
  useContext,
  createContext,
  createSignal,
} from 'solid-js';

const [getSelected, setSelections] = createSignal(new Set<number>());

function register(selectable: number) {
  setSelections((prev) => new Set<number>([...prev, selectable]));
}
const [holdingCtrl, setHoldingCtrl] = createSignal(false);
const [holdingShift, setHoldingShift] = createSignal(false);
window.addEventListener('keydown', (e) => {
  setHoldingCtrl(e.ctrlKey);
  setHoldingShift(e.shiftKey);
});
window.addEventListener('keyup', (e) => {
  setHoldingCtrl(e.ctrlKey);
  setHoldingShift(e.shiftKey);
});
window.addEventListener('click', (e) => {
  setHoldingCtrl(e.ctrlKey);
  setHoldingShift(e.shiftKey);
});
function unregister(selectable: number) {
  setSelections((prev) => {
    const selections = new Set(prev);
    selections.delete(selectable);
    return selections;
  });
}

const SelectiontContext = createContext({
  getSelected,
  register,
  unregister,
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
