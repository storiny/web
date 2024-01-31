import { TFabricObjectProps } from "fabric";

export const COMMON_OBJECT_PROPS: TFabricObjectProps = {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
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
  /* eslint-enable prefer-snakecase/prefer-snakecase */
};

const BASE_PROPS = [
  "interactive",
  "left",
  "top",
  "width",
  "height",
  "scaleX",
  "scaleY",
  "flipX",
  "flipY"
];
const STROKE_PROPS = ["stroke", "strokeStyle", "strokeWidth"];
const FILL_PROPS = ["fill", "fillStyle", "fillWeight"];
const ROUGH_PROPS = ["hachureGap", "roughness"];
const LINEAR_PROPS = ["x1", "x2", "y1", "y2"];
const ARROW_PROPS = ["startArrowhead", "endArrowhead"];
const PEN_PROPS = ["penWidth", "penStyle", "points"];
const TEXT_PROPS = [
  "fontFamily",
  "fontName",
  "fontSize",
  "lineHeight",
  "text",
  "textAlign",
  "verticalAlign"
];

export const CLONE_PROPS = [
  ...BASE_PROPS,
  ...STROKE_PROPS,
  ...FILL_PROPS,
  ...ROUGH_PROPS,
  ...LINEAR_PROPS,
  ...ARROW_PROPS,
  ...PEN_PROPS,
  ...TEXT_PROPS
];
