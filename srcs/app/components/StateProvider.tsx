import {
  createContext,
  createSignal,
  type JSXElement,
  useContext,
} from 'solid-js';
import { type Item } from 'types';

const [items, setItems] = createSignal<Item[]>([]);
const StateContext = createContext({
  items,
  setItems,
});

type StateProps = {
  readonly children: JSXElement;
};

export function StateProvider(props: StateProps) {
  return (
    // @ts-ignore Ignore since getters and setters are already present
    <StateContext.Provider>{props.children}</StateContext.Provider>
  );
}

export function useState() {
  return useContext(StateContext);
}
