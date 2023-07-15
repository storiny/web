import ReactDOM from "react-dom";

import ExcalidrawApp from "../excalidraw-app";
import { KEYS } from "../keys";
import { ExcalidrawLinearLayer } from "../layer/types";
import { reseed } from "../random";
import * as Renderer from "../renderer/renderScene";
import {
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

describe("Test dragCreate", () => {
  describe("add layer to the scene when pointer dragging long enough", () => {
    it("rectangle", async () => {
      const { getByToolName, container } = await render(<ExcalidrawApp />);
      // select tool
      const tool = getByToolName("rectangle");
      fireEvent.click(tool);

      const canvas = container.querySelector("canvas")!;

      // start from (30, 20)
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });

      // move to (60,70)
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70 });

      // finish (position does not matter)
      fireEvent.pointerUp(canvas);

      expect(renderScene).toHaveBeenCalledTimes(9);
      expect(h.state.selectionLayer).toBeNull();

      expect(h.layers.length).toEqual(1);
      expect(h.layers[0].type).toEqual("rectangle");
      expect(h.layers[0].x).toEqual(30);
      expect(h.layers[0].y).toEqual(20);
      expect(h.layers[0].width).toEqual(30); // 60 - 30
      expect(h.layers[0].height).toEqual(50); // 70 - 20

      expect(h.layers.length).toMatchSnapshot();
      h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
    });

    it("ellipse", async () => {
      const { getByToolName, container } = await render(<ExcalidrawApp />);
      // select tool
      const tool = getByToolName("ellipse");
      fireEvent.click(tool);

      const canvas = container.querySelector("canvas")!;

      // start from (30, 20)
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });

      // move to (60,70)
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70 });

      // finish (position does not matter)
      fireEvent.pointerUp(canvas);

      expect(renderScene).toHaveBeenCalledTimes(9);
      expect(h.state.selectionLayer).toBeNull();

      expect(h.layers.length).toEqual(1);
      expect(h.layers[0].type).toEqual("ellipse");
      expect(h.layers[0].x).toEqual(30);
      expect(h.layers[0].y).toEqual(20);
      expect(h.layers[0].width).toEqual(30); // 60 - 30
      expect(h.layers[0].height).toEqual(50); // 70 - 20

      expect(h.layers.length).toMatchSnapshot();
      h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
    });

    it("diamond", async () => {
      const { getByToolName, container } = await render(<ExcalidrawApp />);
      // select tool
      const tool = getByToolName("diamond");
      fireEvent.click(tool);

      const canvas = container.querySelector("canvas")!;

      // start from (30, 20)
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });

      // move to (60,70)
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70 });

      // finish (position does not matter)
      fireEvent.pointerUp(canvas);

      expect(renderScene).toHaveBeenCalledTimes(9);
      expect(h.state.selectionLayer).toBeNull();

      expect(h.layers.length).toEqual(1);
      expect(h.layers[0].type).toEqual("diamond");
      expect(h.layers[0].x).toEqual(30);
      expect(h.layers[0].y).toEqual(20);
      expect(h.layers[0].width).toEqual(30); // 60 - 30
      expect(h.layers[0].height).toEqual(50); // 70 - 20

      expect(h.layers.length).toMatchSnapshot();
      h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
    });

    it("arrow", async () => {
      const { getByToolName, container } = await render(<ExcalidrawApp />);
      // select tool
      const tool = getByToolName("arrow");
      fireEvent.click(tool);

      const canvas = container.querySelector("canvas")!;

      // start from (30, 20)
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });

      // move to (60,70)
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70 });

      // finish (position does not matter)
      fireEvent.pointerUp(canvas);

      expect(renderScene).toHaveBeenCalledTimes(9);
      expect(h.state.selectionLayer).toBeNull();

      expect(h.layers.length).toEqual(1);

      const layer = h.layers[0] as ExcalidrawLinearLayer;

      expect(layer.type).toEqual("arrow");
      expect(layer.x).toEqual(30);
      expect(layer.y).toEqual(20);
      expect(layer.points.length).toEqual(2);
      expect(layer.points[0]).toEqual([0, 0]);
      expect(layer.points[1]).toEqual([30, 50]); // (60 - 30, 70 - 20)

      expect(h.layers.length).toMatchSnapshot();
      h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
    });

    it("line", async () => {
      const { getByToolName, container } = await render(<ExcalidrawApp />);
      // select tool
      const tool = getByToolName("line");
      fireEvent.click(tool);

      const canvas = container.querySelector("canvas")!;

      // start from (30, 20)
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });

      // move to (60,70)
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70 });

      // finish (position does not matter)
      fireEvent.pointerUp(canvas);

      expect(renderScene).toHaveBeenCalledTimes(9);
      expect(h.state.selectionLayer).toBeNull();

      expect(h.layers.length).toEqual(1);

      const layer = h.layers[0] as ExcalidrawLinearLayer;

      expect(layer.type).toEqual("line");
      expect(layer.x).toEqual(30);
      expect(layer.y).toEqual(20);
      expect(layer.points.length).toEqual(2);
      expect(layer.points[0]).toEqual([0, 0]);
      expect(layer.points[1]).toEqual([30, 50]); // (60 - 30, 70 - 20)

      h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
    });
  });

  describe("do not add layer to the scene if size is too small", () => {
    beforeAll(() => {
      mockBoundingClientRect();
    });
    afterAll(() => {
      restoreOriginalGetBoundingClientRect();
    });

    it("rectangle", async () => {
      const { getByToolName, container } = await render(<ExcalidrawApp />);
      // select tool
      const tool = getByToolName("rectangle");
      fireEvent.click(tool);

      const canvas = container.querySelector("canvas")!;

      // start from (30, 20)
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });

      // finish (position does not matter)
      fireEvent.pointerUp(canvas);

      expect(renderScene).toHaveBeenCalledTimes(7);
      expect(h.state.selectionLayer).toBeNull();
      expect(h.layers.length).toEqual(0);
    });

    it("ellipse", async () => {
      const { getByToolName, container } = await render(<ExcalidrawApp />);
      // select tool
      const tool = getByToolName("ellipse");
      fireEvent.click(tool);

      const canvas = container.querySelector("canvas")!;

      // start from (30, 20)
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });

      // finish (position does not matter)
      fireEvent.pointerUp(canvas);

      expect(renderScene).toHaveBeenCalledTimes(7);
      expect(h.state.selectionLayer).toBeNull();
      expect(h.layers.length).toEqual(0);
    });

    it("diamond", async () => {
      const { getByToolName, container } = await render(<ExcalidrawApp />);
      // select tool
      const tool = getByToolName("diamond");
      fireEvent.click(tool);

      const canvas = container.querySelector("canvas")!;

      // start from (30, 20)
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });

      // finish (position does not matter)
      fireEvent.pointerUp(canvas);

      expect(renderScene).toHaveBeenCalledTimes(7);
      expect(h.state.selectionLayer).toBeNull();
      expect(h.layers.length).toEqual(0);
    });

    it("arrow", async () => {
      const { getByToolName, container } = await render(<ExcalidrawApp />);
      // select tool
      const tool = getByToolName("arrow");
      fireEvent.click(tool);

      const canvas = container.querySelector("canvas")!;

      // start from (30, 20)
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });

      // finish (position does not matter)
      fireEvent.pointerUp(canvas);

      // we need to finalize it because arrows and lines enter multi-mode
      fireEvent.keyDown(document, {
        key: KEYS.ENTER
      });

      expect(renderScene).toHaveBeenCalledTimes(8);
      expect(h.state.selectionLayer).toBeNull();
      expect(h.layers.length).toEqual(0);
    });

    it("line", async () => {
      const { getByToolName, container } = await render(<ExcalidrawApp />);
      // select tool
      const tool = getByToolName("line");
      fireEvent.click(tool);

      const canvas = container.querySelector("canvas")!;

      // start from (30, 20)
      fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });

      // finish (position does not matter)
      fireEvent.pointerUp(canvas);

      // we need to finalize it because arrows and lines enter multi-mode
      fireEvent.keyDown(document, {
        key: KEYS.ENTER
      });

      expect(renderScene).toHaveBeenCalledTimes(8);
      expect(h.state.selectionLayer).toBeNull();
      expect(h.layers.length).toEqual(0);
    });
  });
});
