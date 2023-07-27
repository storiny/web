import { Shadow } from "fabric";
import { Drawable, Options } from "roughjs/bin/core";
import rough from "roughjs/bin/rough";

import { FillStyle, LayerType, StrokeStyle } from "../../../constants";
import { RectangleLayer } from "../../../types";
import {
  getCornerRadius,
  getDashedDashArray,
  getDottedDashArray
} from "../../../utils";
import { COMMON_OBJECT_PROPS } from "../common";
import { RectPrimitive } from "../Object";

export type RectProps = ConstructorParameters<typeof RectPrimitive>[0] &
  Omit<RectangleLayer, "id" | "type">;

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
      ...COMMON_OBJECT_PROPS,
      ...DEFAULT_RECT_PROPS,
      ...rest,
      seed,
      _type: LayerType.RECTANGLE
      // shadow: new Shadow({ color: "red", offsetX: 10, blur: 2 })
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
    const rc = rough.canvas(ctx.canvas);
    const { width: w, height: h, rx, ry } = this;
    const x = -w / 2;
    const y = -h / 2;
    const r = getCornerRadius(Math.min(w, h), Math.max(rx, ry));
    let shape: Drawable;

    const options: Options = {
      seed: this.get("seed"),
      stroke: this.stroke as string,
      // For non-solid strokes, disable `multiStroke` because it tends to make
      // dashes / dots overlay over each other
      disableMultiStroke: this.get("strokeStyle") !== StrokeStyle.SOLID,
      // For non-solid strokes, increase the width a bit to make it visually
      // similar to solid strokes, as we're also disabling `multiStroke`
      strokeWidth:
        this.get("strokeStyle") !== StrokeStyle.SOLID
          ? this.strokeWidth + 0.5
          : this.strokeWidth,
      fill: this.fill as string,
      fillWeight: this.get("fillWeight"),
      fillStyle: this.get("fillStyle"),
      hachureGap: this.get("hachureGap"),
      roughness: this.get("roughness"),
      strokeLineDash:
        this.get("strokeStyle") === StrokeStyle.DASHED
          ? getDashedDashArray(this.strokeWidth)
          : this.get("strokeStyle") === StrokeStyle.DOTTED
          ? getDottedDashArray(this.strokeWidth)
          : undefined
    };

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
