import type { Vec2D } from './vector.js';

type Callback<T> = (...args: unknown[]) => Promise<T> | T;

export function debounce<T>(cb: Callback<T>, delay = 1000): Callback<T> {
  let timeout: ReturnType<typeof setTimeout>;
  let mem: T;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      mem = await cb(...args);
      return mem;
    }, delay);
    return mem;
  };
}

export function throttle<T>(cb: Callback<T>, delay = 1000): Callback<T> {
  let lastCallTime = 0;
  let mem: T;
  return async (...args) => {
    const now = Date.now();
    if (now - lastCallTime >= delay) {
      mem = await cb(...args);
      lastCallTime = now;
      return mem;
    }
    return mem;
  };
}

export function getBoundingBox(pos: Vec2D) {
  return {
    xmin: Math.round(pos.x),
    ymin: -Math.round(pos.y) - Math.round(window.innerHeight),
    xmax: Math.round(pos.x) + Math.round(window.innerWidth),
    ymax: -Math.round(pos.y),
  };
}
