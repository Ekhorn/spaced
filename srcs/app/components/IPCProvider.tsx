import { invoke } from '@tauri-apps/api';
import { type Socket, io } from 'socket.io-client';
import { type JSXElement, useContext, createContext } from 'solid-js';

const socket = io(window.location.origin, {
  autoConnect: false,
  auth: {
    user: 'test',
  },
});

async function connectTauri(path?: string) {
  return await invoke('connect', { path });
}

interface IpcContext {
  /**
   * A socket.io-client socket.
   *
   * Only meant to be used outside the provider, where it makes sense.
   */
  readonly socket: Socket;
  /**
   * Connect with a database using Tauri.
   */
  readonly connectTauri: (path?: string) => Promise<string>;
}
const IpcContext = createContext<IpcContext>({ socket, connectTauri });

type IPCProps = {
  readonly children: JSXElement;
};

export function IPCProvider(props: IPCProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <IpcContext.Provider>{props.children}</IpcContext.Provider>
  );
}

/**
 * An inter-process communication provider, wrapping Socket.IO-client sockets and Tauri commands.
 * @returns A context containing wrapper functions and a socket.io-client socket.
 */
export function useIPC() {
  return useContext(IpcContext);
}
