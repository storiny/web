import { classRegistry as class_registry } from "fabric";

import { LayerType } from "../../../constants";
import { ImageLayer } from "../../../types";
import { ImagePrimitive } from "../object";

export type ImageProps = ConstructorParameters<typeof ImagePrimitive>[1] &
  Omit<ImageLayer, "id" | "_type">;

const DEFAULT_IMAGE_PROPS: Partial<ImageProps> = {
  interactive: true,
  stroke: "rgba(0,0,0,0)"
};

export class Image extends ImagePrimitive<ImageProps> {
  /**
   * Ctor
   * @param src Image SRC
   * @param props Image props
   */
  constructor(src: string, props: ImageProps) {
    super(src, {
      ...DEFAULT_IMAGE_PROPS,
      ...props,
      src,
      _type: LayerType.IMAGE,
      objectCaching: true
    });
  }

  /**
   * Layer type
   */
  static override type = LayerType.IMAGE;

  /**
   * Returns the layer type
   */
  static getType(): LayerType.IMAGE {
    return LayerType.IMAGE;
  }
}

class_registry.setClass(Image, LayerType.IMAGE);
