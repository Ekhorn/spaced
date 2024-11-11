import { type Item } from 'types';

import { type allowedMimeTypes } from './const.js';

export type Storage = 'local' | 'browser' | 'cloud';

export type MimeTypes =
  typeof allowedMimeTypes extends Set<infer U> ? U : never;

export type Editors = Item['editor'];
