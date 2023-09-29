import { classRegistry as class_registry, Point } from "fabric";
import { RoughCanvas } from "roughjs/bin/canvas";
import rough from "roughjs/bin/rough";

import {
  DEFAULT_LAYER_COLOR,
  LayerType,
  StrokeStyle
} from "../../../constants";
import { LineLayer } from "../../../types";
import { generate_rough_options } from "../../../utils";
import { LinePrimitive } from "../object";

export type LineProps = ConstructorParameters<typeof LinePrimitive>[1] &
  Omit<LineLayer, "id" | "_type">;

const DEFAULT_LINE_PROPS: Partial<LineProps> = {
  interactive: true,
  stroke: DEFAULT_LAYER_COLOR,
  strokeStyle: StrokeStyle.SOLID,
  strokeWidth: 1,
  hachureGap: 5,
  roughness: 1
};

export class Line extends LinePrimitive<LineProps> {
  /**
   * Ctor
   * @param props Line props
   */
  constructor(props: LineProps) {
    const { seed = rough.newSeed(), ...rest } = props;
    super([props.x1, props.y1, props.x2, props.y2], {
      ...DEFAULT_LINE_PROPS,
      ...rest,
      seed,
      _type: LayerType.LINE,
      lockScalingX: true,
      lockScalingY: true
    });
  }

  /**
   * Layer type
   */
  static override type = LayerType.LINE;

  /**
   * Returns the layer type
   */
  static getType(): LayerType.LINE {
    return LayerType.LINE;
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

    const { x1, y1, x2, y2 } = this;
    const mid_point = new Point(x1, y1).midPointFrom({
      x: x2,
      y: y2
    });
    const shape = rc.line(
      x1 - mid_point.x,
      y1 - mid_point.y,
      x2 - mid_point.x,
      y2 - mid_point.y,
      generate_rough_options(this)
    );

    ctx.save();
    rc.draw(shape);
    ctx.restore();
  }
}

class_registry.setClass(Line, LayerType.LINE);
