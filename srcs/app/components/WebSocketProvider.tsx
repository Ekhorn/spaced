import { io } from 'socket.io-client';
import { type JSXElement, useContext, createContext } from 'solid-js';

import { useState } from './StateProvider.js';
import { type Item } from '../lib/types.js';

const socket = io(window.location.origin, {
  autoConnect: false,
});

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
    <WebSocketContext.Provider>{props.children}</WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
