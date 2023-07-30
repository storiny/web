import { classRegistry } from "fabric";
import rough from "roughjs/bin/rough";

import { FillStyle, LayerType } from "../../../constants";
import { EllipseLayer } from "../../../types";
import { generateRoughOptions } from "../../../utils";
import { EllipsePrimitive } from "../Object";

export type EllipseProps = ConstructorParameters<typeof EllipsePrimitive>[0] &
  Omit<EllipseLayer, "id" | "_type">;

const DEFAULT_ELLIPSE_PROPS: Partial<EllipseProps> = {
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

export class Ellipse extends EllipsePrimitive<EllipseProps> {
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
    let rc = this.get("_rc");

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

classRegistry.setClass(Ellipse, EllipsePrimitive.type);
