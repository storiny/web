import * as restore from "../../../lib/data/restore/restore";
import { ImportedDataState } from "../../../lib/data/types";
import { DEFAULT_SIDEBAR, FONT_FAMILY, ROUNDNESS } from "../../constants";
import { getDefaultAppState } from "../../editorState";
import { newLayerWith } from "../../layer/mutateLayer";
import * as sizeHelpers from "../../layer/sizeHelpers";
import {
  ExcalidrawFreeDrawLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextLayer
} from "../../layer/types";
import { NormalizedZoomValue } from "../../types";
import { API } from "../helpers/api";

describe("restoreLayers", () => {
  const mockSizeHelper = jest.spyOn(sizeHelpers, "isInvisiblySmallLayer");

  beforeEach(() => {
    mockSizeHelper.mockReset();
  });

  afterAll(() => {
    mockSizeHelper.mockRestore();
  });

  it("should return empty array when layer is null", () => {
    expect(restore.restoreLayers(null, null)).toStrictEqual([]);
  });

  it("should not call isInvisiblySmallLayer when layer is a selection layer", () => {
    const selectionEl = { type: "selection" } as ExcalidrawLayer;
    const restoreLayers = restore.restoreLayers([selectionEl], null);
    expect(restoreLayers.length).toBe(0);
    expect(sizeHelpers.isInvisiblySmallLayer).toBeCalledTimes(0);
  });

  it("should return empty array when input type is not supported", () => {
    const dummyNotSupportedLayer: any = API.createLayer({
      type: "text"
    });

    dummyNotSupportedLayer.type = "not supported";
    expect(restore.restoreLayers([dummyNotSupportedLayer], null).length).toBe(
      0
    );
  });

  it("should return empty array when isInvisiblySmallLayer is true", () => {
    const rectLayer = API.createLayer({ type: "rectangle" });
    mockSizeHelper.mockImplementation(() => true);

    expect(restore.restoreLayers([rectLayer], null).length).toBe(0);
  });

  it("should restore text layer correctly passing value for each attribute", () => {
    const textLayer = API.createLayer({
      type: "text",
      fontSize: 14,
      fontFamily: FONT_FAMILY.Virgil,
      text: "text",
      textAlign: "center",
      verticalAlign: "middle",
      id: "id-text01"
    });

    const restoredText = restore.restoreLayers(
      [textLayer],
      null
    )[0] as ExcalidrawTextLayer;

    expect(restoredText).toMatchSnapshot({
      seed: expect.any(Number)
    });
  });

  it("should restore text layer correctly with unknown font family, null text and undefined alignment", () => {
    const textLayer: any = API.createLayer({
      type: "text",
      textAlign: undefined,
      verticalAlign: undefined,
      id: "id-text01"
    });

    textLayer.text = null;
    textLayer.font = "10 unknown";

    const restoredText = restore.restoreLayers(
      [textLayer],
      null
    )[0] as ExcalidrawTextLayer;
    expect(restoredText).toMatchSnapshot({
      seed: expect.any(Number)
    });
  });

  it("should restore freedraw layer correctly", () => {
    const freedrawLayer = API.createLayer({
      type: "freedraw",
      id: "id-freedraw01"
    });

    const restoredFreedraw = restore.restoreLayers(
      [freedrawLayer],
      null
    )[0] as ExcalidrawFreeDrawLayer;

    expect(restoredFreedraw).toMatchSnapshot({ seed: expect.any(Number) });
  });

  it("should restore line and draw layers correctly", () => {
    const lineLayer = API.createLayer({ type: "line", id: "id-line01" });

    const drawLayer: any = API.createLayer({
      type: "line",
      id: "id-draw01"
    });
    drawLayer.type = "draw";

    const restoredLayers = restore.restoreLayers([lineLayer, drawLayer], null);

    const restoredLine = restoredLayers[0] as ExcalidrawLinearLayer;
    const restoredDraw = restoredLayers[1] as ExcalidrawLinearLayer;

    expect(restoredLine).toMatchSnapshot({ seed: expect.any(Number) });
    expect(restoredDraw).toMatchSnapshot({ seed: expect.any(Number) });
  });

  it("should restore arrow layer correctly", () => {
    const arrowLayer = API.createLayer({ type: "arrow", id: "id-arrow01" });

    const restoredLayers = restore.restoreLayers([arrowLayer], null);

    const restoredArrow = restoredLayers[0] as ExcalidrawLinearLayer;

    expect(restoredArrow).toMatchSnapshot({ seed: expect.any(Number) });
  });

  it("when arrow layer has defined endArrowHead", () => {
    const arrowLayer = API.createLayer({ type: "arrow" });

    const restoredLayers = restore.restoreLayers([arrowLayer], null);

    const restoredArrow = restoredLayers[0] as ExcalidrawLinearLayer;

    expect(arrowLayer.endArrowhead).toBe(restoredArrow.endArrowhead);
  });

  it("when arrow layer has undefined endArrowHead", () => {
    const arrowLayer = API.createLayer({ type: "arrow" });
    Object.defineProperty(arrowLayer, "endArrowhead", {
      get: jest.fn(() => undefined)
    });

    const restoredLayers = restore.restoreLayers([arrowLayer], null);

    const restoredArrow = restoredLayers[0] as ExcalidrawLinearLayer;

    expect(restoredArrow.endArrowhead).toBe("arrow");
  });

  it("when layer.points of a line layer is not an array", () => {
    const lineLayer: any = API.createLayer({
      type: "line",
      width: 100,
      height: 200
    });

    lineLayer.points = "not an array";

    const expectedLinePoints = [
      [0, 0],
      [lineLayer.width, lineLayer.height]
    ];

    const restoredLine = restore.restoreLayers(
      [lineLayer],
      null
    )[0] as ExcalidrawLinearLayer;

    expect(restoredLine.points).toMatchObject(expectedLinePoints);
  });

  it("when the number of points of a line is greater or equal 2", () => {
    const lineLayer_0 = API.createLayer({
      type: "line",
      width: 100,
      height: 200,
      x: 10,
      y: 20
    });
    const lineLayer_1 = API.createLayer({
      type: "line",
      width: 200,
      height: 400,
      x: 30,
      y: 40
    });

    const pointsEl_0 = [
      [0, 0],
      [1, 1]
    ];
    Object.defineProperty(lineLayer_0, "points", {
      get: jest.fn(() => pointsEl_0)
    });

    const pointsEl_1 = [
      [3, 4],
      [5, 6]
    ];
    Object.defineProperty(lineLayer_1, "points", {
      get: jest.fn(() => pointsEl_1)
    });

    const restoredLayers = restore.restoreLayers(
      [lineLayer_0, lineLayer_1],
      null
    );

    const restoredLine_0 = restoredLayers[0] as ExcalidrawLinearLayer;
    const restoredLine_1 = restoredLayers[1] as ExcalidrawLinearLayer;

    expect(restoredLine_0.points).toMatchObject(pointsEl_0);

    const offsetX = pointsEl_1[0][0];
    const offsetY = pointsEl_1[0][1];
    const restoredPointsEl1 = [
      [pointsEl_1[0][0] - offsetX, pointsEl_1[0][1] - offsetY],
      [pointsEl_1[1][0] - offsetX, pointsEl_1[1][1] - offsetY]
    ];
    expect(restoredLine_1.points).toMatchObject(restoredPointsEl1);
    expect(restoredLine_1.x).toBe(lineLayer_1.x + offsetX);
    expect(restoredLine_1.y).toBe(lineLayer_1.y + offsetY);
  });

  it("should restore correctly with rectangle, ellipse and diamond layers", () => {
    const types = ["rectangle", "ellipse", "diamond"];

    const layers: ExcalidrawLayer[] = [];
    let idCount = 0;
    types.forEach((elType) => {
      idCount += 1;
      const layer = API.createLayer({
        type: elType as "rectangle" | "ellipse" | "diamond",
        id: idCount.toString(),
        fillStyle: "cross-hatch",
        strokeWidth: 2,
        strokeStyle: "dashed",
        roughness: 2,
        opacity: 10,
        x: 10,
        y: 20,
        strokeColor: "red",
        backgroundColor: "blue",
        width: 100,
        height: 200,
        groupIds: ["1", "2", "3"],
        roundness: { type: ROUNDNESS.PROPORTIONAL_RADIUS }
      });

      layers.push(layer);
    });

    const restoredLayers = restore.restoreLayers(layers, null);

    expect(restoredLayers[0]).toMatchSnapshot({ seed: expect.any(Number) });
    expect(restoredLayers[1]).toMatchSnapshot({ seed: expect.any(Number) });
    expect(restoredLayers[2]).toMatchSnapshot({ seed: expect.any(Number) });
  });

  it("bump versions of local duplicate layers when supplied", () => {
    const rectangle = API.createLayer({ type: "rectangle" });
    const ellipse = API.createLayer({ type: "ellipse" });
    const rectangle_modified = newLayerWith(rectangle, { isDeleted: true });

    const restoredLayers = restore.restoreLayers(
      [rectangle, ellipse],
      [rectangle_modified]
    );

    expect(restoredLayers[0].id).toBe(rectangle.id);
    expect(restoredLayers[0].versionNonce).not.toBe(rectangle.versionNonce);
    expect(restoredLayers).toEqual([
      expect.objectContaining({
        id: rectangle.id,
        version: rectangle_modified.version + 1
      }),
      expect.objectContaining({
        id: ellipse.id,
        version: ellipse.version,
        versionNonce: ellipse.versionNonce
      })
    ]);
  });
});

describe("restoreAppState", () => {
  it("should restore with imported data", () => {
    const stubImportedAppState = getDefaultAppState();
    stubImportedAppState.activeTool.type = "selection";
    stubImportedAppState.cursorButton = "down";
    stubImportedAppState.name = "imported app state";

    const stubLocalAppState = getDefaultAppState();
    stubLocalAppState.activeTool.type = "rectangle";
    stubLocalAppState.cursorButton = "up";
    stubLocalAppState.name = "local app state";

    const restoredAppState = restore.restoreAppState(
      stubImportedAppState,
      stubLocalAppState
    );
    expect(restoredAppState.activeTool).toEqual(
      stubImportedAppState.activeTool
    );
    expect(restoredAppState.cursorButton).toBe("up");
    expect(restoredAppState.name).toBe(stubImportedAppState.name);
  });

  it("should restore with current app state when imported data state is undefined", () => {
    const stubImportedAppState = {
      ...getDefaultAppState(),
      cursorButton: undefined,
      name: undefined
    };

    const stubLocalAppState = getDefaultAppState();
    stubLocalAppState.cursorButton = "down";
    stubLocalAppState.name = "local app state";

    const restoredAppState = restore.restoreAppState(
      stubImportedAppState,
      stubLocalAppState
    );
    expect(restoredAppState.cursorButton).toBe(stubLocalAppState.cursorButton);
    expect(restoredAppState.name).toBe(stubLocalAppState.name);
  });

  it("should return imported data when local app state is null", () => {
    const stubImportedAppState = getDefaultAppState();
    stubImportedAppState.cursorButton = "down";
    stubImportedAppState.name = "imported app state";

    const restoredAppState = restore.restoreAppState(
      stubImportedAppState,
      null
    );
    expect(restoredAppState.cursorButton).toBe("up");
    expect(restoredAppState.name).toBe(stubImportedAppState.name);
  });

  it("should return local app state when imported data state is null", () => {
    const stubLocalAppState = getDefaultAppState();
    stubLocalAppState.cursorButton = "down";
    stubLocalAppState.name = "local app state";

    const restoredAppState = restore.restoreAppState(null, stubLocalAppState);
    expect(restoredAppState.cursorButton).toBe(stubLocalAppState.cursorButton);
    expect(restoredAppState.name).toBe(stubLocalAppState.name);
  });

  it("should return default app state when imported data state and local app state are undefined", () => {
    const stubImportedAppState = {
      ...getDefaultAppState(),
      cursorButton: undefined
    };

    const stubLocalAppState = {
      ...getDefaultAppState(),
      cursorButton: undefined
    };

    const restoredAppState = restore.restoreAppState(
      stubImportedAppState,
      stubLocalAppState
    );
    expect(restoredAppState.cursorButton).toBe(
      getDefaultAppState().cursorButton
    );
  });

  it("should return default app state when imported data state and local app state are null", () => {
    const restoredAppState = restore.restoreAppState(null, null);
    expect(restoredAppState.cursorButton).toBe(
      getDefaultAppState().cursorButton
    );
  });

  it("when imported data state has a not allowed Excalidraw Layer Types", () => {
    const stubImportedAppState: any = getDefaultAppState();

    stubImportedAppState.activeTool = "not allowed Excalidraw Layer Types";
    const stubLocalAppState = getDefaultAppState();

    const restoredAppState = restore.restoreAppState(
      stubImportedAppState,
      stubLocalAppState
    );
    expect(restoredAppState.activeTool.type).toBe("selection");
  });

  describe("with zoom in imported data state", () => {
    it("when imported data state has zoom as a number", () => {
      const stubImportedAppState: any = getDefaultAppState();

      stubImportedAppState.zoom = 10;

      const stubLocalAppState = getDefaultAppState();

      const restoredAppState = restore.restoreAppState(
        stubImportedAppState,
        stubLocalAppState
      );

      expect(restoredAppState.zoom.value).toBe(10);
    });

    it("when the zoom of imported data state is not a number", () => {
      const stubImportedAppState = getDefaultAppState();
      stubImportedAppState.zoom = {
        value: 10 as NormalizedZoomValue
      };

      const stubLocalAppState = getDefaultAppState();

      const restoredAppState = restore.restoreAppState(
        stubImportedAppState,
        stubLocalAppState
      );

      expect(restoredAppState.zoom.value).toBe(10);
      expect(restoredAppState.zoom).toMatchObject(stubImportedAppState.zoom);
    });

    it("when the zoom of imported data state zoom is null", () => {
      const stubImportedAppState = getDefaultAppState();

      Object.defineProperty(stubImportedAppState, "zoom", {
        get: jest.fn(() => null)
      });

      const stubLocalAppState = getDefaultAppState();

      const restoredAppState = restore.restoreAppState(
        stubImportedAppState,
        stubLocalAppState
      );

      expect(restoredAppState.zoom).toMatchObject(getDefaultAppState().zoom);
    });
  });

  it("should handle editorState.openSidebar legacy values", () => {
    expect(restore.restoreAppState({}, null).openSidebar).toBe(null);
    expect(
      restore.restoreAppState({ openSidebar: "library" } as any, null)
        .openSidebar
    ).toEqual({ name: DEFAULT_SIDEBAR.name });
    expect(
      restore.restoreAppState({ openSidebar: "xxx" } as any, null).openSidebar
    ).toEqual({ name: DEFAULT_SIDEBAR.name });
    // while "library" was our legacy sidebar name, we can't assume it's legacy
    // value as it may be some host app's custom sidebar name ¯\_(ツ)_/¯
    expect(
      restore.restoreAppState({ openSidebar: { name: "library" } } as any, null)
        .openSidebar
    ).toEqual({ name: "library" });
    expect(
      restore.restoreAppState(
        { openSidebar: { name: DEFAULT_SIDEBAR.name, tab: "ola" } } as any,
        null
      ).openSidebar
    ).toEqual({ name: DEFAULT_SIDEBAR.name, tab: "ola" });
  });
});

describe("restore", () => {
  it("when imported data state is null it should return an empty array of layers", () => {
    const stubLocalAppState = getDefaultAppState();

    const restoredData = restore.restore(null, stubLocalAppState, null);
    expect(restoredData.layers.length).toBe(0);
  });

  it("when imported data state is null it should return the local app state property", () => {
    const stubLocalAppState = getDefaultAppState();
    stubLocalAppState.cursorButton = "down";
    stubLocalAppState.name = "local app state";

    const restoredData = restore.restore(null, stubLocalAppState, null);
    expect(restoredData.editorState.cursorButton).toBe(
      stubLocalAppState.cursorButton
    );
    expect(restoredData.editorState.name).toBe(stubLocalAppState.name);
  });

  it("when imported data state has layers", () => {
    const stubLocalAppState = getDefaultAppState();

    const textLayer = API.createLayer({ type: "text" });
    const rectLayer = API.createLayer({ type: "rectangle" });
    const layers = [textLayer, rectLayer];

    const importedDataState = {} as ImportedDataState;
    importedDataState.layers = layers;

    const restoredData = restore.restore(
      importedDataState,
      stubLocalAppState,
      null
    );
    expect(restoredData.layers.length).toBe(layers.length);
  });

  it("when local app state is null but imported app state is supplied", () => {
    const stubImportedAppState = getDefaultAppState();
    stubImportedAppState.cursorButton = "down";
    stubImportedAppState.name = "imported app state";

    const importedDataState = {} as ImportedDataState;
    importedDataState.editorState = stubImportedAppState;

    const restoredData = restore.restore(importedDataState, null, null);
    expect(restoredData.editorState.cursorButton).toBe("up");
    expect(restoredData.editorState.name).toBe(stubImportedAppState.name);
  });

  it("bump versions of local duplicate layers when supplied", () => {
    const rectangle = API.createLayer({ type: "rectangle" });
    const ellipse = API.createLayer({ type: "ellipse" });

    const rectangle_modified = newLayerWith(rectangle, { isDeleted: true });

    const restoredData = restore.restore(
      { layers: [rectangle, ellipse] },
      null,
      [rectangle_modified]
    );

    expect(restoredData.layers[0].id).toBe(rectangle.id);
    expect(restoredData.layers[0].versionNonce).not.toBe(
      rectangle.versionNonce
    );
    expect(restoredData.layers).toEqual([
      expect.objectContaining({ version: rectangle_modified.version + 1 }),
      expect.objectContaining({
        id: ellipse.id,
        version: ellipse.version,
        versionNonce: ellipse.versionNonce
      })
    ]);
  });
});

describe("repairing bindings", () => {
  it("should repair container boundLayers when repair is true", () => {
    const container = API.createLayer({
      type: "rectangle",
      boundLayers: []
    });
    const boundLayer = API.createLayer({
      type: "text",
      containerId: container.id
    });

    expect(container.boundLayers).toEqual([]);

    let restoredLayers = restore.restoreLayers([container, boundLayer], null);

    expect(restoredLayers).toEqual([
      expect.objectContaining({
        id: container.id,
        boundLayers: []
      }),
      expect.objectContaining({
        id: boundLayer.id,
        containerId: container.id
      })
    ]);

    restoredLayers = restore.restoreLayers([container, boundLayer], null, {
      repairBindings: true
    });

    expect(restoredLayers).toEqual([
      expect.objectContaining({
        id: container.id,
        boundLayers: [{ type: boundLayer.type, id: boundLayer.id }]
      }),
      expect.objectContaining({
        id: boundLayer.id,
        containerId: container.id
      })
    ]);
  });

  it("should repair containerId of boundLayers when repair is true", () => {
    const boundLayer = API.createLayer({
      type: "text",
      containerId: null
    });
    const container = API.createLayer({
      type: "rectangle",
      boundLayers: [{ type: boundLayer.type, id: boundLayer.id }]
    });

    let restoredLayers = restore.restoreLayers([container, boundLayer], null);

    expect(restoredLayers).toEqual([
      expect.objectContaining({
        id: container.id,
        boundLayers: [{ type: boundLayer.type, id: boundLayer.id }]
      }),
      expect.objectContaining({
        id: boundLayer.id,
        containerId: null
      })
    ]);

    restoredLayers = restore.restoreLayers([container, boundLayer], null, {
      repairBindings: true
    });

    expect(restoredLayers).toEqual([
      expect.objectContaining({
        id: container.id,
        boundLayers: [{ type: boundLayer.type, id: boundLayer.id }]
      }),
      expect.objectContaining({
        id: boundLayer.id,
        containerId: container.id
      })
    ]);
  });

  it("should ignore bound layer if deleted", () => {
    const container = API.createLayer({
      type: "rectangle",
      boundLayers: []
    });
    const boundLayer = API.createLayer({
      type: "text",
      containerId: container.id,
      isDeleted: true
    });

    expect(container.boundLayers).toEqual([]);

    const restoredLayers = restore.restoreLayers([container, boundLayer], null);

    expect(restoredLayers).toEqual([
      expect.objectContaining({
        id: container.id,
        boundLayers: []
      }),
      expect.objectContaining({
        id: boundLayer.id,
        containerId: container.id
      })
    ]);
  });

  it("should remove bindings of deleted layers from boundLayers when repair is true", () => {
    const container = API.createLayer({
      type: "rectangle",
      boundLayers: []
    });
    const boundLayer = API.createLayer({
      type: "text",
      containerId: container.id,
      isDeleted: true
    });
    const invisibleBoundLayer = API.createLayer({
      type: "text",
      containerId: container.id,
      width: 0,
      height: 0
    });

    const obsoleteBinding = { type: boundLayer.type, id: boundLayer.id };
    const invisibleBinding = {
      type: invisibleBoundLayer.type,
      id: invisibleBoundLayer.id
    };
    expect(container.boundLayers).toEqual([]);

    const nonExistentBinding = { type: "text", id: "non-existent" };
    // @ts-ignore
    container.boundLayers = [
      obsoleteBinding,
      invisibleBinding,
      nonExistentBinding
    ];

    let restoredLayers = restore.restoreLayers(
      [container, invisibleBoundLayer, boundLayer],
      null
    );

    expect(restoredLayers).toEqual([
      expect.objectContaining({
        id: container.id,
        boundLayers: [obsoleteBinding, invisibleBinding, nonExistentBinding]
      }),
      expect.objectContaining({
        id: boundLayer.id,
        containerId: container.id
      })
    ]);

    restoredLayers = restore.restoreLayers(
      [container, invisibleBoundLayer, boundLayer],
      null,
      { repairBindings: true }
    );

    expect(restoredLayers).toEqual([
      expect.objectContaining({
        id: container.id,
        boundLayers: []
      }),
      expect.objectContaining({
        id: boundLayer.id,
        containerId: container.id
      })
    ]);
  });

  it("should remove containerId if container not exists when repair is true", () => {
    const boundLayer = API.createLayer({
      type: "text",
      containerId: "non-existent"
    });
    const boundLayerDeleted = API.createLayer({
      type: "text",
      containerId: "non-existent",
      isDeleted: true
    });

    let restoredLayers = restore.restoreLayers(
      [boundLayer, boundLayerDeleted],
      null
    );

    expect(restoredLayers).toEqual([
      expect.objectContaining({
        id: boundLayer.id,
        containerId: "non-existent"
      }),
      expect.objectContaining({
        id: boundLayerDeleted.id,
        containerId: "non-existent"
      })
    ]);

    restoredLayers = restore.restoreLayers(
      [boundLayer, boundLayerDeleted],
      null,
      { repairBindings: true }
    );

    expect(restoredLayers).toEqual([
      expect.objectContaining({
        id: boundLayer.id,
        containerId: null
      }),
      expect.objectContaining({
        id: boundLayerDeleted.id,
        containerId: null
      })
    ]);
  });
});
