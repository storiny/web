import { BaseFabricObject, TProps } from "fabric";

export const COMMON_OBJECT_PROPS: TProps<BaseFabricObject> = {
  borderColor: "#1371ec",
  borderOpacityWhenMoving: 0.25,
  cornerColor: "#fff",
  cornerSize: 10,
  cornerStrokeColor: "#1371ec",
  padding: 0,
  transparentCorners: false,
  noScaleCache: false
};

export const CLONE_PROPS = [
  "x1",
  "x2",
  "y1",
  "y2",
  "flipX",
  "flipY",
  "strokeWidth",
  "fill",
  "stroke",
  "strokeStyle",
  "interactive",
  "fillStyle",
  "fillWeight",
  "hachureGap",
  "roughness"
];
