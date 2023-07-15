import ExcalidrawApp from "../excalidraw-app";
import { API } from "./helpers/api";
import { render } from "./test-utils";

const { h } = window;

describe("fitToContent", () => {
  it("should zoom to fit the selected layer", async () => {
    await render(<ExcalidrawApp />);

    h.state.width = 10;
    h.state.height = 10;

    const rectLayer = API.createLayer({
      width: 50,
      height: 100,
      x: 50,
      y: 100
    });

    expect(h.state.zoom.value).toBe(1);

    h.app.scrollToContent(rectLayer, { fitToContent: true });

    // layer is 10x taller than the viewport size,
    // zoom should be at least 1/10
    expect(h.state.zoom.value).toBeLessThanOrEqual(0.1);
  });

  it("should zoom to fit multiple layers", async () => {
    await render(<ExcalidrawApp />);

    const topLeft = API.createLayer({
      width: 20,
      height: 20,
      x: 0,
      y: 0
    });

    const bottomRight = API.createLayer({
      width: 20,
      height: 20,
      x: 80,
      y: 80
    });

    h.state.width = 10;
    h.state.height = 10;

    expect(h.state.zoom.value).toBe(1);

    h.app.scrollToContent([topLeft, bottomRight], {
      fitToContent: true
    });

    // layers take 100x100, which is 10x bigger than the viewport size,
    // zoom should be at least 1/10
    expect(h.state.zoom.value).toBeLessThanOrEqual(0.1);
  });

  it("should scroll the viewport to the selected layer", async () => {
    await render(<ExcalidrawApp />);

    h.state.width = 10;
    h.state.height = 10;

    const rectLayer = API.createLayer({
      width: 100,
      height: 100,
      x: 100,
      y: 100
    });

    expect(h.state.zoom.value).toBe(1);
    expect(h.state.scrollX).toBe(0);
    expect(h.state.scrollY).toBe(0);

    h.app.scrollToContent(rectLayer);

    // zoom level should stay the same
    expect(h.state.zoom.value).toBe(1);

    // state should reflect some scrolling
    expect(h.state.scrollX).not.toBe(0);
    expect(h.state.scrollY).not.toBe(0);
  });
});

const waitForNextAnimationFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

describe("fitToContent animated", () => {
  beforeEach(() => {
    jest.spyOn(window, "requestAnimationFrame");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should ease scroll the viewport to the selected layer", async () => {
    await render(<ExcalidrawApp />);

    h.state.width = 10;
    h.state.height = 10;

    const rectLayer = API.createLayer({
      width: 100,
      height: 100,
      x: -100,
      y: -100
    });

    h.app.scrollToContent(rectLayer, { animate: true });

    expect(window.requestAnimationFrame).toHaveBeenCalled();

    // Since this is an animation, we expect values to change through time.
    // We'll verify that the scroll values change at 50ms and 100ms
    expect(h.state.scrollX).toBe(0);
    expect(h.state.scrollY).toBe(0);

    await waitForNextAnimationFrame();

    const prevScrollX = h.state.scrollX;
    const prevScrollY = h.state.scrollY;

    expect(h.state.scrollX).not.toBe(0);
    expect(h.state.scrollY).not.toBe(0);

    await waitForNextAnimationFrame();

    expect(h.state.scrollX).not.toBe(prevScrollX);
    expect(h.state.scrollY).not.toBe(prevScrollY);
  });

  it("should animate the scroll but not the zoom", async () => {
    await render(<ExcalidrawApp />);

    h.state.width = 50;
    h.state.height = 50;

    const rectLayer = API.createLayer({
      width: 100,
      height: 100,
      x: 100,
      y: 100
    });

    expect(h.state.scrollX).toBe(0);
    expect(h.state.scrollY).toBe(0);

    h.app.scrollToContent(rectLayer, { animate: true, fitToContent: true });

    expect(window.requestAnimationFrame).toHaveBeenCalled();

    await waitForNextAnimationFrame();

    const prevScrollX = h.state.scrollX;
    const prevScrollY = h.state.scrollY;

    expect(h.state.scrollX).not.toBe(0);
    expect(h.state.scrollY).not.toBe(0);

    await waitForNextAnimationFrame();

    expect(h.state.scrollX).not.toBe(prevScrollX);
    expect(h.state.scrollY).not.toBe(prevScrollY);
  });
});
