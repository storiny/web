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

describe("remove shape in non linear layers", () => {
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
    fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });
    fireEvent.pointerUp(canvas, { clientX: 30, clientY: 30 });

    expect(renderScene).toHaveBeenCalledTimes(7);
    expect(h.layers.length).toEqual(0);
  });

  it("ellipse", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    // select tool
    const tool = getByToolName("ellipse");
    fireEvent.click(tool);

    const canvas = container.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });
    fireEvent.pointerUp(canvas, { clientX: 30, clientY: 30 });

    expect(renderScene).toHaveBeenCalledTimes(7);
    expect(h.layers.length).toEqual(0);
  });

  it("diamond", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    // select tool
    const tool = getByToolName("diamond");
    fireEvent.click(tool);

    const canvas = container.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 30, clientY: 20 });
    fireEvent.pointerUp(canvas, { clientX: 30, clientY: 30 });

    expect(renderScene).toHaveBeenCalledTimes(7);
    expect(h.layers.length).toEqual(0);
  });
});

describe("multi point mode in linear layers", () => {
  it("arrow", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    // select tool
    const tool = getByToolName("arrow");
    fireEvent.click(tool);

    const canvas = container.querySelector("canvas")!;
    // first point is added on pointer down
    fireEvent.pointerDown(canvas, { clientX: 30, clientY: 30 });

    // second point, enable multi point
    fireEvent.pointerUp(canvas, { clientX: 30, clientY: 30 });
    fireEvent.pointerMove(canvas, { clientX: 50, clientY: 60 });

    // third point
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 60 });
    fireEvent.pointerUp(canvas);
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 140 });

    // done
    fireEvent.pointerDown(canvas);
    fireEvent.pointerUp(canvas);
    fireEvent.keyDown(document, {
      key: KEYS.ENTER
    });

    expect(renderScene).toHaveBeenCalledTimes(15);
    expect(h.layers.length).toEqual(1);

    const layer = h.layers[0] as ExcalidrawLinearLayer;

    expect(layer.type).toEqual("arrow");
    expect(layer.x).toEqual(30);
    expect(layer.y).toEqual(30);
    expect(layer.points).toEqual([
      [0, 0],
      [20, 30],
      [70, 110]
    ]);

    h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
  });

  it("line", async () => {
    const { getByToolName, container } = await render(<ExcalidrawApp />);
    // select tool
    const tool = getByToolName("line");
    fireEvent.click(tool);

    const canvas = container.querySelector("canvas")!;
    // first point is added on pointer down
    fireEvent.pointerDown(canvas, { clientX: 30, clientY: 30 });

    // second point, enable multi point
    fireEvent.pointerUp(canvas, { clientX: 30, clientY: 30 });
    fireEvent.pointerMove(canvas, { clientX: 50, clientY: 60 });

    // third point
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 60 });
    fireEvent.pointerUp(canvas);
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 140 });

    // done
    fireEvent.pointerDown(canvas);
    fireEvent.pointerUp(canvas);
    fireEvent.keyDown(document, {
      key: KEYS.ENTER
    });

    expect(renderScene).toHaveBeenCalledTimes(15);
    expect(h.layers.length).toEqual(1);

    const layer = h.layers[0] as ExcalidrawLinearLayer;

    expect(layer.type).toEqual("line");
    expect(layer.x).toEqual(30);
    expect(layer.y).toEqual(30);
    expect(layer.points).toEqual([
      [0, 0],
      [20, 30],
      [70, 110]
    ]);

    h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
  });
});
