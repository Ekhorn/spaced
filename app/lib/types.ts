// TODO: use actual CSSStylesheets
/**
 * The item's styling overrides.
 */
export type ItemStyleOverrides = {
  // rounding?: number;
  color?: string;
};

/**
 * The item metadata used to set expectations, such as location and size.
 */
export type ItemMetadata = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  /**
   * The item's content type.
   */
  type?: 'string';
  /**
   * The item's (data) content length.
   */
  length?: number;
} & ItemStyleOverrides;

/**
 * An item holding its metadata and arbitrary data.
 */
export type Item = {
  id?: number;
  data?: string;
} & ItemMetadata;
