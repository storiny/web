import {
  BaseBrush,
  Canvas,
  classRegistry,
  Point,
  Shadow,
  TEvent
} from "fabric";
import { getStroke, StrokeOptions } from "perfect-freehand";

import { LayerType } from "../../../constants";
import { PenLayer } from "../../../types";
import { PenPrimitive } from "../Object";

export type PenProps = ConstructorParameters<typeof PenPrimitive>[1] &
  Omit<PenLayer, "id" | "_type">;

const DEFAULT_PEN_PROPS: Partial<PenProps> = {
  interactive: true,
  stroke: "rgba(0,0,0,1)",
  strokeWidth: 1
};

// Trim SVG path data so numbers are rounded to two decimal points each
const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;

/**
 * Returns a new array containing the medians of the corresponding elements
 * from arrays A and B
 * @param A Array
 * @param B Another array
 */
const med = (A: number[], B: number[]): [number, number] => [
  (A[0] + B[0]) / 2,
  (A[1] + B[1]) / 2
];

/**
 * Generates an SVG path from stroke
 * @param points Points returned from `getStroke`
 */
const getSvgPathFromStroke = (points: number[][]): string => {
  if (!points.length) {
    return "";
  }

  const max = points.length - 1;

  return points
    .reduce(
      (acc, point, i, arr) => {
        if (i === max) {
          acc.push(point, med(point, arr[0]), "L", arr[0], "Z");
        } else {
          acc.push(point, med(point, arr[i + 1]));
        }

        return acc;
      },
      ["M", points[0], "Q"]
    )
    .join(" ")
    .replace(TO_FIXED_PRECISION, "$1");
};

/**
 * Returns SVG path from points
 * @param points Captured points array
 * @param options Options
 */
const getSvgPathFromPoints = (
  points: Point[],
  options?: StrokeOptions & { strokeWidth: number }
): string =>
  getSvgPathFromStroke(
    getStroke(points, {
      thinning: 0.6,
      smoothing: 0.5,
      streamline: 0.5,
      ...options,
      simulatePressure: true,
      size: (options?.strokeWidth || 1) * 4.25,
      easing: (t) => Math.sin((t * Math.PI) / 2) // https://easings.net/#easeOutSine
    })
  );

export class PenBrush extends BaseBrush {
  /**
   * Array of points captured during mouse movements
   */
  public points: Point[];
  /**
   * Boolean flag indicating wether the temporary drawing has finished
   * (mouse-up event), and the drawing needs to be off-loaded to the
   * main canvas
   */
  public hasCommittedLastPoint: boolean;

  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    super(canvas);
    this.points = [];
    this.hasCommittedLastPoint = false;
  }

  /**
   * Handles mouse-down event
   * @param pointer Pointer
   * @param e Event
   */
  onMouseDown(pointer: Point, { e }: TEvent): void {
    if (!this.canvas._isMainEvent(e)) {
      return;
    }

    this.hasCommittedLastPoint = false;
    this.prepareForDrawing(pointer);
    // Capture coordinates immediately, allowing to
    // draw dots (when the movement never occurs)
    this.addPoint(pointer);
    this._render();
  }

  /**
   * Handles the mouse-move event
   * @param pointer Pointer
   * @param e Event
   */
  onMouseMove(pointer: Point, { e }: TEvent): void {
    if (
      !this.canvas._isMainEvent(e) ||
      (this.limitedToCanvasSize && this._isOutSideCanvas(pointer))
    ) {
      return;
    }

    if (this.addPoint(pointer) && this.points.length > 1) {
      this.canvas.clearContext(this.canvas.contextTop);
      this._render();
    }
  }

  /**
   * Handles the mouse-up event
   * @param e Event
   */
  onMouseUp({ e }: TEvent): boolean {
    if (!this.canvas._isMainEvent(e)) {
      return true;
    }

    this.hasCommittedLastPoint = true;
    this.finalizeAndAddPath();

    return false;
  }

  /**
   * Prepares the tool for drawing
   * @param pointer Actual mouse position related to the canvas
   * @private
   */
  private prepareForDrawing(pointer: Point): void {
    this.reset();
    this.addPoint(pointer);
    this.canvas.contextTop.moveTo(pointer.x, pointer.y);
  }

  /**
   * Adds a new point to the `points` array. Returns `true` if the point was added,
   * false otherwise
   * @param point Point to add
   * @private
   */
  private addPoint(point: Point): boolean {
    if (
      this.points.length > 1 &&
      point.eq(this.points[this.points.length - 1])
    ) {
      return false;
    }

    this.points.push(point);
    return true;
  }

  /**
   * Clears the `points` array and sets `contextTop` canvas style
   * @private
   */
  private reset(): void {
    this.points.length = 0;
    this._setBrushStyles(this.canvas.contextTop);
    this._setShadow();
  }

  /**
   * Renders the points temporarily on the top canvas
   * @param ctx Rendering context
   */
  _render(ctx: CanvasRenderingContext2D = this.canvas.contextTop): void {
    this._saveAndTransform(ctx);
    ctx.fill(new Path2D(this.getSvgPathData()));
    ctx.restore();
  }

  /**
   * Creates a path object using path data
   * @private
   */
  private createPath(): Pen {
    const path = new Pen({
      points: this.points,
      fill: this.color,
      stroke: null
    });

    if (this.shadow) {
      this.shadow.affectStroke = true;
      path.shadow = new Shadow(this.shadow);
    }

    return path;
  }

  /**
   * Generates and returns the SVG path data generated using the caputred points
   * @private
   */
  private getSvgPathData(): string {
    return getSvgPathFromPoints(this.points, {
      last: this.hasCommittedLastPoint,
      strokeWidth: this.strokeWidth || 1
    });
  }

  /**
   * Converts the temporary path drawm on the `contextTop` canvas to a path object using
   * the points captured during the mouse movements, and adds it to the main canvas
   * @private
   */
  private finalizeAndAddPath(): void {
    const path = this.createPath();
    path.left += path.width / 2;
    path.top += path.height / 2;

    this.canvas.clearContext(this.canvas.contextTop);
    //    this.canvas.fire("before:path:created", { path });
    this.canvas.add(path);
    this.canvas.requestRenderAll();

    path.setCoords();
    this._resetShadow();

    //    this.canvas.fire("path:created", { path });
  }
}

export class Pen extends PenPrimitive<PenProps> {
  static type = LayerType.PEN;

  /**
   * Ctor
   * @param props Pen props
   */
  constructor(props: PenProps) {
    super(
      getSvgPathFromPoints(props.points, {
        last: true,
        strokeWidth: props.strokeWidth || 1
      }),
      {
        ...DEFAULT_PEN_PROPS,
        ...props,
        _type: LayerType.PEN,
        objectCaching: true
      }
    );
  }

  /**
   * Returns the layer type
   */
  static getType(): LayerType.PEN {
    return LayerType.PEN;
  }

  private getPathData(): string {
    const points = this.get("points");
    return getSvgPathFromPoints(points, {
      last: true,
      strokeWidth: this.strokeWidth || 1
    });
  }

  /**
   * Renders shape
   * @param ctx Canvas context
   */
  _render(ctx: CanvasRenderingContext2D): void {
    this._setPath(this.getPathData());
    super._render.apply(this, [ctx]);
  }
}

classRegistry.setClass(Pen, LayerType.PEN);
