import { classRegistry as class_registry, Point } from "fabric";
import { RoughCanvas } from "roughjs/bin/canvas";
import { Drawable, Op, Options } from "roughjs/bin/core";
import rough from "roughjs/bin/rough";

import {
  Arrowhead,
  DEFAULT_LAYER_COLOR,
  FillStyle,
  LayerType,
  StrokeStyle
} from "../../../constants";
import { ArrowLayer } from "../../../types";
import { generate_rough_options, get_dotted_dash_array } from "../../../utils";
import { ArrowPrimitive } from "../object";

export type ArrowProps = ConstructorParameters<typeof ArrowPrimitive>[1] &
  Omit<ArrowLayer, "id" | "_type"> & {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  };

const DEFAULT_ARROW_PROPS: Partial<ArrowProps> = {
  interactive: true,
  fill: "rgba(0,0,0,0)",
  stroke: DEFAULT_LAYER_COLOR,
  strokeStyle: StrokeStyle.SOLID,
  startArrowhead: Arrowhead.NONE,
  endArrowhead: Arrowhead.ARROW,
  strokeWidth: 1,
  hachureGap: 5,
  roughness: 1
};

/**
 * Returns the curve path operations
 * @param shape Shape
 */
export const get_curve_path_ops = (shape: Drawable): Op[] => {
  for (const set of shape.sets) {
    if (set.type === "path") {
      return set.ops;
    }
  }

  return shape.sets[0].ops;
};

/**
 * Rotates a line segment around a point using the specified angle
 * @see https://math.stackexchange.com/questions/2204520/how-do-i-rotate-a-line-segment-in-a-specific-point-on-the-line
 * @param x1 X1
 * @param y1 Y1
 * @param x2 X2
 * @param y2 Y2
 * @param angle Angle
 */
export const rotate = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  angle: number
): [number, number] =>
  // eslint-disable-next-line capitalized-comments
  /**
   * a'x = (ax − cx)cosθ − (ay - cy)sinθ + cx
   * a'y = (ax − cx)sinθ + (ay − cy)cosθ + cy
   */
  [
    (x1 - x2) * Math.cos(angle) - (y1 - y2) * Math.sin(angle) + x2,
    (x1 - x2) * Math.sin(angle) + (y1 - y2) * Math.cos(angle) + y2
  ];

export class Arrow extends ArrowPrimitive<ArrowProps> {
  /**
   * Ctor
   * @param props Arrow props
   */
  constructor(props: ArrowProps) {
    const { seed = rough.newSeed(), ...rest } = props;
    super([props.x1, props.y1, props.x2, props.y2], {
      ...DEFAULT_ARROW_PROPS,
      ...rest,
      seed,
      _type: LayerType.ARROW,
      lockScalingX: true,
      lockScalingY: true
    });
  }

  /**
   * Layer type
   */
  static override type = LayerType.ARROW;

  /**
   * Returns the layer type
   */
  static getType(): LayerType.ARROW {
    return LayerType.ARROW;
  }

  /**
   * Computes the arrowhead points for an arrowhead type
   * @param shapes Shapes
   * @param position Position
   * @param arrowhead Arrowhead
   * @private
   */
  private get_arrowhead_points(
    shapes: Drawable[],
    position: "start" | "end",
    arrowhead: Exclude<Arrowhead, Arrowhead.NONE>
  ): number[] | null {
    const ops = get_curve_path_ops(shapes[0]);

    if (ops.length < 1) {
      return null;
    }

    // The index of the `bCurve` operation to examine.
    const index = position === "start" ? 1 : ops.length - 1;
    const data = ops[index].data;
    const p3 = [data[4], data[5]];
    const p2 = [data[2], data[3]];
    const p1 = [data[0], data[1]];

    // We need to find `p0` of the bézier curve.
    // It is typically the last point of the previous curve; it can also be the
    // position of `moveTo` operation
    const prev_op = ops[index - 1];
    let p0 = [0, 0];

    if (prev_op.op === "move") {
      p0 = prev_op.data;
    } else if (prev_op.op === "bcurveTo") {
      p0 = [prev_op.data[4], prev_op.data[5]];
    }

    // B(t) = p0 * (1-t)^3 + 3p1 * t * (1-t)^2 + 3p2 * t^2 * (1-t) + p3 * t^3
    const equation = (t: number, idx: number): number =>
      Math.pow(1 - t, 3) * p3[idx] +
      3 * t * Math.pow(1 - t, 2) * p2[idx] +
      3 * Math.pow(t, 2) * (1 - t) * p1[idx] +
      p0[idx] * Math.pow(t, 3);

    // We know the last point of the arrow (or the first, in case of start
    // arrowhead)
    const [x2, y2] = position === "start" ? p0 : p3;

    // By using cubic bezier equation (B(t)) and the given parameters, we
    // calculate a point that is closer to the last point. The value 0.3 is
    // chosen arbitrarily, and it works best for all the tested cases
    const [x1, y1] = [equation(0.3, 0), equation(0.3, 1)];

    // Find the normalized direction vector based on the previously calculated
    // points
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const nx = (x2 - x1) / distance;
    const ny = (y2 - y1) / distance;
    const size = {
      [Arrowhead.ARROW]: 30,
      [Arrowhead.BAR]: 15,
      [Arrowhead.DOT]: 15,
      [Arrowhead.TRIANGLE]: 15
    }[arrowhead]; // (px)

    let length = 0;

    if (arrowhead === Arrowhead.ARROW) {
      // Length for arrow arrowheads is based on the length of the last section
      const cx = this.get("x1");
      const px = this.get("x2");
      const cy = this.get("y1");
      const py = this.get("y2");

      length = Math.hypot(cx - px, cy - py);
    } else {
      // Length for other arrowheads is based on the total length of the line
      const cx = this.get("x1");
      const px = this.get("x2");
      const cy = this.get("y1");
      const py = this.get("y2");

      length += Math.hypot(cx - px, cy - py);
    }

    // Scale down the arrowhead until we hit a certain size so that it doesn't
    // look weird. This value is selected by minimizing a minimum size with the
    // last segment of the arrowhead
    const min_size = Math.min(size, length / 2);
    const xs = x2 - nx * min_size;
    const ys = y2 - ny * min_size;

    if (arrowhead === Arrowhead.DOT) {
      const r = Math.hypot(ys - y2, xs - x2) + this.strokeWidth;
      return [x2, y2, r];
    }

    const angle = {
      [Arrowhead.ARROW]: 20,
      [Arrowhead.BAR]: 90,
      [Arrowhead.TRIANGLE]: 25
    }[arrowhead]; // (degrees)

    const [x3, y3] = rotate(xs, ys, x2, y2, (-angle * Math.PI) / 180);
    const [x4, y4] = rotate(xs, ys, x2, y2, (angle * Math.PI) / 180);
    return [x2, y2, x3, y3, x4, y4];
  }

  /**
   * Returns arrowhead shapes
   * @param rc Rough canvas
   * @param shapes Shapes
   * @param position Arrowhead position
   * @param arrowhead Arrowhead
   * @param options Options
   * @private
   */
  private get_arrowhead_shapes(
    rc: RoughCanvas,
    shapes: Drawable[],
    position: "start" | "end",
    arrowhead: Exclude<Arrowhead, Arrowhead.NONE>,
    options: Options
  ): Drawable[] {
    const arrowhead_points = this.get_arrowhead_points(
      shapes,
      position,
      arrowhead
    );

    if (arrowhead_points === null) {
      return [];
    }

    if (arrowhead === Arrowhead.DOT) {
      const [x, y, r] = arrowhead_points;
      return [
        rc.circle(x, y, r, {
          ...options,
          fill: this.stroke as string,
          fillStyle: FillStyle.SOLID,
          stroke: "none"
        })
      ];
    }

    if (arrowhead === Arrowhead.TRIANGLE) {
      const [x, y, x2, y2, x3, y3] = arrowhead_points;
      // Use solid stroke for triangle arrowhead
      delete options.strokeLineDash;
      return [
        rc.polygon(
          [
            [x, y],
            [x2, y2],
            [x3, y3],
            [x, y]
          ],
          {
            ...options,
            fill: this.stroke as string,
            fillStyle: FillStyle.SOLID
          }
        )
      ];
    }

    // Arrow arrowheads
    const [x2, y2, x3, y3, x4, y4] = arrowhead_points;

    if (this.get("strokeStyle") === StrokeStyle.DOTTED) {
      // For dotted arrows caps, reduce the gap to make it more legible
      const dash = get_dotted_dash_array(this.strokeWidth - 1);
      options.strokeLineDash = [dash[0], dash[1] - 1];
    } else {
      // For solid / dashed, keep solid arrow cap
      delete options.strokeLineDash;
    }

    return [rc.line(x3, y3, x2, y2, options), rc.line(x4, y4, x2, y2, options)];
  }

  /**
   * Renders shape
   * @param ctx Canvas context
   */
  _render(ctx: CanvasRenderingContext2D): void {
    let rc: RoughCanvas = this.get("_rc");

    if (!rc) {
      rc = rough.canvas(ctx.canvas);
      this.set("_rc", rc);
    }

    const options = generate_rough_options(this);
    const startArrowhead = this.get("startArrowhead") as Arrowhead;
    const endArrowhead = this.get("endArrowhead") as Arrowhead;
    const { x1, y1, x2, y2 } = this;
    const mid_point = new Point(x1, y1).midPointFrom({
      x: x2,
      y: y2
    });
    const shapes: Drawable[] = [
      rc.line(
        x1 - mid_point.x,
        y1 - mid_point.y,
        x2 - mid_point.x,
        y2 - mid_point.y,
        generate_rough_options(this)
      )
    ];

    if (startArrowhead !== Arrowhead.NONE) {
      shapes.push(
        ...this.get_arrowhead_shapes(
          rc,
          shapes,
          "start",
          startArrowhead,
          options
        )
      );
    }

    if (endArrowhead !== Arrowhead.NONE) {
      shapes.push(
        ...this.get_arrowhead_shapes(rc, shapes, "end", endArrowhead, options)
      );
    }

    ctx.save();

    for (const shape of shapes) {
      rc.draw(shape);
    }

    ctx.restore();
  }
}

class_registry.setClass(Arrow, LayerType.ARROW);
