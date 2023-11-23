import { type Vec2D } from './vector.js';

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

export function getBoundingBox(pos: Vec2D, scalar = 2) {
  const roundedX = Math.round(pos.x);
  const roundedY = Math.round(pos.y);

  const halfWidth = Math.round(window.innerWidth / 2);
  const halfHeight = Math.round(window.innerHeight / 2);

  return {
    xmin: roundedX - halfWidth * scalar,
    ymin: -roundedY - halfHeight * scalar,
    xmax: roundedX + halfWidth * scalar,
    ymax: -roundedY + halfHeight * scalar,
  };
}
