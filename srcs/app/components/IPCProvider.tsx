import { invoke } from '@tauri-apps/api';
import { type IDBPDatabase, openDB } from 'idb';
import { type Socket, io } from 'socket.io-client';
import { type JSXElement, useContext, createContext } from 'solid-js';
import { type Item, type Asset } from 'types';

import { isTauri } from '../lib/const.js';
import {
  assetStore,
  type DB,
  defaultStore,
  itemAssetsStore,
  itemStore,
  upgrade,
} from '../lib/idb.js';
import { processRefs } from '../lib/item.js';
import { type Storage } from '../lib/types.js';

const socket = io(window.location.origin, {
  autoConnect: false,
  auth: {
    user: 'test',
  },
});

let db: IDBPDatabase<DB>;

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
        upgrade,
      });
      console.info(`Current migration version: ${db.version}`);
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
    case 'cloud': {
      if (localStorage.getItem('access_token')) {
        localStorage.setItem('storage', 'cloud');
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

async function getNearbyItems() {
  const storage = localStorage.getItem('storage');
  switch (storage) {
    case 'browser': {
      if (db) {
        return await db.getAll(itemStore);
      }
      break;
    }
    case 'local': {
      if (isTauri) {
        return await invoke('get_nearby_items');
      }
      break;
    }
    case 'cloud': {
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

async function getAsset(id: string) {
  const storage = localStorage.getItem('storage');
  switch (storage) {
    case 'browser': {
      if (db) {
        return await db.get(assetStore, id);
      }
      break;
    }
    case 'local': {
      if (isTauri) {
        return await invoke('get_asset', { id });
      }
      break;
    }
    case 'cloud': {
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

async function createItem(item: Item, assets: number[][]) {
  const storage = localStorage.getItem('storage');
  switch (storage) {
    case 'browser': {
      if (db) {
        const [schema, linkedAssets] = processRefs(
          JSON.parse(item.schema!),
          assets.map((data) => ({
            id: crypto.randomUUID(),
            name: '',
            mime: '',
            data,
          })),
        );
        const tx = db.transaction(
          [itemStore, assetStore, itemAssetsStore],
          'readwrite',
        );
        const key = await Promise.all([
          ...linkedAssets.map((asset) => tx.objectStore(assetStore).add(asset)),
          tx.objectStore(itemStore).add({
            ...item,
            schema: JSON.stringify(schema),
          }),
        ]).then(async (resolved) => {
          const item_id = resolved.at(-1) as number;
          const asset_ids = resolved.slice(0, -1) as string[];
          await Promise.all(
            asset_ids.map((asset_id) =>
              tx.objectStore(itemAssetsStore).add({ item_id, asset_id }),
            ),
          );
          return item_id;
        });
        await tx.done;

        return await db.get(itemStore, key);
      }
      break;
    }
    case 'local': {
      if (isTauri) {
        return await invoke('create_item', { ...item, assets });
      }
      break;
    }
    case 'cloud': {
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

async function updateItem(items: Item[]) {
  const storage = localStorage.getItem('storage');
  switch (storage) {
    case 'browser': {
      if (db) {
        const tx = db.transaction(itemStore, 'readwrite');
        const output = await Promise.all(
          items.map(async (item) => {
            const key = await tx.store.put(item);
            return await tx.store.get(key);
          }),
        );
        await tx.done;
        return output;
      }
      break;
    }
    case 'local': {
      if (isTauri) {
        await invoke('patch_item', { items });
        return items;
      }
      break;
    }
    case 'cloud': {
      if (localStorage.getItem('access_token')) {
        return await Promise.all(
          items.map(
            async (item) => await socket.emitWithAck('item:update_inner', item),
          ),
        );
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
        await db.delete(itemStore, id);
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
    case 'cloud': {
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

  readonly getNearbyItems: () => Promise<Item[]>;
  readonly getAsset: (id: string) => Promise<Asset>;
  readonly createItem: (item: Item, assets: number[][]) => Promise<Item>;
  readonly updateItem: (items: Item[]) => Promise<Item[]>;
  readonly deleteItem: (id: number) => Promise<number>;
}
const IpcContext = createContext<IpcContext>({
  socket,
  // connectTauri,
  // connectDB,
  connect,
  getNearbyItems,
  getAsset,
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
