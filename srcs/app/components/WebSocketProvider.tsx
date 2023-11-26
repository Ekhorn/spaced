import { io } from 'socket.io-client';
import {
  type JSXElement,
  useContext,
  createContext,
  Show,
  createSignal,
} from 'solid-js';

import { useState } from './StateProvider.js';
import { type Item } from '../lib/types.js';

const [connected, setConnected] = createSignal(false);

const url = new URL(`http://${window.location.host}`);
const socket = io(url, {
  autoConnect: false,
});

function onSubmit(event: SubmitEvent) {
  event.preventDefault();
  const target = event.target as HTMLFormElement | null;
  if (target) {
    const formData = new FormData(target);
    socket.auth = { user: formData.get('user') };
    socket.connect();
    setConnected(true);
  }
}

const { setItems } = useState();

socket.on('item:updates', (item: Item) => {
  setItems((value) =>
    value.map((i) => {
      if (item.id === i.id) {
        item.schema = i.schema;
      }
      return item;
    }),
  );
});

const WebSocketContext = createContext({ socket });

type WebSocketProps = {
  children: JSXElement;
};

export function WebSocketProvider(props: WebSocketProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <WebSocketContext.Provider>
      <Show when={!connected()}>
        <form onSubmit={onSubmit} class="absolute z-50 p-2">
          <input placeholder="user" name="user" class="m-2 rounded"></input>
        </form>
      </Show>
      {props.children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
