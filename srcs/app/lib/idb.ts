import { type IDBPDatabase, type DBSchema } from 'idb';
import { type Asset, type Item } from 'types';

export const defaultStore = 'spaced';
export const itemStore = 'item';
export const assetStore = 'asset';
export const itemAssetsStore = 'item_assets';

export interface DB extends DBSchema {
  item: {
    key: number;
    value: Item;
  };
  asset: {
    key: string;
    value: Asset;
  };
  item_assets: {
    key: [number, string];
    value: {
      item_id: number;
      asset_id: string;
    };
  };
}

export function upgrade(
  db: IDBPDatabase<DB>,
  oldVersion: number,
  newVersion: number,
) {
  if (newVersion > oldVersion) {
    console.info(`Migrating migration from ${oldVersion} to ${newVersion}`);
  }
  if (oldVersion < 1) {
    db.createObjectStore(itemStore, {
      keyPath: 'id',
      autoIncrement: true,
    });
    db.createObjectStore(assetStore, {
      keyPath: 'id',
      autoIncrement: false,
    });
    db.createObjectStore(itemAssetsStore, {
      keyPath: ['item_id', 'asset_id'],
      autoIncrement: false,
    });
  }
}
