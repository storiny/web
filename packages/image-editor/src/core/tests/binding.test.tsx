import { actionWrapTextInContainer } from "../actions/actionBoundText";
import ExcalidrawApp from "../excalidraw-app";
import { KEYS } from "../keys";
import { getTransformHandles } from "../layer/transformHandles";
import { API } from "./helpers/api";
import { Keyboard, Pointer, UI } from "./helpers/ui";
import { fireEvent, render } from "./test-utils";

const { h } = window;

const mouse = new Pointer("mouse");

describe("layer binding", () => {
  beforeEach(async () => {
    await render(<ExcalidrawApp />);
  });

  //@TODO fix the test with rotation
  it.skip("rotation of arrow should rebind both ends", () => {
    const rectLeft = UI.createLayer("rectangle", {
      x: 0,
      width: 200,
      height: 500
    });
    const rectRight = UI.createLayer("rectangle", {
      x: 400,
      width: 200,
      height: 500
    });
    const arrow = UI.createLayer("arrow", {
      x: 210,
      y: 250,
      width: 180,
      height: 1
    });
    expect(arrow.startBinding?.layerId).toBe(rectLeft.id);
    expect(arrow.endBinding?.layerId).toBe(rectRight.id);

    const rotation = getTransformHandles(arrow, h.state.zoom, "mouse")
      .rotation!;
    const rotationHandleX = rotation[0] + rotation[2] / 2;
    const rotationHandleY = rotation[1] + rotation[3] / 2;
    mouse.down(rotationHandleX, rotationHandleY);
    mouse.move(300, 400);
    mouse.up();
    expect(arrow.angle).toBeGreaterThan(0.7 * Math.PI);
    expect(arrow.angle).toBeLessThan(1.3 * Math.PI);
    expect(arrow.startBinding?.layerId).toBe(rectRight.id);
    expect(arrow.endBinding?.layerId).toBe(rectLeft.id);
  });

  // TODO fix & reenable once we rewrite tests to work with concurrency
  it.skip(
    "editing arrow and moving its head to bind it to layer A, finalizing the" +
      "editing by clicking on layer A should end up selecting A",
    async () => {
      UI.createLayer("rectangle", {
        y: 0,
        size: 100
      });
      // Create arrow bound to rectangle
      UI.clickTool("arrow");
      mouse.down(50, -100);
      mouse.up(0, 80);

      // Edit arrow with multi-point
      mouse.doubleClick();
      // move arrow head
      mouse.down();
      mouse.up(0, 10);
      expect(API.getSelectedLayer().type).toBe("arrow");

      // NOTE this mouse down/up + await needs to be done in order to repro
      // the issue, due to https://github.com/excalidraw/excalidraw/blob/46bff3daceb602accf60c40a84610797260fca94/src/components/App.tsx#L740
      mouse.reset();
      expect(h.state.editingLinearLayer).not.toBe(null);
      mouse.down(0, 0);
      await new Promise((r) => setTimeout(r, 100));
      expect(h.state.editingLinearLayer).toBe(null);
      expect(API.getSelectedLayer().type).toBe("rectangle");
      mouse.up();
      expect(API.getSelectedLayer().type).toBe("rectangle");
    }
  );

  it("should bind/unbind arrow when moving it with keyboard", () => {
    const rectangle = UI.createLayer("rectangle", {
      x: 75,
      y: 0,
      size: 100
    });

    // Creates arrow 1px away from bidding with rectangle
    const arrow = UI.createLayer("arrow", {
      x: 0,
      y: 0,
      size: 50
    });

    expect(arrow.endBinding).toBe(null);

    expect(API.getSelectedLayer().type).toBe("arrow");
    Keyboard.keyPress(KEYS.ARROW_RIGHT);
    expect(arrow.endBinding?.layerId).toBe(rectangle.id);

    Keyboard.keyPress(KEYS.ARROW_LEFT);
    expect(arrow.endBinding).toBe(null);
  });

  it("should unbind on bound layer deletion", () => {
    const rectangle = UI.createLayer("rectangle", {
      x: 60,
      y: 0,
      size: 100
    });

    const arrow = UI.createLayer("arrow", {
      x: 0,
      y: 0,
      size: 50
    });

    expect(arrow.endBinding?.layerId).toBe(rectangle.id);

    mouse.select(rectangle);
    expect(API.getSelectedLayer().type).toBe("rectangle");
    Keyboard.keyDown(KEYS.DELETE);
    expect(arrow.endBinding).toBe(null);
  });

  it("should unbind on text layer deletion by submitting empty text", async () => {
    const text = API.createLayer({
      type: "text",
      text: "ola",
      x: 60,
      y: 0,
      width: 100,
      height: 100
    });

    h.layers = [text];

    const arrow = UI.createLayer("arrow", {
      x: 0,
      y: 0,
      size: 50
    });

    expect(arrow.endBinding?.layerId).toBe(text.id);

    // edit text layer and submit
    // -------------------------------------------------------------------------

    UI.clickTool("text");

    mouse.clickAt(text.x + 50, text.y + 50);

    const editor = document.querySelector(
      ".excalidraw-textEditorContainer > textarea"
    ) as HTMLTextAreaLayer;

    expect(editor).not.toBe(null);

    fireEvent.change(editor, { target: { value: "" } });
    fireEvent.keyDown(editor, { key: KEYS.ESCAPE });

    expect(
      document.querySelector(".excalidraw-textEditorContainer > textarea")
    ).toBe(null);
    expect(arrow.endBinding).toBe(null);
  });

  it("should keep binding on text update", async () => {
    const text = API.createLayer({
      type: "text",
      text: "ola",
      x: 60,
      y: 0,
      width: 100,
      height: 100
    });

    h.layers = [text];

    const arrow = UI.createLayer("arrow", {
      x: 0,
      y: 0,
      size: 50
    });

    expect(arrow.endBinding?.layerId).toBe(text.id);

    // delete text layer by submitting empty text
    // -------------------------------------------------------------------------

    UI.clickTool("text");

    mouse.clickAt(text.x + 50, text.y + 50);
    const editor = document.querySelector(
      ".excalidraw-textEditorContainer > textarea"
    ) as HTMLTextAreaLayer;

    expect(editor).not.toBe(null);

    fireEvent.change(editor, { target: { value: "asdasdasdasdas" } });
    fireEvent.keyDown(editor, { key: KEYS.ESCAPE });

    expect(
      document.querySelector(".excalidraw-textEditorContainer > textarea")
    ).toBe(null);
    expect(arrow.endBinding?.layerId).toBe(text.id);
  });

  it("should update binding when text containerized", async () => {
    const rectangle1 = API.createLayer({
      type: "rectangle",
      id: "rectangle1",
      width: 100,
      height: 100,
      boundLayers: [
        { id: "arrow1", type: "arrow" },
        { id: "arrow2", type: "arrow" }
      ]
    });

    const arrow1 = API.createLayer({
      type: "arrow",
      id: "arrow1",
      points: [
        [0, 0],
        [0, -87.45777932247563]
      ],
      startBinding: {
        layerId: "rectangle1",
        focus: 0.2,
        gap: 7
      },
      endBinding: {
        layerId: "text1",
        focus: 0.2,
        gap: 7
      }
    });

    const arrow2 = API.createLayer({
      type: "arrow",
      id: "arrow2",
      points: [
        [0, 0],
        [0, -87.45777932247563]
      ],
      startBinding: {
        layerId: "text1",
        focus: 0.2,
        gap: 7
      },
      endBinding: {
        layerId: "rectangle1",
        focus: 0.2,
        gap: 7
      }
    });

    const text1 = API.createLayer({
      type: "text",
      id: "text1",
      text: "ola",
      boundLayers: [
        { id: "arrow1", type: "arrow" },
        { id: "arrow2", type: "arrow" }
      ]
    });

    h.layers = [rectangle1, arrow1, arrow2, text1];

    API.setSelectedLayers([text1]);

    expect(h.state.selectedLayerIds[text1.id]).toBe(true);

    h.app.actionManager.executeAction(actionWrapTextInContainer);

    // new text container will be placed before the text layer
    const container = h.layers.at(-2)!;

    expect(container.type).toBe("rectangle");
    expect(container.id).not.toBe(rectangle1.id);

    expect(container).toEqual(
      expect.objectContaining({
        boundLayers: expect.arrayContaining([
          {
            type: "text",
            id: text1.id
          },
          {
            type: "arrow",
            id: arrow1.id
          },
          {
            type: "arrow",
            id: arrow2.id
          }
        ])
      })
    );

    expect(arrow1.startBinding?.layerId).toBe(rectangle1.id);
    expect(arrow1.endBinding?.layerId).toBe(container.id);
    expect(arrow2.startBinding?.layerId).toBe(container.id);
    expect(arrow2.endBinding?.layerId).toBe(rectangle1.id);
  });
});
