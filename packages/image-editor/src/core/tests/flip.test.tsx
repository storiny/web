import ReactDOM from "react-dom";

import { actionFlipHorizontal, actionFlipVertical } from "../actions";
import { ROUNDNESS } from "../constants";
import ExcalidrawApp from "../excalidraw-app";
import { getLayerAbsoluteCoords } from "../layer";
import { newLinearLayer } from "../layer";
import { mutateLayer } from "../layer/mutateLayer";
import {
  ExcalidrawImageLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  FileId
} from "../layer/types";
import { NormalizedZoomValue } from "../types";
import { API } from "./helpers/api";
import { Pointer, UI } from "./helpers/ui";
import {
  createPasteEvent,
  GlobalTestState,
  render,
  waitFor
} from "./test-utils";

const { h } = window;

const mouse = new Pointer("mouse");
jest.mock("../data/blob", () => {
  const originalModule = jest.requireActual("../data/blob");

  //Prevent Node.js modules errors (document is not defined etc...)
  return {
    __esModule: true,
    ...originalModule,
    resizeImageFile: (imageFile: File) => imageFile,
    generateIdFromFile: () => "fileId" as FileId
  };
});
beforeEach(async () => {
  // Unmount ReactDOM from root
  ReactDOM.unmountComponentAtNode(document.getLayerById("root")!);

  mouse.reset();
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();

  Object.assign(document, {
    layerFromPoint: () => GlobalTestState.canvas
  });
  await render(<ExcalidrawApp />);
  h.setState({
    zoom: {
      value: 1 as NormalizedZoomValue
    }
  });
});

const createAndSelectOneRectangle = (angle: number = 0) => {
  UI.createLayer("rectangle", {
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    angle
  });
};

const createAndSelectOneDiamond = (angle: number = 0) => {
  UI.createLayer("diamond", {
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    angle
  });
};

const createAndSelectOneEllipse = (angle: number = 0) => {
  UI.createLayer("ellipse", {
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    angle
  });
};

const createAndSelectOneArrow = (angle: number = 0) => {
  UI.createLayer("arrow", {
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    angle
  });
};

const createAndSelectOneLine = (angle: number = 0) => {
  UI.createLayer("line", {
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    angle
  });
};

const createAndReturnOneDraw = (angle: number = 0) =>
  UI.createLayer("freedraw", {
    x: 0,
    y: 0,
    width: 50,
    height: 100,
    angle
  });

const createLinearLayerWithCurveInsideMinMaxPoints = (
  type: "line" | "arrow",
  extraProps: any = {}
) =>
  newLinearLayer({
    type,
    x: 2256.910668124894,
    y: -2412.5069664197654,
    width: 1750.4888916015625,
    height: 410.51605224609375,
    angle: 0,
    strokeColor: "#000000",
    backgroundColor: "#fa5252",
    fillStyle: "hachure",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: { type: ROUNDNESS.PROPORTIONAL_RADIUS },
    boundLayers: null,
    link: null,
    locked: false,
    points: [
      [0, 0],
      [-922.4761962890625, 300.3277587890625],
      [828.0126953125, 410.51605224609375]
    ],
    startArrowhead: null,
    endArrowhead: null
  });

const createLinearLayersWithCurveOutsideMinMaxPoints = (
  type: "line" | "arrow",
  extraProps: any = {}
) =>
  newLinearLayer({
    type,
    x: -1388.6555370382996,
    y: 1037.698247710191,
    width: 591.2804897585779,
    height: 69.32871961377737,
    angle: 0,
    strokeColor: "#000000",
    backgroundColor: "transparent",
    fillStyle: "hachure",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: { type: ROUNDNESS.PROPORTIONAL_RADIUS },
    boundLayers: null,
    link: null,
    locked: false,
    points: [
      [0, 0],
      [-584.1485186423079, -15.365636022723947],
      [-591.2804897585779, 36.09360810181511],
      [-148.56510566829502, 53.96308359105342]
    ],
    startArrowhead: null,
    endArrowhead: null,
    ...extraProps
  });

const checkLayersBoundingBox = async (
  layer1: ExcalidrawLayer,
  layer2: ExcalidrawLayer,
  toleranceInPx: number = 0
) => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer1);

  const [x12, y12, x22, y22] = getLayerAbsoluteCoords(layer2);

  debugger;
  await waitFor(() => {
    // Check if width and height did not change
    expect(x2 - x1).toBeCloseTo(x22 - x12, -1);
    expect(y2 - y1).toBeCloseTo(y22 - y12, -1);
  });
};

const checkHorizontalFlip = async (toleranceInPx: number = 0.00001) => {
  const originalLayer = JSON.parse(JSON.stringify(h.layers[0]));
  h.app.actionManager.executeAction(actionFlipHorizontal);
  const newLayer = h.layers[0];
  await checkLayersBoundingBox(originalLayer, newLayer, toleranceInPx);
};

const checkTwoPointsLineHorizontalFlip = async () => {
  const originalLayer = JSON.parse(
    JSON.stringify(h.layers[0])
  ) as ExcalidrawLinearLayer;
  h.app.actionManager.executeAction(actionFlipHorizontal);
  const newLayer = h.layers[0] as ExcalidrawLinearLayer;
  await waitFor(() => {
    expect(originalLayer.points[0][0]).toBeCloseTo(-newLayer.points[0][0], 5);
    expect(originalLayer.points[0][1]).toBeCloseTo(newLayer.points[0][1], 5);
    expect(originalLayer.points[1][0]).toBeCloseTo(-newLayer.points[1][0], 5);
    expect(originalLayer.points[1][1]).toBeCloseTo(newLayer.points[1][1], 5);
  });
};

const checkTwoPointsLineVerticalFlip = async () => {
  const originalLayer = JSON.parse(
    JSON.stringify(h.layers[0])
  ) as ExcalidrawLinearLayer;
  h.app.actionManager.executeAction(actionFlipVertical);
  const newLayer = h.layers[0] as ExcalidrawLinearLayer;
  await waitFor(() => {
    expect(originalLayer.points[0][0]).toBeCloseTo(newLayer.points[0][0], 5);
    expect(originalLayer.points[0][1]).toBeCloseTo(-newLayer.points[0][1], 5);
    expect(originalLayer.points[1][0]).toBeCloseTo(newLayer.points[1][0], 5);
    expect(originalLayer.points[1][1]).toBeCloseTo(-newLayer.points[1][1], 5);
  });
};

const checkRotatedHorizontalFlip = async (
  expectedAngle: number,
  toleranceInPx: number = 0.00001
) => {
  const originalLayer = JSON.parse(JSON.stringify(h.layers[0]));
  h.app.actionManager.executeAction(actionFlipHorizontal);
  const newLayer = h.layers[0];
  await waitFor(() => {
    expect(newLayer.angle).toBeCloseTo(expectedAngle);
  });
  await checkLayersBoundingBox(originalLayer, newLayer, toleranceInPx);
};

const checkRotatedVerticalFlip = async (
  expectedAngle: number,
  toleranceInPx: number = 0.00001
) => {
  const originalLayer = JSON.parse(JSON.stringify(h.layers[0]));
  h.app.actionManager.executeAction(actionFlipVertical);
  const newLayer = h.layers[0];
  await waitFor(() => {
    expect(newLayer.angle).toBeCloseTo(expectedAngle);
  });
  await checkLayersBoundingBox(originalLayer, newLayer, toleranceInPx);
};

const checkVerticalFlip = async (toleranceInPx: number = 0.00001) => {
  const originalLayer = JSON.parse(JSON.stringify(h.layers[0]));

  h.app.actionManager.executeAction(actionFlipVertical);

  const newLayer = h.layers[0];
  await checkLayersBoundingBox(originalLayer, newLayer, toleranceInPx);
};

const checkVerticalHorizontalFlip = async (toleranceInPx: number = 0.00001) => {
  const originalLayer = JSON.parse(JSON.stringify(h.layers[0]));

  h.app.actionManager.executeAction(actionFlipHorizontal);
  h.app.actionManager.executeAction(actionFlipVertical);

  const newLayer = h.layers[0];
  await checkLayersBoundingBox(originalLayer, newLayer, toleranceInPx);
};

const TWO_POINTS_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS = 5;
const MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS = 20;

// Rectangle layer
describe("rectangle", () => {
  it("flips an unrotated rectangle horizontally correctly", async () => {
    createAndSelectOneRectangle();

    await checkHorizontalFlip();
  });

  it("flips an unrotated rectangle vertically correctly", async () => {
    createAndSelectOneRectangle();

    await checkVerticalFlip();
  });

  it("flips a rotated rectangle horizontally correctly", async () => {
    const originalAngle = (3 * Math.PI) / 4;
    const expectedAngle = (5 * Math.PI) / 4;

    createAndSelectOneRectangle(originalAngle);

    await checkRotatedHorizontalFlip(expectedAngle);
  });

  it("flips a rotated rectangle vertically correctly", async () => {
    const originalAngle = (3 * Math.PI) / 4;
    const expectedAgnle = (5 * Math.PI) / 4;

    createAndSelectOneRectangle(originalAngle);

    await checkRotatedVerticalFlip(expectedAgnle);
  });
});

// Diamond layer
describe("diamond", () => {
  it("flips an unrotated diamond horizontally correctly", async () => {
    createAndSelectOneDiamond();

    await checkHorizontalFlip();
  });

  it("flips an unrotated diamond vertically correctly", async () => {
    createAndSelectOneDiamond();

    await checkVerticalFlip();
  });

  it("flips a rotated diamond horizontally correctly", async () => {
    const originalAngle = (5 * Math.PI) / 4;
    const expectedAngle = (3 * Math.PI) / 4;

    createAndSelectOneDiamond(originalAngle);

    await checkRotatedHorizontalFlip(expectedAngle);
  });

  it("flips a rotated diamond vertically correctly", async () => {
    const originalAngle = (5 * Math.PI) / 4;
    const expectedAngle = (3 * Math.PI) / 4;

    createAndSelectOneDiamond(originalAngle);

    await checkRotatedVerticalFlip(expectedAngle);
  });
});

// Ellipse layer
describe("ellipse", () => {
  it("flips an unrotated ellipse horizontally correctly", async () => {
    createAndSelectOneEllipse();

    await checkHorizontalFlip();
  });

  it("flips an unrotated ellipse vertically correctly", async () => {
    createAndSelectOneEllipse();

    await checkVerticalFlip();
  });

  it("flips a rotated ellipse horizontally correctly", async () => {
    const originalAngle = (7 * Math.PI) / 4;
    const expectedAngle = Math.PI / 4;

    createAndSelectOneEllipse(originalAngle);

    await checkRotatedHorizontalFlip(expectedAngle);
  });

  it("flips a rotated ellipse vertically correctly", async () => {
    const originalAngle = (7 * Math.PI) / 4;
    const expectedAngle = Math.PI / 4;

    createAndSelectOneEllipse(originalAngle);

    await checkRotatedVerticalFlip(expectedAngle);
  });
});

// Arrow layer
describe("arrow", () => {
  it("flips an unrotated arrow horizontally with line inside min/max points bounds", async () => {
    const arrow = createLinearLayerWithCurveInsideMinMaxPoints("arrow");
    h.app.scene.replaceAllLayers([arrow]);
    h.app.setState({ selectedLayerIds: { [arrow.id]: true } });
    await checkHorizontalFlip(
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  it("flips an unrotated arrow vertically with line inside min/max points bounds", async () => {
    const arrow = createLinearLayerWithCurveInsideMinMaxPoints("arrow");
    h.app.scene.replaceAllLayers([arrow]);
    h.app.setState({ selectedLayerIds: { [arrow.id]: true } });

    await checkVerticalFlip(50);
  });

  it("flips a rotated arrow horizontally with line inside min/max points bounds", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;
    const line = createLinearLayerWithCurveInsideMinMaxPoints("arrow");
    h.app.scene.replaceAllLayers([line]);
    h.state.selectedLayerIds = {
      ...h.state.selectedLayerIds,
      [line.id]: true
    };
    mutateLayer(line, {
      angle: originalAngle
    });

    await checkRotatedHorizontalFlip(
      expectedAngle,
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  it("flips a rotated arrow vertically with line inside min/max points bounds", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;
    const line = createLinearLayerWithCurveInsideMinMaxPoints("arrow");
    h.app.scene.replaceAllLayers([line]);
    h.state.selectedLayerIds = {
      ...h.state.selectedLayerIds,
      [line.id]: true
    };
    mutateLayer(line, {
      angle: originalAngle
    });

    await checkRotatedVerticalFlip(
      expectedAngle,
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  //TODO: layers with curve outside minMax points have a wrong bounding box!!!
  it.skip("flips an unrotated arrow horizontally with line outside min/max points bounds", async () => {
    const arrow = createLinearLayersWithCurveOutsideMinMaxPoints("arrow");
    h.app.scene.replaceAllLayers([arrow]);
    h.app.setState({ selectedLayerIds: { [arrow.id]: true } });

    await checkHorizontalFlip(
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  //TODO: layers with curve outside minMax points have a wrong bounding box!!!
  it.skip("flips a rotated arrow horizontally with line outside min/max points bounds", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;
    const line = createLinearLayersWithCurveOutsideMinMaxPoints("arrow");
    mutateLayer(line, { angle: originalAngle });
    h.app.scene.replaceAllLayers([line]);
    h.app.setState({ selectedLayerIds: { [line.id]: true } });

    await checkRotatedVerticalFlip(
      expectedAngle,
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  //TODO: layers with curve outside minMax points have a wrong bounding box!!!
  it.skip("flips an unrotated arrow vertically with line outside min/max points bounds", async () => {
    const arrow = createLinearLayersWithCurveOutsideMinMaxPoints("arrow");
    h.app.scene.replaceAllLayers([arrow]);
    h.app.setState({ selectedLayerIds: { [arrow.id]: true } });

    await checkVerticalFlip(MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS);
  });

  //TODO: layers with curve outside minMax points have a wrong bounding box!!!
  it.skip("flips a rotated arrow vertically with line outside min/max points bounds", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;
    const line = createLinearLayersWithCurveOutsideMinMaxPoints("arrow");
    mutateLayer(line, { angle: originalAngle });
    h.app.scene.replaceAllLayers([line]);
    h.app.setState({ selectedLayerIds: { [line.id]: true } });

    await checkRotatedVerticalFlip(
      expectedAngle,
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  it("flips an unrotated arrow horizontally correctly", async () => {
    createAndSelectOneArrow();
    await checkHorizontalFlip(
      TWO_POINTS_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  it("flips an unrotated arrow vertically correctly", async () => {
    createAndSelectOneArrow();
    await checkVerticalFlip(TWO_POINTS_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS);
  });

  it("flips a two points arrow horizontally correctly", async () => {
    createAndSelectOneArrow();
    await checkTwoPointsLineHorizontalFlip();
  });

  it("flips a two points arrow vertically correctly", async () => {
    createAndSelectOneArrow();
    await checkTwoPointsLineVerticalFlip();
  });
});

// Line layer
describe("line", () => {
  it("flips an unrotated line horizontally with line inside min/max points bounds", async () => {
    const line = createLinearLayerWithCurveInsideMinMaxPoints("line");
    h.app.scene.replaceAllLayers([line]);
    h.app.setState({ selectedLayerIds: { [line.id]: true } });

    await checkHorizontalFlip(
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  it("flips an unrotated line vertically with line inside min/max points bounds", async () => {
    const line = createLinearLayerWithCurveInsideMinMaxPoints("line");
    h.app.scene.replaceAllLayers([line]);
    h.app.setState({ selectedLayerIds: { [line.id]: true } });

    await checkVerticalFlip(MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS);
  });

  it("flips an unrotated line horizontally correctly", async () => {
    createAndSelectOneLine();
    await checkHorizontalFlip(
      TWO_POINTS_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });
  //TODO: layers with curve outside minMax points have a wrong bounding box
  it.skip("flips an unrotated line horizontally with line outside min/max points bounds", async () => {
    const line = createLinearLayersWithCurveOutsideMinMaxPoints("line");
    h.app.scene.replaceAllLayers([line]);
    h.app.setState({ selectedLayerIds: { [line.id]: true } });

    await checkHorizontalFlip(
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  //TODO: layers with curve outside minMax points have a wrong bounding box
  it.skip("flips an unrotated line vertically with line outside min/max points bounds", async () => {
    const line = createLinearLayersWithCurveOutsideMinMaxPoints("line");
    h.app.scene.replaceAllLayers([line]);
    h.app.setState({ selectedLayerIds: { [line.id]: true } });

    await checkVerticalFlip(MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS);
  });

  //TODO: layers with curve outside minMax points have a wrong bounding box
  it.skip("flips a rotated line horizontally with line outside min/max points bounds", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;
    const line = createLinearLayersWithCurveOutsideMinMaxPoints("line");
    mutateLayer(line, { angle: originalAngle });
    h.app.scene.replaceAllLayers([line]);
    h.app.setState({ selectedLayerIds: { [line.id]: true } });

    await checkRotatedHorizontalFlip(
      expectedAngle,
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  //TODO: layers with curve outside minMax points have a wrong bounding box
  it.skip("flips a rotated line vertically with line outside min/max points bounds", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;
    const line = createLinearLayersWithCurveOutsideMinMaxPoints("line");
    mutateLayer(line, { angle: originalAngle });
    h.app.scene.replaceAllLayers([line]);
    h.app.setState({ selectedLayerIds: { [line.id]: true } });

    await checkRotatedVerticalFlip(
      expectedAngle,
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  it("flips an unrotated line vertically correctly", async () => {
    createAndSelectOneLine();
    await checkVerticalFlip(TWO_POINTS_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS);
  });

  it("flips a rotated line horizontally with line inside min/max points bounds", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;
    const line = createLinearLayerWithCurveInsideMinMaxPoints("line");
    h.app.scene.replaceAllLayers([line]);
    h.state.selectedLayerIds = {
      ...h.state.selectedLayerIds,
      [line.id]: true
    };
    mutateLayer(line, {
      angle: originalAngle
    });

    await checkRotatedHorizontalFlip(
      expectedAngle,
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  it("flips a rotated line vertically with line inside min/max points bounds", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;
    const line = createLinearLayerWithCurveInsideMinMaxPoints("line");
    h.app.scene.replaceAllLayers([line]);
    h.state.selectedLayerIds = {
      ...h.state.selectedLayerIds,
      [line.id]: true
    };
    mutateLayer(line, {
      angle: originalAngle
    });

    await checkRotatedVerticalFlip(
      expectedAngle,
      MULTIPOINT_LINEAR_ELEMENT_FLIP_TOLERANCE_IN_PIXELS
    );
  });

  it("flips a two points line horizontally correctly", async () => {
    createAndSelectOneLine();
    await checkTwoPointsLineHorizontalFlip();
  });

  it("flips a two points line vertically correctly", async () => {
    createAndSelectOneLine();
    await checkTwoPointsLineVerticalFlip();
  });
});

// Draw layer
describe("freedraw", () => {
  it("flips an unrotated drawing horizontally correctly", async () => {
    const draw = createAndReturnOneDraw();
    // select draw, since not done automatically
    h.state.selectedLayerIds = {
      ...h.state.selectedLayerIds,
      [draw.id]: true
    };
    await checkHorizontalFlip();
  });

  it("flips an unrotated drawing vertically correctly", async () => {
    const draw = createAndReturnOneDraw();
    // select draw, since not done automatically
    h.state.selectedLayerIds = {
      ...h.state.selectedLayerIds,
      [draw.id]: true
    };
    await checkVerticalFlip();
  });

  it("flips a rotated drawing horizontally correctly", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;

    const draw = createAndReturnOneDraw(originalAngle);
    // select draw, since not done automatically
    h.state.selectedLayerIds = {
      ...h.state.selectedLayerIds,
      [draw.id]: true
    };

    await checkRotatedHorizontalFlip(expectedAngle);
  });

  it("flips a rotated drawing vertically correctly", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;

    const draw = createAndReturnOneDraw(originalAngle);
    // select draw, since not done automatically
    h.state.selectedLayerIds = {
      ...h.state.selectedLayerIds,
      [draw.id]: true
    };

    await checkRotatedVerticalFlip(expectedAngle);
  });
});

//image
//TODO: currently there is no test for pixel colors at flipped positions.
describe("image", () => {
  const createImage = async () => {
    const sendPasteEvent = (file?: File) => {
      const clipboardEvent = createPasteEvent("", file ? [file] : []);
      document.dispatchEvent(clipboardEvent);
    };

    sendPasteEvent(await API.loadFile("./fixtures/smiley_embedded_v2.png"));
  };

  it("flips an unrotated image horizontally correctly", async () => {
    //paste image
    await createImage();

    await waitFor(() => {
      expect((h.layers[0] as ExcalidrawImageLayer).scale).toEqual([1, 1]);
      expect(API.getSelectedLayers().length).toBeGreaterThan(0);
      expect(API.getSelectedLayers()[0].type).toEqual("image");
      expect(h.app.files.fileId).toBeDefined();
    });
    await checkHorizontalFlip();
    expect((h.layers[0] as ExcalidrawImageLayer).scale).toEqual([-1, 1]);
    expect(h.layers[0].angle).toBeCloseTo(0);
  });

  it("flips an unrotated image vertically correctly", async () => {
    //paste image
    await createImage();
    await waitFor(() => {
      expect((h.layers[0] as ExcalidrawImageLayer).scale).toEqual([1, 1]);
      expect(API.getSelectedLayers().length).toBeGreaterThan(0);
      expect(API.getSelectedLayers()[0].type).toEqual("image");
      expect(h.app.files.fileId).toBeDefined();
    });

    await checkVerticalFlip();
    expect((h.layers[0] as ExcalidrawImageLayer).scale).toEqual([1, -1]);
    expect(h.layers[0].angle).toBeCloseTo(0);
  });

  it("flips an rotated image horizontally correctly", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;
    //paste image
    await createImage();
    await waitFor(() => {
      expect((h.layers[0] as ExcalidrawImageLayer).scale).toEqual([1, 1]);
      expect(API.getSelectedLayers().length).toBeGreaterThan(0);
      expect(API.getSelectedLayers()[0].type).toEqual("image");
      expect(h.app.files.fileId).toBeDefined();
    });
    mutateLayer(h.layers[0], {
      angle: originalAngle
    });
    await checkRotatedHorizontalFlip(expectedAngle);
    expect((h.layers[0] as ExcalidrawImageLayer).scale).toEqual([-1, 1]);
  });

  it("flips an rotated image vertically correctly", async () => {
    const originalAngle = Math.PI / 4;
    const expectedAngle = (7 * Math.PI) / 4;
    //paste image
    await createImage();
    await waitFor(() => {
      expect((h.layers[0] as ExcalidrawImageLayer).scale).toEqual([1, 1]);
      expect(h.layers[0].angle).toEqual(0);
      expect(API.getSelectedLayers().length).toBeGreaterThan(0);
      expect(API.getSelectedLayers()[0].type).toEqual("image");
      expect(h.app.files.fileId).toBeDefined();
    });
    mutateLayer(h.layers[0], {
      angle: originalAngle
    });

    await checkRotatedVerticalFlip(expectedAngle);
    expect((h.layers[0] as ExcalidrawImageLayer).scale).toEqual([1, -1]);
    expect(h.layers[0].angle).toBeCloseTo(expectedAngle);
  });

  it("flips an image both vertically & horizontally", async () => {
    //paste image
    await createImage();
    await waitFor(() => {
      expect((h.layers[0] as ExcalidrawImageLayer).scale).toEqual([1, 1]);
      expect(API.getSelectedLayers().length).toBeGreaterThan(0);
      expect(API.getSelectedLayers()[0].type).toEqual("image");
      expect(h.app.files.fileId).toBeDefined();
    });

    await checkVerticalHorizontalFlip();
    expect((h.layers[0] as ExcalidrawImageLayer).scale).toEqual([-1, -1]);
    expect(h.layers[0].angle).toBeCloseTo(0);
  });
});
