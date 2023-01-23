import { createContext, useContext, ParentComponent } from "solid-js";
import { createStore } from "solid-js/store";
import { viewToGlobal } from "../../lib/utils";
import Vec2D from "../../lib/vector";

export type Scale = {
  level: number;
  factor: number;
}
export type ViewportState = {
  readonly position: Vec2D;
  readonly lastMousePosition: Vec2D;
  readonly scale: Scale;
  readonly width: number;
  readonly height: number;
};
export type ViewContextValue = [
  state: ViewportState,
  actions: {
    setPosition: (coords: Vec2D) => void;
    setLastMousePosition: (coords: Vec2D) => void;
    setDimensions: (width: number, height: number) => void;
    scaleViewUpTo: (coords: Vec2D) => void;
    scaleViewDownTo: (coords: Vec2D) => void;
  }
];

const defaultState: ViewportState = {
  position: new Vec2D(0, 0),
  lastMousePosition: new Vec2D(0, 0),
  scale: { level: 1.0, factor: 1.2 },
  width: 0,
  height: 0
};

const ViewContext = createContext<ViewContextValue>([
  defaultState,
  {
    setPosition: (coords: Vec2D) => coords,
    setLastMousePosition: (coords: Vec2D) => coords,
    setDimensions: () => undefined,
    scaleViewUpTo: () => undefined,
    scaleViewDownTo: () => undefined,
  }
]);

export const ViewProvider: ParentComponent<{
  position?: Vec2D;
  lastMousePosition?: Vec2D;
  zoom?: Scale;
  width?: number;
  height?: number;
  count?: number;
}> = (props) => {
  const [state, setState] = createStore<ViewportState>({
    position: props.position ?? defaultState.position,
    lastMousePosition: props.lastMousePosition ?? defaultState.lastMousePosition,
    scale: props.zoom ?? defaultState.scale,
    width: props.width ?? defaultState.width,
    height: props.height ?? defaultState.height
  });

  // todo rename
  const setPosition = (coords: Vec2D) =>
    setState(({ position: lastPosition, lastMousePosition, scale }) =>
      ({ position: lastPosition.add(coords.sub(lastMousePosition).div(scale.level)) })
    )

  const setLastMousePosition = (coords: Vec2D) => setState('lastMousePosition', coords)

  const setDimensions = (width: number, height: number) => setState({ width, height })

// todo rename
  const scaleViewUpTo = (coords: Vec2D) => {
    const globalMousePos = viewToGlobal(coords, state.position, state.scale.level);
    setState(({ position: lastPosition, scale }) => ({
      position: lastPosition
        .sub(globalMousePos)
        .div(scale.factor)
        .add(globalMousePos),
      scale: { ...scale, level: scale.level * scale.factor }
    }))
  };
// todo rename
  const scaleViewDownTo = (coords: Vec2D) => {
    const globalMousePos = viewToGlobal(coords, state.position, state.scale.level);
    setState(({ position: lastPosition, scale }) => ({
      position: lastPosition
        .sub(globalMousePos)
        .scale(scale.factor)
        .add(globalMousePos),
      scale: { ...scale, level: scale.level / scale.factor }, // scale_level = scale.factor^(-n)
    }))
  };

  return (
    <ViewContext.Provider value={[state, { setPosition, setLastMousePosition, setDimensions, scaleViewUpTo, scaleViewDownTo }]}>
      {props.children}
    </ViewContext.Provider>
  );
};

export const useView = () => useContext(ViewContext);
