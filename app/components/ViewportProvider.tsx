import type { JSXElement } from 'solid-js';
import { useContext } from 'solid-js';
import { createContext, createSignal } from 'solid-js';

import { Vec2D } from '../lib/vector.js';

const [factor, setFactor] = createSignal(1.2);
const [scalar, setScalar] = createSignal(1);
const [absoluteViewportPosition, setAbsoluteViewportPosition] = createSignal(
  new Vec2D(0, 0),
);

const context = {
  factor,
  setFactor,
  scalar,
  setScalar,
  absoluteViewportPosition,
  setAbsoluteViewportPosition,
};

const ViewportContext = createContext(context);

type ViewportProps = {
  children: JSXElement;
};

export function ViewportProvider(props: ViewportProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <ViewportContext.Provider>{props.children}</ViewportContext.Provider>
  );
}

export function useViewport() {
  return useContext(ViewportContext);
}
