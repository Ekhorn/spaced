import type Vec2D from './vector.js';

export function globalToView(coords: Vec2D, view: Vec2D, level: number) {
  return coords.sub(view).scale(level);
}

export function viewToGlobal(coords: Vec2D, view: Vec2D, level: number) {
  return coords.div(level).add(view);
}

export type Zoom = { level: number; factor: number };

export function scaleViewUpTo(mouse: Vec2D, viewPostition: Vec2D, zoom: Zoom) {
  const globalMousePos = viewToGlobal(mouse, viewPostition, zoom.level);
  return viewPostition.sub(globalMousePos).div(zoom.factor).add(globalMousePos);
}

export function scaleViewAwayFrom(
  mouse: Vec2D,
  viewPostition: Vec2D,
  zoom: Zoom,
) {
  const globalMousePos = viewToGlobal(mouse, viewPostition, zoom.level);
  return viewPostition
    .sub(globalMousePos)
    .scale(zoom.factor)
    .add(globalMousePos);
}
