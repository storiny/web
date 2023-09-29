import { classRegistry as class_registry } from "fabric";
import { ITextProps } from "fabric/src/shapes/IText/IText";

import { LayerType } from "../../../constants";
import { TextLayer } from "../../../types";
import { TextPrimitive } from "../object";

export type TextProps = Partial<ITextProps> & Omit<TextLayer, "id" | "_type">;

const DEFAULT_TEXT_PROPS: Partial<TextProps> = {
  interactive: true,
  ["cursorDelay" as any]: 1750,
  ["cursorDuration" as any]: 500
};

// TODO: Implement

export class Text extends TextPrimitive {
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
   * Layer type
   */
  static override type = LayerType.TEXT;

  /**
   * Returns the layer type
   */
  static getType(): LayerType.TEXT {
    return LayerType.TEXT;
  }
}

class_registry.setClass(Text, LayerType.TEXT);
