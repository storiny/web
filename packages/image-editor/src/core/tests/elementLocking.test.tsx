import ReactDOM from "react-dom";

import { actionSelectAll } from "../actions";
import ExcalidrawApp from "../excalidraw-app";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { mutateLayer } from "../layer/mutateLayer";
import { API } from "../tests/helpers/api";
import { Keyboard, Pointer, UI } from "../tests/helpers/ui";
import { render } from "../tests/test-utils";

ReactDOM.unmountComponentAtNode(document.getLayerById("root")!);

const mouse = new Pointer("mouse");
const h = window.h;

describe("layer locking", () => {
  beforeEach(async () => {
    await render(<ExcalidrawApp />);
    h.layers = [];
  });

  it("click-selecting a locked layer is disabled", () => {
    const lockedRectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid",
      locked: true
    });

    h.layers = [lockedRectangle];

    mouse.clickAt(50, 50);
    expect(API.getSelectedLayers().length).toBe(0);
  });

  it("box-selecting a locked layer is disabled", () => {
    const lockedRectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid",
      locked: true,
      x: 100,
      y: 100
    });

    h.layers = [lockedRectangle];

    mouse.downAt(50, 50);
    mouse.moveTo(250, 250);
    mouse.upAt(250, 250);
    expect(API.getSelectedLayers().length).toBe(0);
  });

  it("dragging a locked layer is disabled", () => {
    const lockedRectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid",
      locked: true
    });

    h.layers = [lockedRectangle];

    mouse.downAt(50, 50);
    mouse.moveTo(100, 100);
    mouse.upAt(100, 100);
    expect(lockedRectangle).toEqual(expect.objectContaining({ x: 0, y: 0 }));
  });

  it("you can drag layer that's below a locked layer", () => {
    const rectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid"
    });
    const lockedRectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid",
      locked: true
    });

    h.layers = [rectangle, lockedRectangle];

    mouse.downAt(50, 50);
    mouse.moveTo(100, 100);
    mouse.upAt(100, 100);
    expect(lockedRectangle).toEqual(expect.objectContaining({ x: 0, y: 0 }));
    expect(rectangle).toEqual(expect.objectContaining({ x: 50, y: 50 }));
    expect(API.getSelectedLayers().length).toBe(1);
    expect(API.getSelectedLayer().id).toBe(rectangle.id);
  });

  it("selectAll shouldn't select locked layers", () => {
    h.layers = [
      API.createLayer({ type: "rectangle" }),
      API.createLayer({ type: "rectangle", locked: true })
    ];
    h.app.actionManager.executeAction(actionSelectAll);
    expect(API.getSelectedLayers().length).toBe(1);
  });

  it("clicking on a locked layer should select the unlocked layer beneath it", () => {
    const rectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid"
    });
    const lockedRectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid",
      locked: true
    });

    h.layers = [rectangle, lockedRectangle];
    expect(API.getSelectedLayers().length).toBe(0);
    mouse.clickAt(50, 50);
    expect(API.getSelectedLayers().length).toBe(1);
    expect(API.getSelectedLayer().id).toBe(rectangle.id);
  });

  it("right-clicking on a locked layer should select it & open its contextMenu", () => {
    const rectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid"
    });
    const lockedRectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid",
      locked: true
    });

    h.layers = [rectangle, lockedRectangle];
    expect(API.getSelectedLayers().length).toBe(0);
    mouse.rightClickAt(50, 50);
    expect(API.getSelectedLayers().length).toBe(1);
    expect(API.getSelectedLayer().id).toBe(lockedRectangle.id);

    const contextMenu = UI.queryContextMenu();
    expect(contextMenu).not.toBeNull();
    expect(
      contextMenu?.querySelector(
        `li[data-testid="toggleLayerLock"] .context-menu-item__label`
      )
    ).toHaveTextContent(t("labels.layerLock.unlock"));
  });

  it("right-clicking on layer covered by locked layer should ignore the locked layer", () => {
    const rectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid"
    });
    const lockedRectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid",
      locked: true
    });

    h.layers = [rectangle, lockedRectangle];
    API.setSelectedLayers([rectangle]);
    expect(API.getSelectedLayers().length).toBe(1);
    expect(API.getSelectedLayer().id).toBe(rectangle.id);
    mouse.rightClickAt(50, 50);
    expect(API.getSelectedLayers().length).toBe(1);
    expect(API.getSelectedLayer().id).toBe(rectangle.id);

    const contextMenu = UI.queryContextMenu();
    expect(contextMenu).not.toBeNull();
  });

  it("selecting a group selects all layers including locked ones", () => {
    const rectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid",
      groupIds: ["g1"]
    });
    const lockedRectangle = API.createLayer({
      type: "rectangle",
      width: 100,
      backgroundColor: "red",
      fillStyle: "solid",
      locked: true,
      groupIds: ["g1"],
      x: 200,
      y: 200
    });

    h.layers = [rectangle, lockedRectangle];

    mouse.clickAt(250, 250);
    expect(API.getSelectedLayers().length).toBe(0);

    mouse.clickAt(50, 50);
    expect(API.getSelectedLayers().length).toBe(2);
  });

  it("should ignore locked text layer in center of container on ENTER", () => {
    const container = API.createLayer({
      type: "rectangle",
      width: 100
    });
    const textSize = 20;
    const text = API.createLayer({
      type: "text",
      text: "ola",
      x: container.width / 2 - textSize / 2,
      y: container.height / 2 - textSize / 2,
      width: textSize,
      height: textSize,
      containerId: container.id,
      locked: true
    });
    h.layers = [container, text];
    API.setSelectedLayers([container]);
    Keyboard.keyPress(KEYS.ENTER);
    expect(h.state.editingLayer?.id).not.toBe(text.id);
    expect(h.state.editingLayer?.id).toBe(h.layers[1].id);
  });

  it("should ignore locked text under cursor when clicked with text tool", () => {
    const text = API.createLayer({
      type: "text",
      text: "ola",
      x: 60,
      y: 0,
      width: 100,
      height: 100,
      locked: true
    });
    h.layers = [text];
    UI.clickTool("text");
    mouse.clickAt(text.x + 50, text.y + 50);
    const editor = document.querySelector(
      ".excalidraw-textEditorContainer > textarea"
    ) as HTMLTextAreaLayer;
    expect(editor).not.toBe(null);
    expect(h.state.editingLayer?.id).not.toBe(text.id);
    expect(h.layers.length).toBe(2);
    expect(h.state.editingLayer?.id).toBe(h.layers[1].id);
  });

  it("should ignore text under cursor when double-clicked with selection tool", () => {
    const text = API.createLayer({
      type: "text",
      text: "ola",
      x: 60,
      y: 0,
      width: 100,
      height: 100,
      locked: true
    });
    h.layers = [text];
    UI.clickTool("selection");
    mouse.doubleClickAt(text.x + 50, text.y + 50);
    const editor = document.querySelector(
      ".excalidraw-textEditorContainer > textarea"
    ) as HTMLTextAreaLayer;
    expect(editor).not.toBe(null);
    expect(h.state.editingLayer?.id).not.toBe(text.id);
    expect(h.layers.length).toBe(2);
    expect(h.state.editingLayer?.id).toBe(h.layers[1].id);
  });

  it("locking should include bound text", () => {
    const container = API.createLayer({
      type: "rectangle",
      width: 100
    });
    const textSize = 20;
    const text = API.createLayer({
      type: "text",
      text: "ola",
      x: container.width / 2 - textSize / 2,
      y: container.height / 2 - textSize / 2,
      width: textSize,
      height: textSize,
      containerId: container.id
    });
    mutateLayer(container, {
      boundLayers: [{ id: text.id, type: "text" }]
    });

    h.layers = [container, text];

    UI.clickTool("selection");
    mouse.clickAt(container.x + 10, container.y + 10);
    Keyboard.withModifierKeys({ ctrl: true, shift: true }, () => {
      Keyboard.keyPress(KEYS.L);
    });

    expect(h.layers).toEqual([
      expect.objectContaining({
        id: container.id,
        locked: true
      }),
      expect.objectContaining({
        id: text.id,
        locked: true
      })
    ]);
  });

  it("bound text shouldn't be editable via double-click", () => {
    const container = API.createLayer({
      type: "rectangle",
      width: 100,
      locked: true
    });
    const textSize = 20;
    const text = API.createLayer({
      type: "text",
      text: "ola",
      x: container.width / 2 - textSize / 2,
      y: container.height / 2 - textSize / 2,
      width: textSize,
      height: textSize,
      containerId: container.id,
      locked: true
    });
    mutateLayer(container, {
      boundLayers: [{ id: text.id, type: "text" }]
    });
    h.layers = [container, text];

    UI.clickTool("selection");
    mouse.doubleClickAt(container.width / 2, container.height / 2);

    const editor = document.querySelector(
      ".excalidraw-textEditorContainer > textarea"
    ) as HTMLTextAreaLayer;
    expect(editor).not.toBe(null);
    expect(h.state.editingLayer?.id).not.toBe(text.id);
    expect(h.layers.length).toBe(3);
    expect(h.state.editingLayer?.id).toBe(h.layers[2].id);
  });

  it("bound text shouldn't be editable via text tool", () => {
    const container = API.createLayer({
      type: "rectangle",
      width: 100,
      locked: true
    });
    const textSize = 20;
    const text = API.createLayer({
      type: "text",
      text: "ola",
      x: container.width / 2 - textSize / 2,
      y: container.height / 2 - textSize / 2,
      width: textSize,
      height: textSize,
      containerId: container.id,
      locked: true
    });
    mutateLayer(container, {
      boundLayers: [{ id: text.id, type: "text" }]
    });
    h.layers = [container, text];

    UI.clickTool("text");
    mouse.clickAt(container.width / 2, container.height / 2);

    const editor = document.querySelector(
      ".excalidraw-textEditorContainer > textarea"
    ) as HTMLTextAreaLayer;
    expect(editor).not.toBe(null);
    expect(h.state.editingLayer?.id).not.toBe(text.id);
    expect(h.layers.length).toBe(3);
    expect(h.state.editingLayer?.id).toBe(h.layers[2].id);
  });
});
