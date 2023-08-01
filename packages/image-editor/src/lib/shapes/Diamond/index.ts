import { BaseFabricObject, classRegistry } from "fabric";
import { Drawable } from "roughjs/bin/core";
import rough from "roughjs/bin/rough";

import { FillStyle, LayerType, StrokeStyle } from "../../../constants";
import { DiamondLayer } from "../../../types";
import { generateRoughOptions, getCornerRadius } from "../../../utils";
import { DiamondPrimitve } from "../Object";

export type DiamondProps = ConstructorParameters<typeof DiamondPrimitve>[0] &
  Omit<DiamondLayer, "id" | "_type">;

const DEFAULT_DIAMOND_PROPS: Partial<DiamondProps> = {
  interactive: true,
  fill: "rgba(0,0,0,0)",
  stroke: "rgba(0,0,0,1)",
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
const getDiamondPoints = (
  object: BaseFabricObject
): [number, number, number, number, number, number, number, number] => {
  const topX = 0;
  const topY = -object.height / 2;
  const rightX = object.width / 2;
  const rightY = 0;
  const bottomX = 0;
  const bottomY = object.height / 2;
  const leftX = -object.width / 2;
  const leftY = 0;

  return [topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY];
};

export class Diamond extends DiamondPrimitve<DiamondProps> {
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
   * Object type
   */
  static type = LayerType.DIAMOND;

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
   * Returns the layer type
   */
  static getType(): LayerType.DIAMOND {
    return LayerType.DIAMOND;
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

    let shape: Drawable;
    const [topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY] =
      getDiamondPoints(this);

    if (Math.max(this.rx || this.ry) > 0) {
      const verticalRadius = getCornerRadius(Math.abs(topX - leftX), this.ry);
      const horizontalRadius = getCornerRadius(
        Math.abs(rightY - topY),
        this.rx
      );

      shape = rc.path(
        `M ${topX + verticalRadius} ${topY + horizontalRadius} L ${
          rightX - verticalRadius
        } ${rightY - horizontalRadius}
            C ${rightX} ${rightY}, ${rightX} ${rightY}, ${
          rightX - verticalRadius
        } ${rightY + horizontalRadius}
            L ${bottomX + verticalRadius} ${bottomY - horizontalRadius}
            C ${bottomX} ${bottomY}, ${bottomX} ${bottomY}, ${
          bottomX - verticalRadius
        } ${bottomY - horizontalRadius}
            L ${leftX + verticalRadius} ${leftY + horizontalRadius}
            C ${leftX} ${leftY}, ${leftX} ${leftY}, ${leftX + verticalRadius} ${
          leftY - horizontalRadius
        }
            L ${topX - verticalRadius} ${topY + horizontalRadius}
            C ${topX} ${topY}, ${topX} ${topY}, ${topX + verticalRadius} ${
          topY + horizontalRadius
        }`,
        generateRoughOptions(this, true)
      );
    } else {
      shape = rc.polygon(
        [
          [topX, topY],
          [rightX, rightY],
          [bottomX, bottomY],
          [leftX, leftY]
        ],
        generateRoughOptions(this)
      );
    }

    ctx.save();
    rc.draw(shape);
    ctx.restore();
  }
}

classRegistry.setClass(Diamond, LayerType.DIAMOND);
