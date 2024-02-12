import { is_point, Point } from "../point";

interface ContainsPointReturn {
  reason: {
    is_on_bottom_side: boolean;
    is_on_left_side: boolean;
    is_on_right_side: boolean;
    is_on_top_side: boolean;
  };
  result: boolean;
}

export class Rect {
  /**
   * Ctor
   * @param left The left coordinate
   * @param top The top coordinate
   * @param right The right coordinate
   * @param bottom The bottom coordinate
   */
  constructor(left: number, top: number, right: number, bottom: number) {
    const [_top, _bottom] = top <= bottom ? [top, bottom] : [bottom, top];
    const [_left, _right] = left <= right ? [left, right] : [right, left];

    this._top = _top;
    this._right = _right;
    this._left = _left;
    this._bottom = _bottom;
  }

  /**
   * Creates a new instance using the LTRB sequence
   * @param left The left coordinate
   * @param top The top coordinate
   * @param right The right coordinate
   * @param bottom The bottom coordinate
   */
  static from_ltrb(
    left: number,
    top: number,
    right: number,
    bottom: number
  ): Rect {
    return new Rect(left, top, right, bottom);
  }

  /**
   * Creates a new instance using the left/top coordinate and the width/height.
   * @param left The left coordinate
   * @param width The width of the rectangle
   * @param top The top coordinate
   * @param height The height of the rectangle
   */
  static from_lwth(
    left: number,
    width: number,
    top: number,
    height: number
  ): Rect {
    return new Rect(left, top, left + width, top + height);
  }

  /**
   * Creates a new instance from the provided points
   * @param start_point The starting point
   * @param end_point The ending point
   */
  static from_points(start_point: Point, end_point: Point): Rect {
    const { y: top, x: left } = start_point;
    const { y: bottom, x: right } = end_point;
    return Rect.from_ltrb(left, top, right, bottom);
  }

  /**
   * Creates a new instance from the provided DOM element.
   * @param dom The DOM element
   */
  static from_dom(dom: HTMLElement): Rect {
    const { top, width, left, height } = dom.getBoundingClientRect();
    return Rect.from_lwth(left, width, top, height);
  }

  /**
   * The left coordinate
   * @private
   */
  private readonly _left: number;
  /**
   * The top coordinate
   * @private
   */
  private readonly _top: number;
  /**
   * The right coordinate
   * @private
   */
  private readonly _right: number;
  /**
   * The bottom coordinate
   * @private
   */
  private readonly _bottom: number;

  /**
   * Returns the top coordinate
   */
  get top(): number {
    return this._top;
  }

  /**
   * Returns the right coordinate
   */
  get right(): number {
    return this._right;
  }

  /**
   * Returns the bottom coordinate
   */
  get bottom(): number {
    return this._bottom;
  }

  /**
   * Returns the left coordinate
   */
  get left(): number {
    return this._left;
  }

  /**
   * Returns the width of the rectangle
   */
  get width(): number {
    return Math.abs(this._left - this._right);
  }

  /**
   * Returns the height of the rectangle
   */
  get height(): number {
    return Math.abs(this._bottom - this._top);
  }

  /**
   * Predicate method for comparing rectangles
   * @param top The top coordinate of the other rectangle
   * @param left The left coordinate of the other rectangle
   * @param bottom The bottom coordinate of the other rectangle
   * @param right The right coordinate of the other rectangle
   */
  public equals({ top, left, bottom, right }: Rect): boolean {
    return (
      top === this._top &&
      bottom === this._bottom &&
      left === this._left &&
      right === this._right
    );
  }

  /**
   * Predicate method for determining whether the provided point lies inside the current rectangle.
   * @param x The X coordinate of the point
   * @param y The Y coordinate of the point
   */
  public contains({ x, y }: Point): ContainsPointReturn;
  /**
   * Predicate method for determining whether the provided rectangle lies inside the current rectangle.
   * @param top The top coordinate of the other rectangle
   * @param left The left coordinate of the other rectangle
   * @param bottom The bottom coordinate of the other rectangle
   * @param right The right coordinate of the other rectangle
   */
  public contains({ top, left, bottom, right }: Rect): boolean;
  /**
   * Predicate method for determining whether the provided point or rectangle lies inside the current rectangle.
   * @param target The point or rectangle
   */
  public contains(target: Point | Rect): boolean | ContainsPointReturn {
    if (is_point(target)) {
      const { x, y } = target;
      const is_on_top_side = y < this._top;
      const is_on_bottom_side = y > this._bottom;
      const is_on_left_side = x < this._left;
      const is_on_right_side = x > this._right;

      const result =
        !is_on_top_side &&
        !is_on_bottom_side &&
        !is_on_left_side &&
        !is_on_right_side;

      return {
        reason: {
          is_on_bottom_side,
          is_on_left_side,
          is_on_right_side,
          is_on_top_side
        },
        result
      };
    } else {
      const { top, left, bottom, right } = target;
      return (
        top >= this._top &&
        top <= this._bottom &&
        bottom >= this._top &&
        bottom <= this._bottom &&
        left >= this._left &&
        left <= this._right &&
        right >= this._left &&
        right <= this._right
      );
    }
  }

  /**
   * Predicate method for determining whether the provided rectangle intersects with the current rectangle.
   * @param rect The target rectangle
   */
  public intersects_with(rect: Rect): boolean {
    const { left: x1, top: y1, width: w1, height: h1 } = rect;
    const { left: x2, top: y2, width: w2, height: h2 } = this;
    const max_x = x1 + w1 >= x2 + w2 ? x1 + w1 : x2 + w2;
    const max_y = y1 + h1 >= y2 + h2 ? y1 + h1 : y2 + h2;
    const min_x = x1 <= x2 ? x1 : x2;
    const min_y = y1 <= y2 ? y1 : y2;
    return max_x - min_x <= w1 + w2 && max_y - min_y <= h1 + h2;
  }

  /**
   * Creates a new instance
   * @param left The optional left coordinate
   * @param top The optional top coordinate
   * @param right The optional right coordinate
   * @param bottom The optional bottom coordinate
   */
  public generate_new_rect({
    left = this.left,
    top = this.top,
    right = this.right,
    bottom = this.bottom
  }): Rect {
    return new Rect(left, top, right, bottom);
  }
}
