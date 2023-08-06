import { classRegistry, Point } from "fabric";
import { RoughCanvas } from "roughjs/bin/canvas";
import rough from "roughjs/bin/rough";

import {
  DEFAULT_LAYER_COLOR,
  LayerType,
  StrokeStyle
} from "../../../constants";
import { LineLayer } from "../../../types";
import { generateRoughOptions } from "../../../utils";
import { LinePrimitive } from "../Object";

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
  static override type = LayerType.LINE;

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
    const midPoint = new Point(x1, y1).midPointFrom({
      x: x2,
      y: y2
    });
    const shape = rc.line(
      x1 - midPoint.x,
      y1 - midPoint.y,
      x2 - midPoint.x,
      y2 - midPoint.y,
      generateRoughOptions(this)
    );

    ctx.save();
    rc.draw(shape);
    ctx.restore();
  }
}

classRegistry.setClass(Line, LayerType.LINE);
