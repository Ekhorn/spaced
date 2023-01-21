import Vec2D from "./vector";

// todo rename global
export function globalToView(coords: Vec2D, view: Vec2D, level: number) {
  return coords.sub(view).scale(level);
}

// todo rename global
export function viewToGlobal(coords: Vec2D, view: Vec2D, level: number) {
  return coords.div(level).add(view);
}

// potentially rename utils to viewport and create viewport class
