import { type Range, type NodeEntry } from 'slate';
import { createContext, useContext } from 'solid-js';

/**
 * A Solid context for sharing the `decorate` prop of the editable.
 */
export const DecorateContext = createContext<(entry: NodeEntry) => Range[]>(
  () => [],
);

/**
 * Get the current `decorate` prop of the editable.
 */
export const useDecorate = (): ((entry: NodeEntry) => Range[]) => {
  return useContext(DecorateContext);
};
