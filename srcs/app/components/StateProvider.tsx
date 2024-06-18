import { type JSXElement, useContext, createContext } from 'solid-js';
import { createStore } from 'solid-js/store';

import { type Item } from '../lib/types.js';

const [items, setItems] = createStore<Item[]>([]);
const StateContext = createContext({
  items,
  setItems,
});

type StateProps = {
  readonly children: JSXElement;
};

export function StateProvider(props: StateProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <StateContext.Provider>{props.children}</StateContext.Provider>
  );
}

export function useState() {
  return useContext(StateContext);
}
