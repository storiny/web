import { classRegistry as class_registry } from "fabric";

import { LayerType } from "../../../constants";
import { TextLayer } from "../../../types";
import { TextPrimitive } from "../object";

export type TextProps = ConstructorParameters<typeof TextPrimitive>[1] &
  Omit<TextLayer, "id" | "_type">;

const DEFAULT_TEXT_PROPS: Partial<TextProps> = {
  interactive: true,
  ["cursorDelay" as any]: 1060,
  ["cursorDuration" as any]: 500
};

export class Text extends TextPrimitive<TextProps> {
  /**
   * Ctor
   * @param text The text value
   * @param props Text props
   */
  constructor(text: string, props: TextProps) {
    super(text, {
      ...DEFAULT_TEXT_PROPS,
      ...props,
      _type: LayerType.TEXT,
      objectCaching: true
    });

    this.on("mousedblclick", () => {
      this.editable = true;
      this.enterEditing();
      this.hiddenTextarea?.focus();
    });

    this.on("deselected", () => {
      this.editable = false;
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
