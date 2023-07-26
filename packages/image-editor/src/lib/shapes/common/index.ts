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

/**
 * Returns dashed dash array
 * @param strokeWidth Stroke width
 */
export const getDashArrayDashed = (strokeWidth: number): [number, number] => [
  8,
  8 + strokeWidth
];

/**
 * Returns dotted dash array
 * @param strokeWidth Stroke width
 */
export const getDashArrayDotted = (strokeWidth: number): [number, number] => [
  1.5,
  6 + strokeWidth
];
