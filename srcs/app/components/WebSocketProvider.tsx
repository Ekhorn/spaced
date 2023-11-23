import { io } from 'socket.io-client';
import { type JSXElement, useContext, createContext } from 'solid-js';

const socket = io(window.location.origin, {
  autoConnect: false,
  auth: {
    user: 'test',
  },
});

const WebSocketContext = createContext({ socket });

type WebSocketProps = {
  readonly children: JSXElement;
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
