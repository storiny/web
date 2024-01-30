import { classRegistry as class_registry } from "fabric";

import { LayerType } from "../../../constants";
import { TextLayer } from "../../../types";
import { get_css_variable_value } from "../../../utils";
import { TextPrimitive } from "../object";

export type TextProps = ConstructorParameters<typeof TextPrimitive>[1] &
  Omit<TextLayer, "id" | "_type">;

const DEFAULT_FONT_FAMILY = get_css_variable_value("--font-satoshi");
export const DEFAULT_FONT_SIZE = 24;
export const DEFAULT_LINE_HEIGHT = 1.16;
export const DEFAULT_LETTER_SPACING = 0;

const DEFAULT_TEXT_PROPS: Partial<TextProps> = {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  interactive: true,
  cursorDelay: 1060,
  cursorDuration: 500,
  editingBorderColor: "#1371ec",
  fontFamily: DEFAULT_FONT_FAMILY,
  fontWeight: "400",
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT,
  charSpacing: DEFAULT_LETTER_SPACING
  /* eslint-enable prefer-snakecase/prefer-snakecase */
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
