import { MarkNonNullable } from "@storiny/types";

import {
  Arrowhead,
  FillStyle,
  LayerType,
  Roundness,
  StrokeStyle,
  TextAlign,
  VerticalAlign
} from "../../constants";
import { Point } from "../point";

export type GroupId = string;
export type FileId = string;

export type Layer =
  | GenericLayer
  | TextLayer
  | LinearLayer
  | FreeDrawLayer
  | ImageLayer;

/**
 * These are layers that don't have any additional properties
 */
export type GenericLayer =
  | SelectionLayer
  | RectangleLayer
  | DiamondLayer
  | EllipseLayer;

export type BindableLayer =
  | RectangleLayer
  | DiamondLayer
  | EllipseLayer
  | TextLayer
  | ImageLayer;

export type PointBinding = {
  focus: number;
  gap: number;
  layerId: BindableLayer["id"];
};

export type NonDeleted<TLayer extends Layer> = TLayer & {
  isDeleted: boolean;
};

export type NonDeletedLayer = NonDeleted<Layer>;

type LayerPrimitive<T extends LayerType> = {
  angle: number;
  backgroundColor: string;
  // Other layers that are bound to this layer
  boundLayers:
    | {
        id: string;
        type: LayerType.ARROW | LayerType.TEXT;
      }[]
    | null;
  fillStyle: FillStyle;
  // List of groups the layer belongs to, ordered from deepest to shallowest
  groupIds: GroupId[];
  height: number;
  hidden: boolean;
  id: string;
  isDeleted: boolean;
  link: string | null;
  locked: boolean;
  name: string;
  opacity: number;
  roughness: number;
  roundness: null | { type: Roundness; value?: number };
  // Random integer used to seed shape generation so that the
  // roughjs shape doesn't differ across renders
  seed: number;
  strokeColor: string;
  strokeStyle: StrokeStyle;
  strokeWidth: number;
  type: T;
  // Epoch (ms) timestamp of last layer update
  updated: number;
  width: number;
  x: number;
  y: number;
};

export type SelectionLayer = LayerPrimitive<LayerType.SELECTION>;
export type RectangleLayer = LayerPrimitive<LayerType.RECTANGLE>;
export type DiamondLayer = LayerPrimitive<LayerType.DIAMOND>;
export type EllipseLayer = LayerPrimitive<LayerType.ELLIPSE>;
export type ArrowLayer = LayerPrimitive<LayerType.ARROW>;

export type ImageLayer = LayerPrimitive<LayerType.IMAGE> & {
  fileId: FileId | null;
  // X and Y scale factors (-1 to 1), used for image axis flipping
  scale: [number, number];
  // Whether the respective file is persisted
  status: "pending" | "saved" | "error";
};

export type InitializedImageLayer = MarkNonNullable<ImageLayer, "fileId">;

export type TextLayer = LayerPrimitive<LayerType.TEXT> & {
  baseline: number;
  containerId: GenericLayer["id"] | null;
  fontFamily: string;
  fontSize: number;
  /**
   * Unitless line height (aligned to W3C). To get line height in px, multiply
   * with font size (using `getLineHeightInPx` helper).
   */
  lineHeight: number;
  originalText: string;
  text: string;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
};

export type TextContainerLayer =
  | RectangleLayer
  | DiamondLayer
  | EllipseLayer
  | ArrowLayer;

export type TextLayerWithContainer = {
  containerId: TextContainerLayer["id"];
} & TextLayer;

export type LinearLayer = LayerPrimitive<LayerType.LINE | LayerType.ARROW> & {
  endArrowhead: Arrowhead | null;
  endBinding: PointBinding | null;
  lastCommittedPoint: Point | null;
  points: Point[];
  startArrowhead: Arrowhead | null;
  startBinding: PointBinding | null;
};

export type FreeDrawLayer = LayerPrimitive<LayerType.FREE_DRAW> & {
  lastCommittedPoint: Point | null;
  points: Point[];
  pressures: number[];
  simulatePressure: boolean;
};
