import { classRegistry } from "fabric";
import { RoughCanvas } from "roughjs/bin/canvas";
import rough from "roughjs/bin/rough";

import {
  DEFAULT_LAYER_COLOR,
  FillStyle,
  LayerType,
  StrokeStyle
} from "../../../constants";
import { EllipseLayer } from "../../../types";
import { generateRoughOptions } from "../../../utils";
import { EllipsePrimitive } from "../Object";

export type EllipseProps = ConstructorParameters<typeof EllipsePrimitive>[0] &
  Omit<EllipseLayer, "id" | "_type">;

const DEFAULT_ELLIPSE_PROPS: Partial<EllipseProps> = {
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

export class Ellipse extends EllipsePrimitive<EllipseProps> {
  static override type = LayerType.ELLIPSE;

  /**
   * Ctor
   * @param props Ellipse props
   */
  constructor(props: EllipseProps) {
    const { seed = rough.newSeed(), ...rest } = props;
    super({
      ...DEFAULT_ELLIPSE_PROPS,
      ...rest,
      seed,
      _type: LayerType.ELLIPSE
    });
  }

  /**
   * Returns the layer type
   */
  static getType(): LayerType.ELLIPSE {
    return LayerType.ELLIPSE;
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

    const { width: w, height: h } = this;

    ctx.save();
    rc.draw(rc.ellipse(0, 0, w, h, generateRoughOptions(this)));
    ctx.restore();
  }
}

classRegistry.setClass(Ellipse, LayerType.ELLIPSE);
