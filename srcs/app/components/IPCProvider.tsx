import { invoke } from '@tauri-apps/api';
import { type IDBPDatabase, openDB } from 'idb';
import { type Socket, io } from 'socket.io-client';
import { type JSXElement, useContext, createContext } from 'solid-js';

import { isTauri } from '../lib/const.js';
import { type Storage, type Item } from '../lib/types.js';

const socket = io(window.location.origin, {
  autoConnect: false,
  auth: {
    user: 'test',
  },
});

const defaultStore = 'spaced';
const objectStore = 'item';
let db: IDBPDatabase;

async function connect(storage?: Storage, path?: string): Promise<boolean> {
  const selectedStorage = storage || localStorage.getItem('storage');
  const selectedPath = path || localStorage.getItem('path');
  switch (selectedStorage) {
    case 'browser': {
      localStorage.setItem('storage', 'browser');
      if (db) {
        return true;
      }
      db = await openDB(defaultStore, 1, {
        upgrade(d) {
          d.createObjectStore(objectStore, {
            keyPath: 'id',
            autoIncrement: true,
          });
        },
      });
      return true;
    }
    case 'local': {
      if (isTauri && selectedPath) {
        localStorage.setItem('storage', 'local');
        localStorage.setItem('path', selectedPath);
        await invoke('connect', { path: selectedPath });
        return true;
      }
      return false;
    }
    case 'web': {
      if (localStorage.getItem('access_token')) {
        localStorage.setItem('storage', 'web');
        socket.connect();
        return true;
      }
      return false;
    }
    default: {
      localStorage.removeItem('storage');
      return false;
    }
  }
}

async function getNearByItems() {
  const storage = localStorage.getItem('storage');
  switch (storage) {
    case 'browser': {
      if (db) {
        return await db.getAll(objectStore);
      }
      break;
    }
    case 'local': {
      if (isTauri) {
        return await invoke('get_nearby_items');
      }
      break;
    }
    case 'web': {
      if (localStorage.getItem('access_token')) {
        return await socket.emitWithAck('item:get_nearby');
      }
      break;
    }
    default: {
      throw new Error('No storage type selected.');
    }
  }
  throw new Error('Failed to get nearby items.');
}

async function createItem(item: Item) {
  const storage = localStorage.getItem('storage');
  switch (storage) {
    case 'browser': {
      if (db) {
        const key = await db.add(objectStore, item);
        return await db.get(objectStore, key);
      }
      break;
    }
    case 'local': {
      if (isTauri) {
        return await invoke('create_item', item);
      }
      break;
    }
    case 'web': {
      if (localStorage.getItem('access_token')) {
        return await socket.emitWithAck('item:create', item);
      }
      break;
    }
    default: {
      throw new Error('No storage type selected.');
    }
  }
  throw new Error('Failed to create item.');
}

async function updateItem(item: Item) {
  const storage = localStorage.getItem('storage');
  switch (storage) {
    case 'browser': {
      if (db) {
        const key = await db.put(objectStore, item);
        return await db.get(objectStore, key);
      }
      break;
    }
    case 'local': {
      if (isTauri) {
        return await invoke('patch_item', item);
      }
      break;
    }
    case 'web': {
      if (localStorage.getItem('access_token')) {
        return await socket.emitWithAck('item:update_inner', item);
      }
      break;
    }
    default: {
      throw new Error('No storage type selected.');
    }
  }
  throw new Error('Failed to update item.');
}

async function deleteItem(id: number) {
  const storage = localStorage.getItem('storage');
  switch (storage) {
    case 'browser': {
      if (db) {
        await db.delete(objectStore, id);
        return id;
      }
      break;
    }
    case 'local': {
      if (isTauri) {
        return await invoke('delete_item', { id });
      }
      break;
    }
    case 'web': {
      // Not implemented.
      break;
    }
    default: {
      throw new Error('No storage type selected.');
    }
  }
  throw new Error('Failed to delete item.');
}

interface IpcContext {
  /**
   * A socket.io-client socket.
   *
   * Only meant to be used outside the provider, where it makes sense.
   */
  readonly socket: Socket;
  /**
   * Connect with IndexedDB, Tauri, or an Socket.IO socket.
   */
  readonly connect: (storage?: Storage, path?: string) => Promise<boolean>;

  readonly getNearByItems: () => Promise<Item[]>;
  readonly createItem: (item: Item) => Promise<Item>;
  readonly updateItem: (item: Item) => Promise<Item>;
  readonly deleteItem: (id: number) => Promise<number>;
}
const IpcContext = createContext<IpcContext>({
  socket,
  // connectTauri,
  // connectDB,
  connect,
  getNearByItems,
  createItem,
  updateItem,
  deleteItem,
});

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
