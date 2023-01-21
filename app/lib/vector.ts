export default class Vec2D {
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

  scale(scalar: number): Vec2D {
    return new Vec2D(this.x * scalar, this.y * scalar);
  }

  div(scalar: number): Vec2D {
    return new Vec2D(this.x / scalar, this.y / scalar);
  }
}
