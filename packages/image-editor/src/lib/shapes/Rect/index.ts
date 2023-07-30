import { classRegistry } from "fabric";
import { Drawable } from "roughjs/bin/core";
import rough from "roughjs/bin/rough";

import { FillStyle, LayerType } from "../../../constants";
import { RectangleLayer } from "../../../types";
import { generateRoughOptions, getCornerRadius } from "../../../utils";
import { RectPrimitive } from "../Object";

export type RectProps = ConstructorParameters<typeof RectPrimitive>[0] &
  Omit<RectangleLayer, "id" | "_type">;

const DEFAULT_RECT_PROPS: Partial<RectProps> = {
  strokeWidth: 0,
  height: 100,
  left: 100,
  top: 100,
  width: 100,
  fill: "#969696",
  stroke: "rgba(0,0,0,0)",
  interactive: true,
  fillStyle: FillStyle.HACHURE,
  fillWeight: 1,
  hachureGap: 5,
  roughness: 0.5
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
    let rc = this.get("_rc");

    if (!rc) {
      rc = rough.canvas(ctx.canvas);
      this.set("_rc", rc);
    }

    const { width: w, height: h, rx, ry } = this;
    const x = -w / 2;
    const y = -h / 2;
    const r = getCornerRadius(Math.min(w, h), Math.max(rx, ry));
    let shape: Drawable;
    const options = generateRoughOptions(this);

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

classRegistry.setClass(Rect, RectPrimitive.type);
