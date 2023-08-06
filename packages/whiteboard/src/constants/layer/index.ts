export enum FillStyle {
  CROSS_HATCH = "cross-hatch",
  DASHED = "dashed",
  DOTS = "dots",
  HACHURE = "hachure",
  SOLID = "solid",
  ZIGZAG = "zigzag",
  ZIGZAG_LINE = "zigzag-line"
}

export enum StrokeStyle {
  DASHED = "dashed",
  DOTTED = "dotted",
  SOLID = "solid"
}

export enum PenStyle {
  NORMAL = "normal",
  PRESSURE = "pressure"
}

export enum Arrowhead {
  ARROW = "arrow",
  BAR = "bar",
  DOT = "dot",
  NONE = "none",
  TRIANGLE = "triangle"
}

export enum LayerType {
  ARROW = "arrow",
  DIAMOND = "diamond",
  ELLIPSE = "ellipse",
  IMAGE = "image",
  LINE = "line",
  PEN = "pen",
  RECTANGLE = "rectangle",
  TEXT = "text"
}

// TODO: Remove text once implemented
export type DrawableLayerType = Exclude<
  LayerType,
  LayerType.PEN | LayerType.IMAGE | LayerType.TEXT
>;

export const MIN_LAYER_SIZE = 1;
export const MAX_LAYER_SIZE = 8e3;
export const DEFAULT_LAYER_COLOR = "rgba(191,193,197,1)";
