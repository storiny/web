import {
  FillStyle,
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

type SolidLayerProps = {
  /**
   * Fill style
   * @default 'solid'
   */
  fillStyle?: FillStyle;
  /**
   * Fill weight
   * @default 1
   */
  fillWeight?: number;
  /**
   * Hachure gap
   * @default 5
   */
  hachureGap?: number;
};

type LayerPrimitive<T extends LayerType> = {
  /**
   * Layer type
   */
  _type: T;
  /**
   * Hidden flag
   * @default false
   */
  hidden?: boolean;
  /**
   * Layer ID
   */
  id: string;
  /**
   * If `true`, the object is interactive
   * @default true
   */
  interactive?: boolean;
  /**
   * Drawing flag
   */
  isDrawing?: boolean;
  /**
   * Locked flag
   * @default false
   */
  locked?: boolean;
  /**
   * Layer name
   */
  name?: string;
  /**
   * Roughness
   * @default 1
   */
  roughness?: number;
  /**
   * Seed for generating rough shapes
   */
  seed?: number;
  /**
   * Selected flag
   */
  selected?: boolean;
  /**
   * Stroke style
   * @default 'solid'
   */
  strokeStyle?: StrokeStyle;
};

export type PenLayer = LayerPrimitive<LayerType.PEN>;
export type PolygonLayer = LayerPrimitive<LayerType.POLYGON> & SolidLayerProps;
export type RectangleLayer = LayerPrimitive<LayerType.RECTANGLE> &
  SolidLayerProps;
export type DiamondLayer = LayerPrimitive<LayerType.DIAMOND> & SolidLayerProps;
export type EllipseLayer = LayerPrimitive<LayerType.ELLIPSE> & SolidLayerProps;
export type LineLayer = LayerPrimitive<LayerType.LINE>;
export type ArrowLayer = LayerPrimitive<LayerType.ARROW>;
export type ImageLayer = LayerPrimitive<LayerType.IMAGE>;
export type TextLayer = LayerPrimitive<LayerType.TEXT> & {
  /**
   * Layer font family
   */
  fontFamily: string;
  /**
   * Layer font size (px)
   */
  fontSize: number;
  /**
   * Unitless line height (aligned to W3C). To get line height in px, multiply
   * with font size
   */
  lineHeight: number;
  /**
   * Layer text content
   */
  text: string;
  /**
   * Text align
   */
  textAlign: TextAlign;
  /**
   * Vertical align
   */
  verticalAlign: VerticalAlign;
};
