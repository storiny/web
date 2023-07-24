export enum FillStyle {
  CROSS_HATCH = "cross-hatch",
  HACHURE = "hachure",
  SOLID = "solid",
  ZIGZAG = "zigzag"
}

export enum StrokeStyle {
  DASHED = "dashed",
  SOLID = "solid"
}

export enum Arrowhead {
  ARROW = "arrow",
  BAR = "bar",
  DOT = "dot",
  TRIANGLE = "triangle"
}

export enum LayerType {
  ARROW = "arrow",
  ELLIPSE = "ellipse",
  IMAGE = "image",
  LINE = "line",
  PEN = "pen",
  POLYGON = "polygon",
  RECTANGLE = "rectangle",
  TEXT = "text"
}

export const MIN_LAYER_SIZE = 1;
export const MAX_LAYER_SIZE = 8e3;
export const DEFAULT_LAYER_FILL = "#bfc1c5";
