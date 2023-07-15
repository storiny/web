import {
  FONT_FAMILY,
  ROUNDNESS,
  TEXT_ALIGN,
  THEME,
  VERTICAL_ALIGN
} from "../constants";
import { Point } from "../types";
import { MarkNonNullable, ValueOf } from "../utility-types";

export type ChartType = "bar" | "line";
export type FillStyle = "hachure" | "cross-hatch" | "solid" | "zigzag";
export type FontFamilyKeys = keyof typeof FONT_FAMILY;
export type FontFamilyValues = (typeof FONT_FAMILY)[FontFamilyKeys];
export type Theme = (typeof THEME)[keyof typeof THEME];
export type FontString = string & { _brand: "fontString" };
export type GroupId = string;
export type PointerType = "mouse" | "pen" | "touch";
export type StrokeRoundness = "round" | "sharp";
export type RoundnessType = ValueOf<typeof ROUNDNESS>;
export type StrokeStyle = "solid" | "dashed" | "dotted";
export type TextAlign = (typeof TEXT_ALIGN)[keyof typeof TEXT_ALIGN];

type VerticalAlignKeys = keyof typeof VERTICAL_ALIGN;
export type VerticalAlign = (typeof VERTICAL_ALIGN)[VerticalAlignKeys];

type _ExcalidrawLayerBase = Readonly<{
  angle: number;
  backgroundColor: string;
  /** other layers that are bound to this layer */
  boundLayers:
    | readonly Readonly<{
        id: ExcalidrawLinearLayer["id"];
        type: "arrow" | "text";
      }>[]
    | null;
  customData?: Record<string, any>;
  fillStyle: FillStyle;
  frameId: string | null;
  /** List of groups the layer belongs to.
      Ordered from deepest to shallowest. */
  groupIds: readonly GroupId[];
  height: number;
  id: string;
  isDeleted: boolean;
  link: string | null;
  locked: boolean;
  opacity: number;
  roughness: number;
  roundness: null | { type: RoundnessType; value?: number };
  /** Random integer used to seed shape generation so that the roughjs shape
      doesn't differ across renders. */
  seed: number;
  strokeColor: string;
  strokeStyle: StrokeStyle;
  strokeWidth: number;
  /** epoch (ms) timestamp of last layer update */
  updated: number;
  /** Integer that is sequentially incremented on each change. Used to reconcile
      layers during collaboration or when saving to server. */
  version: number;
  /** Random integer that is regenerated on each change.
      Used for deterministic reconciliation of updates during collaboration,
      in case the versions (see above) are identical. */
  versionNonce: number;
  width: number;
  x: number;
  y: number;
}>;

export type ExcalidrawSelectionLayer = _ExcalidrawLayerBase & {
  type: "selection";
};

export type ExcalidrawRectangleLayer = _ExcalidrawLayerBase & {
  type: "rectangle";
};

export type ExcalidrawDiamondLayer = _ExcalidrawLayerBase & {
  type: "diamond";
};

export type ExcalidrawEllipseLayer = _ExcalidrawLayerBase & {
  type: "ellipse";
};

export type ExcalidrawImageLayer = _ExcalidrawLayerBase &
  Readonly<{
    fileId: FileId | null;
    /** X and Y scale factors <-1, 1>, used for image axis flipping */
    scale: [number, number];
    /** whether respective file is persisted */
    status: "pending" | "saved" | "error";
    type: "image";
  }>;

export type InitializedExcalidrawImageLayer = MarkNonNullable<
  ExcalidrawImageLayer,
  "fileId"
>;

export type ExcalidrawFrameLayer = _ExcalidrawLayerBase & {
  name: string | null;
  type: "frame";
};

/**
 * These are layers that don't have any additional properties.
 */
export type ExcalidrawGenericLayer =
  | ExcalidrawSelectionLayer
  | ExcalidrawRectangleLayer
  | ExcalidrawDiamondLayer
  | ExcalidrawEllipseLayer;

/**
 * ExcalidrawLayer should be JSON serializable and (eventually) contain
 * no computed data. The list of all ExcalidrawLayers should be shareable
 * between peers and contain no state local to the peer.
 */
export type ExcalidrawLayer =
  | ExcalidrawGenericLayer
  | ExcalidrawTextLayer
  | ExcalidrawLinearLayer
  | ExcalidrawFreeDrawLayer
  | ExcalidrawImageLayer
  | ExcalidrawFrameLayer;

export type NonDeleted<TLayer extends ExcalidrawLayer> = TLayer & {
  isDeleted: boolean;
};

export type NonDeletedExcalidrawLayer = NonDeleted<ExcalidrawLayer>;

export type ExcalidrawTextLayer = _ExcalidrawLayerBase &
  Readonly<{
    baseline: number;
    containerId: ExcalidrawGenericLayer["id"] | null;
    fontFamily: FontFamilyValues;
    fontSize: number;
    /**
     * Unitless line height (aligned to W3C). To get line height in px, multiply
     *  with font size (using `getLineHeightInPx` helper).
     */
    lineHeight: number & { _brand: "unitlessLineHeight" };
    originalText: string;
    text: string;
    textAlign: TextAlign;
    type: "text";
    verticalAlign: VerticalAlign;
  }>;

export type ExcalidrawBindableLayer =
  | ExcalidrawRectangleLayer
  | ExcalidrawDiamondLayer
  | ExcalidrawEllipseLayer
  | ExcalidrawTextLayer
  | ExcalidrawImageLayer
  | ExcalidrawFrameLayer;

export type ExcalidrawTextContainer =
  | ExcalidrawRectangleLayer
  | ExcalidrawDiamondLayer
  | ExcalidrawEllipseLayer
  | ExcalidrawArrowLayer;

export type ExcalidrawTextLayerWithContainer = {
  containerId: ExcalidrawTextContainer["id"];
} & ExcalidrawTextLayer;

export type PointBinding = {
  focus: number;
  gap: number;
  layerId: ExcalidrawBindableLayer["id"];
};

export type Arrowhead = "arrow" | "bar" | "dot" | "triangle";

export type ExcalidrawLinearLayer = _ExcalidrawLayerBase &
  Readonly<{
    endArrowhead: Arrowhead | null;
    endBinding: PointBinding | null;
    lastCommittedPoint: Point | null;
    points: readonly Point[];
    startArrowhead: Arrowhead | null;
    startBinding: PointBinding | null;
    type: "line" | "arrow";
  }>;

export type ExcalidrawArrowLayer = ExcalidrawLinearLayer &
  Readonly<{
    type: "arrow";
  }>;

export type ExcalidrawFreeDrawLayer = _ExcalidrawLayerBase &
  Readonly<{
    lastCommittedPoint: Point | null;
    points: readonly Point[];
    pressures: readonly number[];
    simulatePressure: boolean;
    type: "freedraw";
  }>;

export type FileId = string & { _brand: "FileId" };
