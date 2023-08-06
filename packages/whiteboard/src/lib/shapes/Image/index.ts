import { classRegistry } from "fabric";

import { LayerType } from "../../../constants";
import { ImageLayer } from "../../../types";
import { ImagePrimitive } from "../Object";

export type ImageProps = ConstructorParameters<typeof ImagePrimitive>[1] &
  Omit<ImageLayer, "id" | "_type">;

const DEFAULT_IMAGE_PROPS: Partial<ImageProps> = {
  interactive: true,
  stroke: "rgba(0,0,0,0)"
};

export class Image extends ImagePrimitive<ImageProps> {
  static override type = LayerType.IMAGE;

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
   * Returns the layer type
   */
  static getType(): LayerType.IMAGE {
    return LayerType.IMAGE;
  }
}

classRegistry.setClass(Image, LayerType.IMAGE);
