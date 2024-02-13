export class Point {
  /**
   * Ctor
   * @param x X coordinate
   * @param y Y coordinate
   */
  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  /**
   * The X coordinate
   * @private
   */
  private readonly _x: number;
  /**
   * The Y coordinate
   * @private
   */
  private readonly _y: number;

  /**
   * Returns the X coordinate
   */
  get x(): number {
    return this._x;
  }

  /**
   * Returns the Y coordinate
   */
  get y(): number {
    return this._y;
  }

  /**
   * Predicate method for comparing points
   * @param x X coordinate of the other point
   * @param y Y coordinate of the other point
   */
  public equals({ x, y }: Point): boolean {
    return this.x === x && this.y === y;
  }

  /**
   * Computes the delta X value to the provided point
   * @param x The X coordinate of the other point
   */
  public calc_delta_x_to({ x }: Point): number {
    return this.x - x;
  }

  /**
   * Computes the delta Y value to the provided point
   * @param y The Y coordinate of the other point
   */
  public calc_delta_y_to({ y }: Point): number {
    return this.y - y;
  }

  /**
   * Computes the horizontal distance between the current point and the provided point.
   * @param point The target point
   */
  public calc_horizontal_distance_to(point: Point): number {
    return Math.abs(this.calc_delta_x_to(point));
  }

  /**
   * Computes the vertical distance between the current point and the provided point.
   * @param point The target point
   */
  public calc_vertical_distance(point: Point): number {
    return Math.abs(this.calc_delta_y_to(point));
  }

  /**
   * Computes the distance between the current point and the provided point.
   * @param point The target point
   */
  public calc_distance_to(point: Point): number {
    return Math.sqrt(
      Math.pow(this.calc_delta_x_to(point), 2) +
        Math.pow(this.calc_delta_y_to(point), 2)
    );
  }
}

/**
 * Predicate function for determining points
 * @param x The test value
 */
export const is_point = (x: unknown): x is Point => x instanceof Point;
