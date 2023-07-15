import { ExcalidrawLayer } from "../../layer/types";

const layerBase: Omit<ExcalidrawLayer, "type"> = {
  id: "vWrqOAfkind2qcm7LDAGZ",
  x: 414,
  y: 237,
  width: 214,
  height: 214,
  angle: 0,
  strokeColor: "#000000",
  backgroundColor: "#15aabf",
  fillStyle: "hachure",
  strokeWidth: 1,
  strokeStyle: "solid",
  roughness: 1,
  opacity: 100,
  groupIds: [],
  frameId: null,
  roundness: null,
  seed: 1041657908,
  version: 120,
  versionNonce: 1188004276,
  isDeleted: false,
  boundLayers: null,
  updated: 1,
  link: null,
  locked: false
};

export const rectangleFixture: ExcalidrawLayer = {
  ...layerBase,
  type: "rectangle"
};
export const ellipseFixture: ExcalidrawLayer = {
  ...layerBase,
  type: "ellipse"
};
export const diamondFixture: ExcalidrawLayer = {
  ...layerBase,
  type: "diamond"
};
export const rectangleWithLinkFixture: ExcalidrawLayer = {
  ...layerBase,
  type: "rectangle",
  link: "excalidraw.com"
};
