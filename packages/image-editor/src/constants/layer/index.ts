import { Layer } from "../../types";

export enum FillStyle {
  CROSS_HATCH = "cross-hatch",
  HACHURE = "hachure",
  SOLID = "solid",
  ZIGZAG = "zigzag"
}

export enum StrokeStyle {
  DASHED = "dashed",
  DOTTED = "dotted",
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

export const DEFAULT_LAYER_PROPS: Pick<
  Layer,
  | "backgroundColor"
  | "fillStyle"
  | "locked"
  | "hidden"
  | "opacity"
  | "roughness"
  | "strokeColor"
  | "strokeStyle"
  | "strokeWidth"
> = {
  backgroundColor: "transparent",
  fillStyle: FillStyle.HACHURE,
  hidden: false,
  locked: false,
  opacity: 100,
  roughness: 1,
  strokeColor: "#000000",
  strokeStyle: StrokeStyle.SOLID,
  strokeWidth: 1
};
