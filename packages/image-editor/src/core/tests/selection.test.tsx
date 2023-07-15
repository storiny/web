import ReactDOM from "react-dom";

import ExcalidrawApp from "../excalidraw-app";
import { KEYS } from "../keys";
import { reseed } from "../random";
import * as Renderer from "../renderer/renderScene";
import { SHAPES } from "../shapes";
import { API } from "./helpers/api";
import { Keyboard, Pointer, UI } from "./helpers/ui";
import {
  assertSelectedLayers,
  fireEvent,
  mockBoundingClientRect,
  render,
  restoreOriginalGetBoundingClientRect
} from "./test-utils";

// Unmount ReactDOM from root
ReactDOM.unmountComponentAtNode(document.getLayerById("root")!);

const renderScene = jest.spyOn(Renderer, "renderScene");
beforeEach(() => {
  localStorage.clear();
  renderScene.mockClear();
  reseed(7);
});

const { h } = window;

const mouse = new Pointer("mouse");

describe("inner box-selection", () => {
  beforeEach(async () => {
    await render(<ExcalidrawApp />);
  });
  it("selecting layers visually nested inside another", async () => {
    const rect1 = API.createLayer({
      type: "rectangle",
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      backgroundColor: "red",
      fillStyle: "solid"
    });
    const rect2 = API.createLayer({
      type: "rectangle",
      x: 50,
      y: 50,
      width: 50,
      height: 50
    });
    const rect3 = API.createLayer({
      type: "rectangle",
      x: 150,
      y: 150,
      width: 50,
      height: 50
    });
    h.layers = [rect1, rect2, rect3];
    Keyboard.withModifierKeys({ ctrl: true }, () => {
      mouse.downAt(40, 40);
      mouse.moveTo(290, 290);
      mouse.up();

      assertSelectedLayers([rect2.id, rect3.id]);
    });
  });

  it("selecting grouped layers visually nested inside another", async () => {
    const rect1 = API.createLayer({
      type: "rectangle",
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      backgroundColor: "red",
      fillStyle: "solid"
    });
    const rect2 = API.createLayer({
      type: "rectangle",
      x: 50,
      y: 50,
      width: 50,
      height: 50,
      groupIds: ["A"]
    });
    const rect3 = API.createLayer({
      type: "rectangle",
      x: 150,
      y: 150,
      width: 50,
      height: 50,
      groupIds: ["A"]
    });
    h.layers = [rect1, rect2, rect3];

    Keyboard.withModifierKeys({ ctrl: true }, () => {
      mouse.downAt(40, 40);
      mouse.moveTo(rect2.x + rect2.width + 10, rect2.y + rect2.height + 10);
      mouse.up();

      assertSelectedLayers([rect2.id, rect3.id]);
      expect(h.state.selectedGroupIds).toEqual({ A: true });
    });
  });

  it("selecting & deselecting grouped layers visually nested inside another", async () => {
    const rect1 = API.createLayer({
      type: "rectangle",
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      backgroundColor: "red",
      fillStyle: "solid"
    });
    const rect2 = API.createLayer({
      type: "rectangle",
      x: 50,
      y: 50,
      width: 50,
      height: 50,
      groupIds: ["A"]
    });
    const rect3 = API.createLayer({
      type: "rectangle",
      x: 150,
      y: 150,
      width: 50,
      height: 50,
      groupIds: ["A"]
    });
    h.layers = [rect1, rect2, rect3];
    Keyboard.withModifierKeys({ ctrl: true }, () => {
      mouse.downAt(rect2.x - 20, rect2.x - 20);
      mouse.moveTo(rect2.x + rect2.width + 10, rect2.y + rect2.height + 10);
      assertSelectedLayers([rect2.id, rect3.id]);
      expect(h.state.selectedGroupIds).toEqual({ A: true });
      mouse.moveTo(rect2.x - 10, rect2.y - 10);
      assertSelectedLayers([rect1.id]);
      expect(h.state.selectedGroupIds).toEqual({});
      mouse.up();
    });
  });
});

describe("selection layer", () => {
  it("create selection layer on pointer down", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    // select tool
    const tool = getByToolName("selection");
    fireEvent.click(tool);

    const canvas = container.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 60, clientY: 100 });

    expect(renderScene).toHaveBeenCalledTimes(5);
    const selectionLayer = h.state.selectionLayer!;
    expect(selectionLayer).not.toBeNull();
    expect(selectionLayer.type).toEqual("selection");
    expect([selectionLayer.x, selectionLayer.y]).toEqual([60, 100]);
    expect([selectionLayer.width, selectionLayer.height]).toEqual([0, 0]);

    // TODO: There is a memory leak if pointer up is not triggered
    fireEvent.pointerUp(canvas);
  });

  it("resize selection layer on pointer move", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    // select tool
    const tool = getByToolName("selection");
    fireEvent.click(tool);

    const canvas = container.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 60, clientY: 100 });
    fireEvent.pointerMove(canvas, { clientX: 150, clientY: 30 });

    expect(renderScene).toHaveBeenCalledTimes(6);
    const selectionLayer = h.state.selectionLayer!;
    expect(selectionLayer).not.toBeNull();
    expect(selectionLayer.type).toEqual("selection");
    expect([selectionLayer.x, selectionLayer.y]).toEqual([60, 30]);
    expect([selectionLayer.width, selectionLayer.height]).toEqual([90, 70]);

    // TODO: There is a memory leak if pointer up is not triggered
    fireEvent.pointerUp(canvas);
  });

  it("remove selection layer on pointer up", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    // select tool
    const tool = getByToolName("selection");
    fireEvent.click(tool);

    const canvas = container.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 60, clientY: 100 });
    fireEvent.pointerMove(canvas, { clientX: 150, clientY: 30 });
    fireEvent.pointerUp(canvas);

    expect(renderScene).toHaveBeenCalledTimes(7);
    expect(h.state.selectionLayer).toBeNull();
  });
});

describe("select single layer on the scene", () => {
  beforeAll(() => {
    mockBoundingClientRect();
  });

  afterAll(() => {
    restoreOriginalGetBoundingClientRect();
  });

  it("rectangle", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    const canvas = container.querySelector("canvas")!;
    {
      // create layer
      const tool = getByToolName("rectangle");
      fireEvent.click(tool);
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70 });
      fireEvent.pointerUp(canvas);
      fireEvent.keyDown(document, {
        key: KEYS.ESCAPE
      });
    }

    const tool = getByToolName("selection");
    fireEvent.click(tool);
    // click on a line on the rectangle
    fireEvent.pointerDown(canvas, { clientX: 45, clientY: 20 });
    fireEvent.pointerUp(canvas);

    expect(renderScene).toHaveBeenCalledTimes(11);
    expect(h.state.selectionLayer).toBeNull();
    expect(h.layers.length).toEqual(1);
    expect(h.state.selectedLayerIds[h.layers[0].id]).toBeTruthy();

    h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
  });

  it("diamond", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    const canvas = container.querySelector("canvas")!;
    {
      // create layer
      const tool = getByToolName("diamond");
      fireEvent.click(tool);
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70 });
      fireEvent.pointerUp(canvas);
      fireEvent.keyDown(document, {
        key: KEYS.ESCAPE
      });
    }

    const tool = getByToolName("selection");
    fireEvent.click(tool);
    // click on a line on the rectangle
    fireEvent.pointerDown(canvas, { clientX: 45, clientY: 20 });
    fireEvent.pointerUp(canvas);

    expect(renderScene).toHaveBeenCalledTimes(11);
    expect(h.state.selectionLayer).toBeNull();
    expect(h.layers.length).toEqual(1);
    expect(h.state.selectedLayerIds[h.layers[0].id]).toBeTruthy();

    h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
  });

  it("ellipse", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    const canvas = container.querySelector("canvas")!;
    {
      // create layer
      const tool = getByToolName("ellipse");
      fireEvent.click(tool);
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70 });
      fireEvent.pointerUp(canvas);
      fireEvent.keyDown(document, {
        key: KEYS.ESCAPE
      });
    }

    const tool = getByToolName("selection");
    fireEvent.click(tool);
    // click on a line on the rectangle
    fireEvent.pointerDown(canvas, { clientX: 45, clientY: 20 });
    fireEvent.pointerUp(canvas);

    expect(renderScene).toHaveBeenCalledTimes(11);
    expect(h.state.selectionLayer).toBeNull();
    expect(h.layers.length).toEqual(1);
    expect(h.state.selectedLayerIds[h.layers[0].id]).toBeTruthy();

    h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
  });

  it("arrow", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    const canvas = container.querySelector("canvas")!;
    {
      // create layer
      const tool = getByToolName("arrow");
      fireEvent.click(tool);
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70 });
      fireEvent.pointerUp(canvas);
      fireEvent.keyDown(document, {
        key: KEYS.ESCAPE
      });
    }

    /*
        1 2 3 4 5 6 7 8 9
      1
      2     x
      3
      4       .
      5
      6
      7           x
      8
      9
    */

    const tool = getByToolName("selection");
    fireEvent.click(tool);
    // click on a line on the arrow
    fireEvent.pointerDown(canvas, { clientX: 40, clientY: 40 });
    fireEvent.pointerUp(canvas);

    expect(renderScene).toHaveBeenCalledTimes(11);
    expect(h.state.selectionLayer).toBeNull();
    expect(h.layers.length).toEqual(1);
    expect(h.state.selectedLayerIds[h.layers[0].id]).toBeTruthy();
    h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
  });

  it("arrow escape", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    const canvas = container.querySelector("canvas")!;
    {
      // create layer
      const tool = getByToolName("line");
      fireEvent.click(tool);
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70 });
      fireEvent.pointerUp(canvas);
      fireEvent.keyDown(document, {
        key: KEYS.ESCAPE
      });
    }

    /*
        1 2 3 4 5 6 7 8 9
      1
      2     x
      3
      4       .
      5
      6
      7           x
      8
      9
    */

    const tool = getByToolName("selection");
    fireEvent.click(tool);
    // click on a line on the arrow
    fireEvent.pointerDown(canvas, { clientX: 40, clientY: 40 });
    fireEvent.pointerUp(canvas);

    expect(renderScene).toHaveBeenCalledTimes(11);
    expect(h.state.selectionLayer).toBeNull();
    expect(h.layers.length).toEqual(1);
    expect(h.state.selectedLayerIds[h.layers[0].id]).toBeTruthy();

    h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
  });
});

describe("tool locking & selection", () => {
  it("should not select newly created layer while tool is locked", async () => {
    await render(<ExcalidrawApp />);

    UI.clickTool("lock");
    expect(h.state.activeTool.locked).toBe(true);

    for (const { value } of Object.values(SHAPES)) {
      if (value !== "image" && value !== "selection") {
        const layer = UI.createLayer(value);
        expect(h.state.selectedLayerIds[layer.id]).not.toBe(true);
      }
    }
  });
});
