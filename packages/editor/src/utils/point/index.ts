export class Point {
  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  private readonly _x: number;
  private readonly _y: number;

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  public equals({ x, y }: Point): boolean {
    return this.x === x && this.y === y;
  }

  public calcDeltaXTo({ x }: Point): number {
    return this.x - x;
  }

  public calcDeltaYTo({ y }: Point): number {
    return this.y - y;
  }

  public calcHorizontalDistanceTo(point: Point): number {
    return Math.abs(this.calcDeltaXTo(point));
  }

  public calcVerticalDistance(point: Point): number {
    return Math.abs(this.calcDeltaYTo(point));
  }

  public calcDistanceTo(point: Point): number {
    return Math.sqrt(
      Math.pow(this.calcDeltaXTo(point), 2) +
        Math.pow(this.calcDeltaYTo(point), 2)
    );
  }
}

/**
 * Predicate function for determining points
 * @param x
 */
export const isPoint = (x: unknown): x is Point => x instanceof Point;
