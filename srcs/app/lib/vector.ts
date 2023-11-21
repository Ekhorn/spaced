export class Vec2D {
  public readonly x: number;
  public readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(other: Vec2D): Vec2D {
    return new Vec2D(this.x + other.x, this.y + other.y);
  }

  sub(other: Vec2D): Vec2D {
    return new Vec2D(this.x - other.x, this.y - other.y);
  }

  mul(scalar: number): Vec2D {
    return new Vec2D(this.x * scalar, this.y * scalar);
  }

  div(scalar: number): Vec2D {
    return new Vec2D(this.x / scalar, this.y / scalar);
  }

  neg(): Vec2D {
    return new Vec2D(-this.x, -this.y);
  }
}

/**
 * @param absolute The absolute target vector.
 * @param viewport The absolute viewport position.
 * @param scalar The scalar value to apply.
 * @returns The relative position of the `absolute` target vector.
 */
export function absoluteToRelative(
  absolute: Vec2D,
  viewport: Vec2D,
  scalar: number,
) {
  return absolute.sub(viewport).mul(scalar);
}

/**
 * @param relative The relative target vector.
 * @param viewport The absolute viewport position.
 * @param scalar The scalar value to apply.
 * @returns The absolute position of the `relative` target vector.
 */
export function relativeToAbsolute(
  relative: Vec2D,
  viewport: Vec2D,
  scalar: number,
) {
  return relative.div(scalar).add(viewport);
}

/**
 * Scale the viewport up towards the `relative` position.
 * @param relative The relative position to scale up towards.
 * @param viewport The absolute viewport position.
 * @param scalar The scalar value to apply.
 * @param factor The factor by which the scalar value is scaled.
 * @returns The new absolute viewport position.
 */
export function scaleViewportUpTo(
  relative: Vec2D,
  viewport: Vec2D,
  scalar: number,
  factor: number,
) {
  const absolute = relativeToAbsolute(relative, viewport, scalar);
  return viewport.sub(absolute).div(factor).add(absolute);
}

/**
 * Scale the viewport out from the `relative` position.
 * @param relative The relative position to scale out from.
 * @param viewport The absolute viewport position.
 * @param scalar The scalar value to apply.
 * @param factor The factor by which the scalar value is scaled.
 * @returns The new absolute viewport position.
 */
export function scaleViewportOutFrom(
  relative: Vec2D,
  viewport: Vec2D,
  scalar: number,
  factor: number,
) {
  const absolute = relativeToAbsolute(relative, viewport, scalar);
  return viewport.sub(absolute).mul(factor).add(absolute);
}
