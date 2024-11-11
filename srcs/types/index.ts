export type Editors = Item['editor'];

export type Item = {
  id?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /**
   * The editor determines the UI allowing users to interact with an item.
   */
  // TODO: implement editor plugins and/or custom editor support.
  editor:
    | 'markdown'
    // | 'pdf'
    // | 'photo'
    | 'rich';
  // | 'vector'
  // | 'video';
  schema?: string;
};

export type Asset = {
  id?: number | string;
  name: string;
  mime: string;
  data: number[];
};
