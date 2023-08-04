import { BaseFabricObject, TProps } from "fabric";

export const COMMON_OBJECT_PROPS: TProps<BaseFabricObject> = {
  borderColor: "#1371ec",
  borderOpacityWhenMoving: 0.25,
  cornerColor: "#fff",
  cornerSize: 10,
  cornerStrokeColor: "#1371ec",
  padding: 0,
  transparentCorners: false,
  /**
   * Excessive roughness causes the shapes to overflow the bounding box,
   * messing up the cached bitmap image drawn on the offscreen canvas
   */
  objectCaching: false
};

export const CLONE_PROPS = [
  "interactive",
  "x1",
  "x2",
  "y1",
  "y2",
  "flipX",
  "flipY",
  "stroke",
  "strokeStyle",
  "strokeWidth",
  "penWidth",
  "penStyle",
  "fill",
  "fillStyle",
  "fillWeight",
  "points",
  "hachureGap",
  "roughness",
  "fontFamily",
  "fontSize",
  "lineHeight",
  "text",
  "textAlign",
  "verticalAlign",
  "startArrowhead",
  "endArrowhead"
];
