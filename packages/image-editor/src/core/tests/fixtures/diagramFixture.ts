import { VERSIONS } from "../../constants";
import {
  diamondFixture,
  ellipseFixture,
  rectangleFixture
} from "./layerFixture";

export const diagramFixture = {
  type: "excalidraw",
  version: VERSIONS.excalidraw,
  source: "https://excalidraw.com",
  layers: [diamondFixture, ellipseFixture, rectangleFixture],
  appState: {
    viewBackgroundColor: "#ffffff",
    gridSize: null
  },
  files: {}
};

export const diagramFactory = ({
  overrides = {},
  layerOverrides = {}
} = {}) => ({
  ...diagramFixture,
  layers: [
    { ...diamondFixture, ...layerOverrides },
    { ...ellipseFixture, ...layerOverrides },
    { ...rectangleFixture, ...layerOverrides }
  ],
  ...overrides
});

export default diagramFixture;
