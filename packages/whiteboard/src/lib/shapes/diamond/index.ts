import { BaseFabricObject, classRegistry as class_registry } from "fabric";
import { RoughCanvas } from "roughjs/bin/canvas";
import { Drawable } from "roughjs/bin/core";
import rough from "roughjs/bin/rough";

import {
  DEFAULT_LAYER_COLOR,
  FillStyle,
  LayerType,
  StrokeStyle
} from "../../../constants";
import { DiamondLayer } from "../../../types";
import { generate_rough_options, get_corner_radius } from "../../../utils";
import { DiamondPrimitve } from "../object";

export type DiamondProps = ConstructorParameters<typeof DiamondPrimitve>[0] &
  Omit<DiamondLayer, "id" | "_type">;

const DEFAULT_DIAMOND_PROPS: Partial<DiamondProps> = {
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

/**
 * Returns the diamond shape end points
 * @param object Object
 */
const get_diamond_points = (
  object: BaseFabricObject
): [number, number, number, number, number, number, number, number] => {
  const top_x = 0;
  const top_y = -object.height / 2;
  const right_x = object.width / 2;
  const right_y = 0;
  const bottom_x = 0;
  const bottom_y = object.height / 2;
  const left_x = -object.width / 2;
  const left_y = 0;
  return [top_x, top_y, right_x, right_y, bottom_x, bottom_y, left_x, left_y];
};

export class Diamond extends DiamondPrimitve<DiamondProps> {
  /**
   * Ctor
   * @param props Diamond props
   */
  constructor(props: DiamondProps) {
    const { seed = rough.newSeed(), ...rest } = props;
    super({
      ...DEFAULT_DIAMOND_PROPS,
      ...rest,
      seed,
      _type: LayerType.DIAMOND
    });
  }

  /**
   * Layer type
   */
  static override type = LayerType.DIAMOND;

  /**
   * Returns the layer type
   */
  static getType(): LayerType.DIAMOND {
    return LayerType.DIAMOND;
  }

  /**
   * Radius X
   * @private
   */
  private readonly rx: number = 0;
  /**
   * Radius Y
   * @private
   */
  private readonly ry: number = 0;

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

    let shape: Drawable;
    const [top_x, top_y, right_x, right_y, bottom_x, bottom_y, left_x, left_y] =
      get_diamond_points(this);

    if (Math.max(this.rx || this.ry) > 0) {
      const vertical_radius = get_corner_radius(
        Math.abs(top_x - left_x),
        this.ry
      );
      const horizontal_radius = get_corner_radius(
        Math.abs(right_y - top_y),
        this.rx
      );

      shape = rc.path(
        `M ${top_x + vertical_radius} ${top_y + horizontal_radius} L ${
          right_x - vertical_radius
        } ${right_y - horizontal_radius}
            C ${right_x} ${right_y}, ${right_x} ${right_y}, ${
          right_x - vertical_radius
        } ${right_y + horizontal_radius}
            L ${bottom_x + vertical_radius} ${bottom_y - horizontal_radius}
            C ${bottom_x} ${bottom_y}, ${bottom_x} ${bottom_y}, ${
          bottom_x - vertical_radius
        } ${bottom_y - horizontal_radius}
            L ${left_x + vertical_radius} ${left_y + horizontal_radius}
            C ${left_x} ${left_y}, ${left_x} ${left_y}, ${
          left_x + vertical_radius
        } ${left_y - horizontal_radius}
            L ${top_x - vertical_radius} ${top_y + horizontal_radius}
            C ${top_x} ${top_y}, ${top_x} ${top_y}, ${
          top_x + vertical_radius
        } ${top_y + horizontal_radius}`,
        generate_rough_options(this, true)
      );
    } else {
      shape = rc.polygon(
        [
          [top_x, top_y],
          [right_x, right_y],
          [bottom_x, bottom_y],
          [left_x, left_y]
        ],
        generate_rough_options(this)
      );
    }

    ctx.save();
    rc.draw(shape);
    ctx.restore();
  }
}

class_registry.setClass(Diamond, LayerType.DIAMOND);
