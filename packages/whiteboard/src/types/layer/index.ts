import { Point } from "fabric";

import {
  Arrowhead,
  FillStyle,
  LayerType,
  PenStyle,
  StrokeStyle,
  TextAlign,
  VerticalAlign
} from "../../constants";

export type Layer =
  | PenLayer
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

type LinearLayerProps = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
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

// Path layers

export type PenLayer = Omit<
  LayerPrimitive<LayerType.PEN>,
  "seed" | "strokeStyle" | "roughness" | "isDrawing"
> & {
  /**
   * Pen style
   */
  penStyle?: PenStyle;
  /**
   * Width of the pen
   */
  penWidth?: number;
  /**
   * Pen points
   */
  points: Point[];
};

// Solid layers

export type RectangleLayer = LayerPrimitive<LayerType.RECTANGLE> &
  SolidLayerProps;
export type DiamondLayer = LayerPrimitive<LayerType.DIAMOND> & SolidLayerProps;
export type EllipseLayer = LayerPrimitive<LayerType.ELLIPSE> & SolidLayerProps;

// Linear layers

export type LineLayer = LayerPrimitive<LayerType.LINE> & LinearLayerProps;
export type ArrowLayer = LayerPrimitive<LayerType.ARROW> &
  LinearLayerProps & {
    /**
     * End arrowhead
     */
    endArrowhead?: Arrowhead;
    /**
     * Start arrowhead
     */
    startArrowhead?: Arrowhead;
  };

// Other

export type ImageLayer = LayerPrimitive<LayerType.IMAGE> & {
  /**
   * Image source
   */
  src?: string;
};

// These properties are too generic to exclude from snake_case linting
/* eslint-disable prefer-snakecase/prefer-snakecase */
export type TextLayer = Omit<
  LayerPrimitive<LayerType.TEXT>,
  "seed" | "strokeStyle" | "roughness" | "isDrawing"
> & {
  /**
   * Layer font family
   */
  fontFamily?: string;
  /**
   * Layer font size (px)
   */
  fontSize?: number;
  /**
   * Unitless line height (aligned to W3C). To get line height in px, multiply
   * with font size
   */
  lineHeight?: number;
  /**
   * Layer text content
   */
  text: string;
  /**
   * Text align
   */
  textAlign?: TextAlign;
  /**
   * Vertical align
   */
  verticalAlign?: VerticalAlign;
};
/* eslint-enable prefer-snakecase/prefer-snakecase */
