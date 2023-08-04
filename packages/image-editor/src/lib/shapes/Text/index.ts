import { classRegistry } from "fabric";

import { LayerType, StrokeStyle } from "../../../constants";
import { TextLayer } from "../../../types";
import { TextPrimitive } from "../Object";

export type TextProps = ConstructorParameters<typeof TextPrimitive>[1] &
  Omit<TextLayer, "id" | "_type">;

const DEFAULT_TEXT_PROPS: Partial<TextProps> = {
  interactive: true,
  strokeStyle: StrokeStyle.SOLID
};

export class Text extends TextPrimitive {
  static override type = LayerType.TEXT;

  /**
   * Ctor
   * @param props Text props
   */
  constructor(props: TextProps) {
    super(props.text, {
      ...DEFAULT_TEXT_PROPS,
      ...props,
      _type: LayerType.TEXT,
      objectCaching: true
    });
  }

  /**
   * Returns the layer type
   */
  static getType(): LayerType.TEXT {
    return LayerType.TEXT;
  }
}

classRegistry.setClass(Text, LayerType.TEXT);
