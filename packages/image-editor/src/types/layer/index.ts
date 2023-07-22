import {
  LayerType,
  StrokeStyle,
  TextAlign,
  VerticalAlign
} from "../../constants";

export type Layer =
  | PenLayer
  | PolygonLayer
  | RectangleLayer
  | EllipseLayer
  | LineLayer
  | ArrowLayer
  | ImageLayer
  | TextLayer;

type LayerPrimitive<T extends LayerType> = {
  cornerRadius: number;
  fill: string | null;
  height: number;
  hidden: boolean;
  id: string;
  locked: boolean;
  name: string;
  opacity: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  selected: boolean;
  strokeColor: string;
  strokeStyle: StrokeStyle;
  strokeWidth: number;
  type: T;
  width: number;
  x: number;
  y: number;
};

export type PenLayer = LayerPrimitive<LayerType.PEN>;
export type PolygonLayer = LayerPrimitive<LayerType.POLYGON>;
export type RectangleLayer = LayerPrimitive<LayerType.RECTANGLE>;
export type EllipseLayer = LayerPrimitive<LayerType.ELLIPSE>;
export type LineLayer = LayerPrimitive<LayerType.LINE>;
export type ArrowLayer = LayerPrimitive<LayerType.ARROW>;
export type ImageLayer = LayerPrimitive<LayerType.IMAGE>;
export type TextLayer = LayerPrimitive<LayerType.TEXT> & {
  fontFamily: string;
  fontSize: number;
  /**
   * Unitless line height (aligned to W3C). To get line height in px, multiply
   * with font size
   */
  lineHeight: number;
  text: string;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
};
