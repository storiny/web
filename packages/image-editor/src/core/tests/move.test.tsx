import React from "react";
import ReactDOM from "react-dom";

import ExcalidrawApp from "../excalidraw-app";
import { KEYS } from "../keys";
import { bindOrUnbindLinearLayer } from "../layer/binding";
import {
  ExcalidrawLinearLayer,
  ExcalidrawRectangleLayer,
  NonDeleted
} from "../layer/types";
import { reseed } from "../random";
import * as Renderer from "../renderer/renderScene";
import { Keyboard, Pointer, UI } from "./helpers/ui";
import { fireEvent, render } from "./test-utils";

// Unmount ReactDOM from root
ReactDOM.unmountComponentAtNode(document.getLayerById("root")!);

const renderScene = jest.spyOn(Renderer, "renderScene");
beforeEach(() => {
  localStorage.clear();
  renderScene.mockClear();
  reseed(7);
});

const { h } = window;

describe("move layer", () => {
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

      expect(renderScene).toHaveBeenCalledTimes(9);
      expect(h.state.selectionLayer).toBeNull();
      expect(h.layers.length).toEqual(1);
      expect(h.state.selectedLayerIds[h.layers[0].id]).toBeTruthy();
      expect([h.layers[0].x, h.layers[0].y]).toEqual([30, 20]);

      renderScene.mockClear();
    }

    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 20 });
    fireEvent.pointerMove(canvas, { clientX: 20, clientY: 40 });
    fireEvent.pointerUp(canvas);

    expect(renderScene).toHaveBeenCalledTimes(3);
    expect(h.state.selectionLayer).toBeNull();
    expect(h.layers.length).toEqual(1);
    expect([h.layers[0].x, h.layers[0].y]).toEqual([0, 40]);

    h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
  });

  it("rectangles with binding arrow", async () => {
    await render(<ExcalidrawApp />);

    // create layers
    const rectA = UI.createLayer("rectangle", { size: 100 });
    const rectB = UI.createLayer("rectangle", { x: 200, y: 0, size: 300 });
    const line = UI.createLayer("line", { x: 110, y: 50, size: 80 });

    // bind line to two rectangles
    bindOrUnbindLinearLayer(
      line.get() as NonDeleted<ExcalidrawLinearLayer>,
      rectA.get() as ExcalidrawRectangleLayer,
      rectB.get() as ExcalidrawRectangleLayer
    );

    // select the second rectangles
    new Pointer("mouse").clickOn(rectB);

    expect(renderScene).toHaveBeenCalledTimes(23);
    expect(h.state.selectionLayer).toBeNull();
    expect(h.layers.length).toEqual(3);
    expect(h.state.selectedLayerIds[rectB.id]).toBeTruthy();
    expect([rectA.x, rectA.y]).toEqual([0, 0]);
    expect([rectB.x, rectB.y]).toEqual([200, 0]);
    expect([line.x, line.y]).toEqual([110, 50]);
    expect([line.width, line.height]).toEqual([80, 80]);

    renderScene.mockClear();

    // Move selected rectangle
    Keyboard.keyDown(KEYS.ARROW_RIGHT);
    Keyboard.keyDown(KEYS.ARROW_DOWN);
    Keyboard.keyDown(KEYS.ARROW_DOWN);

    // Check that the arrow size has been changed according to moving the rectangle
    expect(renderScene).toHaveBeenCalledTimes(3);
    expect(h.state.selectionLayer).toBeNull();
    expect(h.layers.length).toEqual(3);
    expect(h.state.selectedLayerIds[rectB.id]).toBeTruthy();
    expect([rectA.x, rectA.y]).toEqual([0, 0]);
    expect([rectB.x, rectB.y]).toEqual([201, 2]);
    expect([Math.round(line.x), Math.round(line.y)]).toEqual([110, 50]);
    expect([Math.round(line.width), Math.round(line.height)]).toEqual([81, 81]);

    h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
  });
});

describe("duplicate layer on move when ALT is clicked", () => {
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

      expect(renderScene).toHaveBeenCalledTimes(9);
      expect(h.state.selectionLayer).toBeNull();
      expect(h.layers.length).toEqual(1);
      expect(h.state.selectedLayerIds[h.layers[0].id]).toBeTruthy();
      expect([h.layers[0].x, h.layers[0].y]).toEqual([30, 20]);

      renderScene.mockClear();
    }

    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 20 });
    fireEvent.pointerMove(canvas, { clientX: 20, clientY: 40, altKey: true });

    // firing another pointerMove event with alt key pressed should NOT trigger
    // another duplication
    fireEvent.pointerMove(canvas, { clientX: 20, clientY: 40, altKey: true });
    fireEvent.pointerMove(canvas, { clientX: 10, clientY: 60 });
    fireEvent.pointerUp(canvas);

    // TODO: This used to be 4, but binding made it go up to 5. Do we need
    // that additional render?
    expect(renderScene).toHaveBeenCalledTimes(5);
    expect(h.state.selectionLayer).toBeNull();
    expect(h.layers.length).toEqual(2);

    // previous layer should stay intact
    expect([h.layers[0].x, h.layers[0].y]).toEqual([30, 20]);
    expect([h.layers[1].x, h.layers[1].y]).toEqual([-10, 60]);

    h.layers.forEach((layer) => expect(layer).toMatchSnapshot());
  });
});
