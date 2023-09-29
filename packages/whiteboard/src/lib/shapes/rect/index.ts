import { classRegistry as class_registry } from "fabric";
import { RoughCanvas } from "roughjs/bin/canvas";
import { Drawable } from "roughjs/bin/core";
import rough from "roughjs/bin/rough";

import {
  DEFAULT_LAYER_COLOR,
  FillStyle,
  LayerType,
  StrokeStyle
} from "../../../constants";
import { RectangleLayer } from "../../../types";
import { generate_rough_options, get_corner_radius } from "../../../utils";
import { RectPrimitive } from "../object";

export type RectProps = ConstructorParameters<typeof RectPrimitive>[0] &
  Omit<RectangleLayer, "id" | "_type">;

const DEFAULT_RECT_PROPS: Partial<RectProps> = {
  interactive: true,
  fill: "rgba(0,0,0,0)",
  stroke: DEFAULT_LAYER_COLOR,
  fillStyle: FillStyle.HACHURE,
  strokeStyle: StrokeStyle.SOLID,
  fillWeight: 1,
  strokeWidth: 1,
  hachureGap: 5,
  roughness: 1
};

export class Rect extends RectPrimitive<RectProps> {
  /**
   * Ctor
   * @param props Rectangle props
   */
  constructor(props: RectProps) {
    const { seed = rough.newSeed(), ...rest } = props;
    super({
      ...DEFAULT_RECT_PROPS,
      ...rest,
      seed,
      _type: LayerType.RECTANGLE
    });
  }

  /**
   * Layer type
   */
  static override type = LayerType.RECTANGLE;

  /**
   * Returns the layer type
   */
  static getType(): LayerType.RECTANGLE {
    return LayerType.RECTANGLE;
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

    const { width: w, height: h, rx, ry } = this;
    const x = -w / 2;
    const y = -h / 2;
    const r = get_corner_radius(Math.min(w, h), Math.max(rx, ry));
    let shape: Drawable;
    const options = generate_rough_options(this);

    if (r > 0) {
      shape = rc.path(
        `M ${x + r} ${y} L ${x + (w - r)} ${y} Q ${x + w} ${y}, ${x + w} ${
          y + r
        } L ${x + w} ${y + (h - r)} Q ${x + w} ${y + h}, ${x + (w - r)} ${
          y + h
        } L ${x + r} ${y + h} Q ${x} ${y + h}, ${x} ${y + (h - r)} L ${x} ${
          y + r
        } Q ${x} ${y}, ${x + r} ${y}`,
        {
          ...options,
          preserveVertices: true
        }
      );
    } else {
      shape = rc.rectangle(x, y, w, h, options);
    }

    ctx.save();
    rc.draw(shape);
    ctx.restore();
  }
}

class_registry.setClass(Rect, LayerType.RECTANGLE);
