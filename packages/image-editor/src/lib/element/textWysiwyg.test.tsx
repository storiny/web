import { queryByText } from "@testing-library/react";
import ReactDOM from "react-dom";

import { FONT_FAMILY, TEXT_ALIGN, VERTICAL_ALIGN } from "../constants";
import ExcalidrawApp from "../excalidraw-app";
import { CODES, KEYS } from "../keys";
import { API } from "../tests/helpers/api";
import { Keyboard, Pointer, UI } from "../tests/helpers/ui";
import { GlobalTestState, render, screen } from "../tests/test-utils";
import {
  fireEvent,
  mockBoundingClientRect,
  restoreOriginalGetBoundingClientRect
} from "../tests/test-utils";
import { resize } from "../tests/utils";
import { mutateLayer } from "./mutateLayer";
import { getOriginalContainerHeightFromCache } from "./textWysiwyg";
import { ExcalidrawTextLayer, ExcalidrawTextLayerWithContainer } from "./types";

// Unmount ReactDOM from root
ReactDOM.unmountComponentAtNode(document.getLayerById("root")!);

const tab = "    ";
const mouse = new Pointer("mouse");

const getTextEditor = () =>
  document.querySelector(
    ".excalidraw-textEditorContainer > textarea"
  ) as HTMLTextAreaLayer;

const updateTextEditor = (editor: HTMLTextAreaLayer, value: string) => {
  fireEvent.change(editor, { target: { value } });
  editor.dispatchEvent(new Event("input"));
};

describe("textWysiwyg", () => {
  describe("start text editing", () => {
    const { h } = window;
    beforeEach(async () => {
      await render(<ExcalidrawApp />);
      h.layers = [];
    });

    it("should prefer editing selected text layer (non-bindable container present)", async () => {
      const line = API.createLayer({
        type: "line",
        width: 100,
        height: 0,
        points: [
          [0, 0],
          [100, 0]
        ]
      });
      const textSize = 20;
      const text = API.createLayer({
        type: "text",
        text: "ola",
        x: line.width / 2 - textSize / 2,
        y: -textSize / 2,
        width: textSize,
        height: textSize
      });
      h.layers = [text, line];

      API.setSelectedLayers([text]);

      Keyboard.keyPress(KEYS.ENTER);

      expect(h.state.editingLayer?.id).toBe(text.id);
      expect((h.state.editingLayer as ExcalidrawTextLayer).containerId).toBe(
        null
      );
    });

    it("should prefer editing selected text layer (bindable container present)", async () => {
      const container = API.createLayer({
        type: "rectangle",
        width: 100,
        boundLayers: []
      });
      const textSize = 20;

      const boundText = API.createLayer({
        type: "text",
        text: "ola",
        x: container.width / 2 - textSize / 2,
        y: container.height / 2 - textSize / 2,
        width: textSize,
        height: textSize,
        containerId: container.id
      });

      const boundText2 = API.createLayer({
        type: "text",
        text: "ola",
        x: container.width / 2 - textSize / 2,
        y: container.height / 2 - textSize / 2,
        width: textSize,
        height: textSize,
        containerId: container.id
      });

      h.layers = [container, boundText, boundText2];

      mutateLayer(container, {
        boundLayers: [{ type: "text", id: boundText.id }]
      });

      API.setSelectedLayers([boundText2]);

      Keyboard.keyPress(KEYS.ENTER);

      expect(h.state.editingLayer?.id).toBe(boundText2.id);
    });

    it("should not create bound text on ENTER if text exists at container center", () => {
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
        boundLayers: [{ type: "text", id: text.id }]
      });

      h.layers = [container, text];

      API.setSelectedLayers([container]);

      Keyboard.keyPress(KEYS.ENTER);

      expect(h.state.editingLayer?.id).toBe(text.id);
    });

    it("should edit existing bound text on ENTER even if higher z-index unbound text exists at container center", () => {
      const container = API.createLayer({
        type: "rectangle",
        width: 100,
        boundLayers: []
      });
      const textSize = 20;

      const boundText = API.createLayer({
        type: "text",
        text: "ola",
        x: container.width / 2 - textSize / 2,
        y: container.height / 2 - textSize / 2,
        width: textSize,
        height: textSize,
        containerId: container.id
      });

      const boundText2 = API.createLayer({
        type: "text",
        text: "ola",
        x: container.width / 2 - textSize / 2,
        y: container.height / 2 - textSize / 2,
        width: textSize,
        height: textSize,
        containerId: container.id
      });

      h.layers = [container, boundText, boundText2];

      mutateLayer(container, {
        boundLayers: [{ type: "text", id: boundText.id }]
      });

      API.setSelectedLayers([container]);

      Keyboard.keyPress(KEYS.ENTER);

      expect(h.state.editingLayer?.id).toBe(boundText.id);
    });

    it("should edit text under cursor when clicked with text tool", () => {
      const text = API.createLayer({
        type: "text",
        text: "ola",
        x: 60,
        y: 0,
        width: 100,
        height: 100
      });

      h.layers = [text];
      UI.clickTool("text");

      mouse.clickAt(text.x + 50, text.y + 50);

      const editor = getTextEditor();

      expect(editor).not.toBe(null);
      expect(h.state.editingLayer?.id).toBe(text.id);
      expect(h.layers.length).toBe(1);
    });

    it("should edit text under cursor when double-clicked with selection tool", () => {
      const text = API.createLayer({
        type: "text",
        text: "ola",
        x: 60,
        y: 0,
        width: 100,
        height: 100
      });

      h.layers = [text];
      UI.clickTool("selection");

      mouse.doubleClickAt(text.x + 50, text.y + 50);

      const editor = getTextEditor();

      expect(editor).not.toBe(null);
      expect(h.state.editingLayer?.id).toBe(text.id);
      expect(h.layers.length).toBe(1);
    });
  });

  describe("Test container-unbound text", () => {
    const { h } = window;
    const dimensions = { height: 400, width: 800 };

    let textarea: HTMLTextAreaLayer;
    let textLayer: ExcalidrawTextLayer;

    beforeAll(() => {
      mockBoundingClientRect(dimensions);
    });

    beforeEach(async () => {
      await render(<ExcalidrawApp />);
      //@ts-ignore
      h.app.refreshDeviceState(h.app.excalidrawContainerRef.current!);

      textLayer = UI.createLayer("text");

      mouse.clickOn(textLayer);
      textarea = getTextEditor();
    });

    afterAll(() => {
      restoreOriginalGetBoundingClientRect();
    });

    it("should add a tab at the start of the first line", () => {
      const event = new KeyboardEvent("keydown", { key: KEYS.TAB });
      textarea.value = "Line#1\nLine#2";
      // cursor: "|Line#1\nLine#2"
      textarea.selectionStart = 0;
      textarea.selectionEnd = 0;
      textarea.dispatchEvent(event);

      expect(textarea.value).toEqual(`${tab}Line#1\nLine#2`);
      // cursor: "    |Line#1\nLine#2"
      expect(textarea.selectionStart).toEqual(4);
      expect(textarea.selectionEnd).toEqual(4);
    });

    it("should add a tab at the start of the second line", () => {
      const event = new KeyboardEvent("keydown", { key: KEYS.TAB });
      textarea.value = "Line#1\nLine#2";
      // cursor: "Line#1\nLin|e#2"
      textarea.selectionStart = 10;
      textarea.selectionEnd = 10;

      textarea.dispatchEvent(event);

      expect(textarea.value).toEqual(`Line#1\n${tab}Line#2`);

      // cursor: "Line#1\n    Lin|e#2"
      expect(textarea.selectionStart).toEqual(14);
      expect(textarea.selectionEnd).toEqual(14);
    });

    it("should add a tab at the start of the first and second line", () => {
      const event = new KeyboardEvent("keydown", { key: KEYS.TAB });
      textarea.value = "Line#1\nLine#2\nLine#3";
      // cursor: "Li|ne#1\nLi|ne#2\nLine#3"
      textarea.selectionStart = 2;
      textarea.selectionEnd = 9;

      textarea.dispatchEvent(event);

      expect(textarea.value).toEqual(`${tab}Line#1\n${tab}Line#2\nLine#3`);

      // cursor: "    Li|ne#1\n    Li|ne#2\nLine#3"
      expect(textarea.selectionStart).toEqual(6);
      expect(textarea.selectionEnd).toEqual(17);
    });

    it("should remove a tab at the start of the first line", () => {
      const event = new KeyboardEvent("keydown", {
        key: KEYS.TAB,
        shiftKey: true
      });
      textarea.value = `${tab}Line#1\nLine#2`;
      // cursor: "|    Line#1\nLine#2"
      textarea.selectionStart = 0;
      textarea.selectionEnd = 0;

      textarea.dispatchEvent(event);

      expect(textarea.value).toEqual(`Line#1\nLine#2`);

      // cursor: "|Line#1\nLine#2"
      expect(textarea.selectionStart).toEqual(0);
      expect(textarea.selectionEnd).toEqual(0);
    });

    it("should remove a tab at the start of the second line", () => {
      const event = new KeyboardEvent("keydown", {
        key: KEYS.TAB,
        shiftKey: true
      });
      // cursor: "Line#1\n    Lin|e#2"
      textarea.value = `Line#1\n${tab}Line#2`;
      textarea.selectionStart = 15;
      textarea.selectionEnd = 15;

      textarea.dispatchEvent(event);

      expect(textarea.value).toEqual(`Line#1\nLine#2`);
      // cursor: "Line#1\nLin|e#2"
      expect(textarea.selectionStart).toEqual(11);
      expect(textarea.selectionEnd).toEqual(11);
    });

    it("should remove a tab at the start of the first and second line", () => {
      const event = new KeyboardEvent("keydown", {
        key: KEYS.TAB,
        shiftKey: true
      });
      // cursor: "    Li|ne#1\n    Li|ne#2\nLine#3"
      textarea.value = `${tab}Line#1\n${tab}Line#2\nLine#3`;
      textarea.selectionStart = 6;
      textarea.selectionEnd = 17;

      textarea.dispatchEvent(event);

      expect(textarea.value).toEqual(`Line#1\nLine#2\nLine#3`);
      // cursor: "Li|ne#1\nLi|ne#2\nLine#3"
      expect(textarea.selectionStart).toEqual(2);
      expect(textarea.selectionEnd).toEqual(9);
    });

    it("should remove a tab at the start of the second line and cursor stay on this line", () => {
      const event = new KeyboardEvent("keydown", {
        key: KEYS.TAB,
        shiftKey: true
      });
      // cursor: "Line#1\n  |  Line#2"
      textarea.value = `Line#1\n${tab}Line#2`;
      textarea.selectionStart = 9;
      textarea.selectionEnd = 9;
      textarea.dispatchEvent(event);

      // cursor: "Line#1\n|Line#2"
      expect(textarea.selectionStart).toEqual(7);
      // expect(textarea.selectionEnd).toEqual(7);
    });

    it("should remove partial tabs", () => {
      const event = new KeyboardEvent("keydown", {
        key: KEYS.TAB,
        shiftKey: true
      });
      // cursor: "Line#1\n  Line#|2"
      textarea.value = `Line#1\n  Line#2`;
      textarea.selectionStart = 15;
      textarea.selectionEnd = 15;
      textarea.dispatchEvent(event);

      expect(textarea.value).toEqual(`Line#1\nLine#2`);
    });

    it("should remove nothing", () => {
      const event = new KeyboardEvent("keydown", {
        key: KEYS.TAB,
        shiftKey: true
      });
      // cursor: "Line#1\n  Li|ne#2"
      textarea.value = `Line#1\nLine#2`;
      textarea.selectionStart = 9;
      textarea.selectionEnd = 9;
      textarea.dispatchEvent(event);

      expect(textarea.value).toEqual(`Line#1\nLine#2`);
    });

    it("should resize text via shortcuts while in wysiwyg", () => {
      textarea.value = "abc def";
      const origFontSize = textLayer.fontSize;
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: KEYS.CHEVRON_RIGHT,
          ctrlKey: true,
          shiftKey: true
        })
      );
      expect(textLayer.fontSize).toBe(origFontSize * 1.1);

      textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: KEYS.CHEVRON_LEFT,
          ctrlKey: true,
          shiftKey: true
        })
      );
      expect(textLayer.fontSize).toBe(origFontSize);
    });

    it("zooming via keyboard should zoom canvas", () => {
      expect(h.state.zoom.value).toBe(1);
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: CODES.MINUS,
          ctrlKey: true
        })
      );
      expect(h.state.zoom.value).toBe(0.9);
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: CODES.NUM_SUBTRACT,
          ctrlKey: true
        })
      );
      expect(h.state.zoom.value).toBe(0.8);
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: CODES.NUM_ADD,
          ctrlKey: true
        })
      );
      expect(h.state.zoom.value).toBe(0.9);
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: CODES.EQUAL,
          ctrlKey: true
        })
      );
      expect(h.state.zoom.value).toBe(1);
    });

    it("text should never go beyond max width", async () => {
      UI.clickTool("text");
      mouse.clickAt(750, 300);

      textarea = getTextEditor();
      updateTextEditor(
        textarea,
        "Excalidraw is an opensource virtual collaborative whiteboard for sketching hand-drawn like diagrams!"
      );
      await new Promise((cb) => setTimeout(cb, 0));
      textarea.blur();
      expect(textarea).toHaveStyle({ width: "792px" });
      expect(h.layers[0].width).toBe(1000);
    });
  });

  describe("Test container-bound text", () => {
    let rectangle: any;
    const { h } = window;

    beforeEach(async () => {
      await render(<ExcalidrawApp />);
      h.layers = [];

      rectangle = UI.createLayer("rectangle", {
        x: 10,
        y: 20,
        width: 90,
        height: 75
      });
    });

    it("should bind text to container when double clicked inside filled container", async () => {
      const rectangle = API.createLayer({
        type: "rectangle",
        x: 10,
        y: 20,
        width: 90,
        height: 75,
        backgroundColor: "red"
      });
      h.layers = [rectangle];

      expect(h.layers.length).toBe(1);
      expect(h.layers[0].id).toBe(rectangle.id);

      mouse.doubleClickAt(rectangle.x + 10, rectangle.y + 10);
      expect(h.layers.length).toBe(2);

      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBe(rectangle.id);
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
      mouse.down();
      const editor = getTextEditor();

      updateTextEditor(editor, "Hello World!");

      await new Promise((r) => setTimeout(r, 0));
      editor.blur();
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
    });

    it("should set the text layer angle to same as container angle when binding to rotated container", async () => {
      const rectangle = API.createLayer({
        type: "rectangle",
        width: 90,
        height: 75,
        angle: 45
      });
      h.layers = [rectangle];
      mouse.doubleClickAt(rectangle.x + 10, rectangle.y + 10);
      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBe(rectangle.id);
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
      expect(text.angle).toBe(rectangle.angle);
      mouse.down();
      const editor = getTextEditor();

      updateTextEditor(editor, "Hello World!");

      await new Promise((r) => setTimeout(r, 0));
      editor.blur();
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
    });

    it("should compute the container height correctly and not throw error when height is updated while editing the text", async () => {
      const diamond = API.createLayer({
        type: "diamond",
        x: 10,
        y: 20,
        width: 90,
        height: 75
      });
      h.layers = [diamond];

      expect(h.layers.length).toBe(1);
      expect(h.layers[0].id).toBe(diamond.id);

      API.setSelectedLayers([diamond]);
      Keyboard.keyPress(KEYS.ENTER);

      const editor = getTextEditor();

      await new Promise((r) => setTimeout(r, 0));
      const value = new Array(1000).fill("1").join("\n");

      // Pasting large text to simulate height increase
      expect(() =>
        fireEvent.input(editor, { target: { value } })
      ).not.toThrow();

      expect(diamond.height).toBe(50020);

      // Clearing text to simulate height decrease
      expect(() => updateTextEditor(editor, "")).not.toThrow();

      expect(diamond.height).toBe(70);
    });

    it("should bind text to container when double clicked on center of transparent container", async () => {
      const rectangle = API.createLayer({
        type: "rectangle",
        x: 10,
        y: 20,
        width: 90,
        height: 75,
        backgroundColor: "transparent"
      });
      h.layers = [rectangle];

      mouse.doubleClickAt(rectangle.x + 10, rectangle.y + 10);
      expect(h.layers.length).toBe(2);
      let text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBe(null);
      mouse.down();
      let editor = getTextEditor();
      await new Promise((r) => setTimeout(r, 0));
      editor.blur();

      mouse.doubleClickAt(
        rectangle.x + rectangle.width / 2,
        rectangle.y + rectangle.height / 2
      );
      expect(h.layers.length).toBe(3);

      text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBe(rectangle.id);

      mouse.down();
      editor = getTextEditor();

      updateTextEditor(editor, "Hello World!");
      await new Promise((r) => setTimeout(r, 0));
      editor.blur();

      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
    });

    it("should bind text to container when clicked on container and enter pressed", async () => {
      expect(h.layers.length).toBe(1);
      expect(h.layers[0].id).toBe(rectangle.id);

      Keyboard.keyPress(KEYS.ENTER);

      expect(h.layers.length).toBe(2);

      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBe(rectangle.id);
      const editor = getTextEditor();

      await new Promise((r) => setTimeout(r, 0));

      updateTextEditor(editor, "Hello World!");
      editor.blur();
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
    });

    it("should bind text to container when double clicked on container stroke", async () => {
      const rectangle = API.createLayer({
        type: "rectangle",
        x: 10,
        y: 20,
        width: 90,
        height: 75,
        strokeWidth: 4
      });
      h.layers = [rectangle];

      expect(h.layers.length).toBe(1);
      expect(h.layers[0].id).toBe(rectangle.id);

      mouse.doubleClickAt(rectangle.x + 2, rectangle.y + 2);
      expect(h.layers.length).toBe(2);

      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBe(rectangle.id);
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
      mouse.down();
      const editor = getTextEditor();
      updateTextEditor(editor, "Hello World!");

      await new Promise((r) => setTimeout(r, 0));
      editor.blur();
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
    });

    it("shouldn't bind to non-text-bindable containers", async () => {
      const freedraw = API.createLayer({
        type: "freedraw",
        width: 100,
        height: 0
      });
      h.layers = [freedraw];

      UI.clickTool("text");

      mouse.clickAt(
        freedraw.x + freedraw.width / 2,
        freedraw.y + freedraw.height / 2
      );

      const editor = getTextEditor();
      updateTextEditor(editor, "Hello World!");
      fireEvent.keyDown(editor, { key: KEYS.ESCAPE });

      expect(freedraw.boundLayers).toBe(null);
      expect(h.layers[1].type).toBe("text");
      expect((h.layers[1] as ExcalidrawTextLayer).containerId).toBe(null);
    });

    ["freedraw", "line"].forEach((type: any) => {
      it(`shouldn't create text layer when pressing 'Enter' key on ${type} `, async () => {
        h.layers = [];
        const layer = UI.createLayer(type, {
          width: 100,
          height: 50
        });
        API.setSelectedLayers([layer]);
        Keyboard.keyPress(KEYS.ENTER);
        expect(h.layers.length).toBe(1);
      });
    });

    it("should'nt bind text to container when not double clicked on center", async () => {
      expect(h.layers.length).toBe(1);
      expect(h.layers[0].id).toBe(rectangle.id);

      // clicking somewhere on top left
      mouse.doubleClickAt(rectangle.x + 20, rectangle.y + 20);
      expect(h.layers.length).toBe(2);

      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBe(null);
      mouse.down();
      const editor = getTextEditor();

      updateTextEditor(editor, "Hello World!");

      await new Promise((r) => setTimeout(r, 0));
      editor.blur();
      expect(rectangle.boundLayers).toBe(null);
    });

    it("should bind text to container when triggered via context menu", async () => {
      expect(h.layers.length).toBe(1);
      expect(h.layers[0].id).toBe(rectangle.id);

      UI.clickTool("text");
      mouse.clickAt(20, 30);
      const editor = getTextEditor();

      updateTextEditor(
        editor,
        "Excalidraw is an opensource virtual collaborative whiteboard"
      );
      await new Promise((cb) => setTimeout(cb, 0));
      expect(h.layers.length).toBe(2);
      expect(h.layers[1].type).toBe("text");

      API.setSelectedLayers([h.layers[0], h.layers[1]]);
      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 20,
        clientY: 30
      });
      const contextMenu = document.querySelector(".context-menu");
      fireEvent.click(
        queryByText(contextMenu as HTMLLayer, "Bind text to the container")!
      );
      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(rectangle.boundLayers).toStrictEqual([
        { id: h.layers[1].id, type: "text" }
      ]);
      expect(text.containerId).toBe(rectangle.id);
      expect(text.verticalAlign).toBe(VERTICAL_ALIGN.MIDDLE);
      expect(text.textAlign).toBe(TEXT_ALIGN.CENTER);
      expect(text.x).toBe(
        h.layers[0].x + h.layers[0].width / 2 - text.width / 2
      );
      expect(text.y).toBe(
        h.layers[0].y + h.layers[0].height / 2 - text.height / 2
      );
    });

    it("should update font family correctly on undo/redo by selecting bounded text when font family was updated", async () => {
      expect(h.layers.length).toBe(1);

      mouse.doubleClickAt(
        rectangle.x + rectangle.width / 2,
        rectangle.y + rectangle.height / 2
      );
      mouse.down();

      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      let editor = getTextEditor();

      await new Promise((r) => setTimeout(r, 0));
      updateTextEditor(editor, "Hello World!");
      editor.blur();
      expect(text.fontFamily).toEqual(FONT_FAMILY.Virgil);
      UI.clickTool("text");

      mouse.clickAt(
        rectangle.x + rectangle.width / 2,
        rectangle.y + rectangle.height / 2
      );
      mouse.down();
      editor = getTextEditor();

      editor.select();
      fireEvent.click(screen.getByTitle(/code/i));

      await new Promise((r) => setTimeout(r, 0));
      editor.blur();
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).fontFamily
      ).toEqual(FONT_FAMILY.Cascadia);

      //undo
      Keyboard.withModifierKeys({ ctrl: true }, () => {
        Keyboard.keyPress(KEYS.Z);
      });
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).fontFamily
      ).toEqual(FONT_FAMILY.Virgil);

      //redo
      Keyboard.withModifierKeys({ ctrl: true, shift: true }, () => {
        Keyboard.keyPress(KEYS.Z);
      });
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).fontFamily
      ).toEqual(FONT_FAMILY.Cascadia);
    });

    it("should wrap text and vertcially center align once text submitted", async () => {
      expect(h.layers.length).toBe(1);

      Keyboard.keyDown(KEYS.ENTER);
      let text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      let editor = getTextEditor();

      updateTextEditor(editor, "Hello World!");

      await new Promise((cb) => setTimeout(cb, 0));
      editor.blur();
      text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.text).toBe("Hello \nWorld!");
      expect(text.originalText).toBe("Hello World!");
      expect(text.y).toBe(
        rectangle.y + h.layers[0].height / 2 - text.height / 2
      );
      expect(text.x).toBe(25);
      expect(text.height).toBe(50);
      expect(text.width).toBe(60);

      // Edit and text by removing second line and it should
      // still vertically align correctly
      mouse.select(rectangle);
      Keyboard.keyPress(KEYS.ENTER);

      editor = getTextEditor();
      updateTextEditor(editor, "Hello");

      await new Promise((r) => setTimeout(r, 0));

      editor.blur();
      text = h.layers[1] as ExcalidrawTextLayerWithContainer;

      expect(text.text).toBe("Hello");
      expect(text.originalText).toBe("Hello");
      expect(text.height).toBe(25);
      expect(text.width).toBe(50);
      expect(text.y).toBe(
        rectangle.y + h.layers[0].height / 2 - text.height / 2
      );
      expect(text.x).toBe(30);
    });

    it("should unbind bound text when unbind action from context menu is triggered", async () => {
      expect(h.layers.length).toBe(1);
      expect(h.layers[0].id).toBe(rectangle.id);

      Keyboard.keyPress(KEYS.ENTER);

      expect(h.layers.length).toBe(2);

      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.containerId).toBe(rectangle.id);

      const editor = getTextEditor();

      await new Promise((r) => setTimeout(r, 0));

      updateTextEditor(editor, "Hello World!");
      editor.blur();
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
      mouse.reset();
      UI.clickTool("selection");
      mouse.clickAt(10, 20);
      mouse.down();
      mouse.up();
      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 20,
        clientY: 30
      });
      const contextMenu = document.querySelector(".context-menu");
      fireEvent.click(queryByText(contextMenu as HTMLLayer, "Unbind text")!);
      expect(h.layers[0].boundLayers).toEqual([]);
      expect((h.layers[1] as ExcalidrawTextLayer).containerId).toEqual(null);
    });

    it("shouldn't bind to container if container has bound text", async () => {
      expect(h.layers.length).toBe(1);

      Keyboard.keyPress(KEYS.ENTER);

      expect(h.layers.length).toBe(2);

      // Bind first text
      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.containerId).toBe(rectangle.id);
      const editor = getTextEditor();
      await new Promise((r) => setTimeout(r, 0));
      updateTextEditor(editor, "Hello World!");
      editor.blur();
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);

      mouse.select(rectangle);
      Keyboard.keyPress(KEYS.ENTER);
      expect(h.layers.length).toBe(2);

      expect(rectangle.boundLayers).toStrictEqual([
        { id: h.layers[1].id, type: "text" }
      ]);
      expect(text.containerId).toBe(rectangle.id);
    });

    it("should respect text alignment when resizing", async () => {
      Keyboard.keyPress(KEYS.ENTER);

      let editor = getTextEditor();
      await new Promise((r) => setTimeout(r, 0));
      updateTextEditor(editor, "Hello");
      editor.blur();

      // should center align horizontally and vertically by default
      resize(rectangle, "ne", [rectangle.x + 100, rectangle.y - 100]);
      expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
        Array [
          85,
          4.5,
        ]
      `);

      mouse.select(rectangle);
      Keyboard.keyPress(KEYS.ENTER);

      editor = getTextEditor();

      editor.select();

      fireEvent.click(screen.getByTitle("Left"));
      await new Promise((r) => setTimeout(r, 0));

      fireEvent.click(screen.getByTitle("Align bottom"));
      await new Promise((r) => setTimeout(r, 0));

      editor.blur();

      // should left align horizontally and bottom vertically after resize
      resize(rectangle, "ne", [rectangle.x + 100, rectangle.y - 100]);
      expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
        Array [
          15,
          65,
        ]
      `);

      mouse.select(rectangle);
      Keyboard.keyPress(KEYS.ENTER);
      editor = getTextEditor();

      editor.select();

      fireEvent.click(screen.getByTitle("Right"));
      fireEvent.click(screen.getByTitle("Align top"));

      await new Promise((r) => setTimeout(r, 0));

      editor.blur();

      // should right align horizontally and top vertically after resize
      resize(rectangle, "ne", [rectangle.x + 100, rectangle.y - 100]);
      expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
        Array [
          375,
          -539,
        ]
      `);
    });

    it("should always bind to selected container and insert it in correct position", async () => {
      const rectangle2 = UI.createLayer("rectangle", {
        x: 5,
        y: 10,
        width: 120,
        height: 100
      });

      API.setSelectedLayers([rectangle]);
      Keyboard.keyPress(KEYS.ENTER);

      expect(h.layers.length).toBe(3);
      expect(h.layers[1].type).toBe("text");
      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBe(rectangle.id);
      mouse.down();
      const editor = getTextEditor();

      updateTextEditor(editor, "Hello World!");

      await new Promise((r) => setTimeout(r, 0));
      editor.blur();
      expect(rectangle2.boundLayers).toBeNull();
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
    });

    it("should scale font size correctly when resizing using shift", async () => {
      Keyboard.keyPress(KEYS.ENTER);

      const editor = getTextEditor();
      await new Promise((r) => setTimeout(r, 0));
      updateTextEditor(editor, "Hello");
      editor.blur();
      const textLayer = h.layers[1] as ExcalidrawTextLayer;
      expect(rectangle.width).toBe(90);
      expect(rectangle.height).toBe(75);
      expect(textLayer.fontSize).toBe(20);

      resize(rectangle, "ne", [rectangle.x + 100, rectangle.y - 50], {
        shift: true
      });
      expect(rectangle.width).toBe(200);
      expect(rectangle.height).toBe(166.66666666666669);
      expect(textLayer.fontSize).toBe(47.5);
    });

    it("should bind text correctly when container duplicated with alt-drag", async () => {
      Keyboard.keyPress(KEYS.ENTER);

      const editor = getTextEditor();
      await new Promise((r) => setTimeout(r, 0));
      updateTextEditor(editor, "Hello");
      editor.blur();
      expect(h.layers.length).toBe(2);

      mouse.select(rectangle);
      Keyboard.withModifierKeys({ alt: true }, () => {
        mouse.down(rectangle.x + 10, rectangle.y + 10);
        mouse.up(rectangle.x + 10, rectangle.y + 10);
      });
      expect(h.layers.length).toBe(4);
      const duplicatedRectangle = h.layers[0];
      const duplicatedText = h.layers[1] as ExcalidrawTextLayerWithContainer;
      const originalRect = h.layers[2];
      const originalText = h.layers[3] as ExcalidrawTextLayerWithContainer;
      expect(originalRect.boundLayers).toStrictEqual([
        { id: originalText.id, type: "text" }
      ]);

      expect(originalText.containerId).toBe(originalRect.id);

      expect(duplicatedRectangle.boundLayers).toStrictEqual([
        { id: duplicatedText.id, type: "text" }
      ]);

      expect(duplicatedText.containerId).toBe(duplicatedRectangle.id);
    });

    it("undo should work", async () => {
      Keyboard.keyPress(KEYS.ENTER);
      const editor = getTextEditor();
      await new Promise((r) => setTimeout(r, 0));
      updateTextEditor(editor, "Hello");
      editor.blur();
      expect(rectangle.boundLayers).toStrictEqual([
        { id: h.layers[1].id, type: "text" }
      ]);
      let text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      const originalRectX = rectangle.x;
      const originalRectY = rectangle.y;
      const originalTextX = text.x;
      const originalTextY = text.y;
      mouse.select(rectangle);
      mouse.downAt(rectangle.x, rectangle.y);
      mouse.moveTo(rectangle.x + 100, rectangle.y + 50);
      mouse.up(rectangle.x + 100, rectangle.y + 50);
      expect(rectangle.x).toBe(80);
      expect(rectangle.y).toBe(-40);
      expect(text.x).toBe(85);
      expect(text.y).toBe(-35);

      Keyboard.withModifierKeys({ ctrl: true }, () => {
        Keyboard.keyPress(KEYS.Z);
      });
      expect(rectangle.x).toBe(originalRectX);
      expect(rectangle.y).toBe(originalRectY);
      text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.x).toBe(originalTextX);
      expect(text.y).toBe(originalTextY);
      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
      expect(text.containerId).toBe(rectangle.id);
    });

    it("should not allow bound text with only whitespaces", async () => {
      Keyboard.keyPress(KEYS.ENTER);
      const editor = getTextEditor();
      await new Promise((r) => setTimeout(r, 0));

      updateTextEditor(editor, "   ");
      editor.blur();
      expect(rectangle.boundLayers).toStrictEqual([]);
      expect(h.layers[1].isDeleted).toBe(true);
    });

    it("should restore original container height and clear cache once text is unbind", async () => {
      const container = API.createLayer({
        type: "rectangle",
        height: 75,
        width: 90
      });
      const originalRectHeight = container.height;
      expect(container.height).toBe(originalRectHeight);

      const text = API.createLayer({
        type: "text",
        text: "Online whiteboard collaboration made easy"
      });

      h.layers = [container, text];
      API.setSelectedLayers([container, text]);
      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 20,
        clientY: 30
      });
      let contextMenu = document.querySelector(".context-menu");

      fireEvent.click(
        queryByText(contextMenu as HTMLLayer, "Bind text to the container")!
      );

      expect((h.layers[1] as ExcalidrawTextLayerWithContainer).text).toBe(
        "Online \nwhitebo\nard \ncollabo\nration \nmade \neasy"
      );
      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 20,
        clientY: 30
      });
      contextMenu = document.querySelector(".context-menu");
      fireEvent.click(queryByText(contextMenu as HTMLLayer, "Unbind text")!);
      expect(h.layers[0].boundLayers).toEqual([]);
      expect(getOriginalContainerHeightFromCache(container.id)).toBe(null);

      expect(container.height).toBe(originalRectHeight);
    });

    it("should reset the container height cache when resizing", async () => {
      Keyboard.keyPress(KEYS.ENTER);
      expect(getOriginalContainerHeightFromCache(rectangle.id)).toBe(75);
      let editor = getTextEditor();
      await new Promise((r) => setTimeout(r, 0));
      updateTextEditor(editor, "Hello");
      editor.blur();

      resize(rectangle, "ne", [rectangle.x + 100, rectangle.y - 100]);
      expect(rectangle.height).toBe(156);
      expect(getOriginalContainerHeightFromCache(rectangle.id)).toBe(null);

      mouse.select(rectangle);
      Keyboard.keyPress(KEYS.ENTER);

      editor = getTextEditor();

      await new Promise((r) => setTimeout(r, 0));
      editor.blur();
      expect(rectangle.height).toBe(156);
      // cache updated again
      expect(getOriginalContainerHeightFromCache(rectangle.id)).toBe(156);
    });

    it("should reset the container height cache when font properties updated", async () => {
      Keyboard.keyPress(KEYS.ENTER);
      expect(getOriginalContainerHeightFromCache(rectangle.id)).toBe(75);

      const editor = getTextEditor();
      updateTextEditor(editor, "Hello World!");
      editor.blur();

      mouse.select(rectangle);
      Keyboard.keyPress(KEYS.ENTER);

      fireEvent.click(screen.getByTitle(/code/i));

      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).fontFamily
      ).toEqual(FONT_FAMILY.Cascadia);
      expect(getOriginalContainerHeightFromCache(rectangle.id)).toBe(75);

      fireEvent.click(screen.getByTitle(/Very large/i));
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).fontSize
      ).toEqual(36);
      expect(getOriginalContainerHeightFromCache(rectangle.id)).toBe(97);
    });

    it("should update line height when font family updated", async () => {
      Keyboard.keyPress(KEYS.ENTER);
      expect(getOriginalContainerHeightFromCache(rectangle.id)).toBe(75);

      const editor = getTextEditor();
      updateTextEditor(editor, "Hello World!");
      editor.blur();
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).lineHeight
      ).toEqual(1.25);

      mouse.select(rectangle);
      Keyboard.keyPress(KEYS.ENTER);

      fireEvent.click(screen.getByTitle(/code/i));
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).fontFamily
      ).toEqual(FONT_FAMILY.Cascadia);
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).lineHeight
      ).toEqual(1.2);

      fireEvent.click(screen.getByTitle(/normal/i));
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).fontFamily
      ).toEqual(FONT_FAMILY.Helvetica);
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).lineHeight
      ).toEqual(1.15);
    });

    describe("should align correctly", () => {
      let editor: HTMLTextAreaLayer;

      beforeEach(async () => {
        Keyboard.keyPress(KEYS.ENTER);
        editor = getTextEditor();
        updateTextEditor(editor, "Hello");
        editor.blur();
        mouse.select(rectangle);
        Keyboard.keyPress(KEYS.ENTER);
        editor = getTextEditor();
        editor.select();
      });

      it("when top left", async () => {
        fireEvent.click(screen.getByTitle("Left"));
        fireEvent.click(screen.getByTitle("Align top"));
        expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
          Array [
            15,
            25,
          ]
        `);
      });

      it("when top center", async () => {
        fireEvent.click(screen.getByTitle("Center"));
        fireEvent.click(screen.getByTitle("Align top"));
        expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
          Array [
            30,
            25,
          ]
        `);
      });

      it("when top right", async () => {
        fireEvent.click(screen.getByTitle("Right"));
        fireEvent.click(screen.getByTitle("Align top"));

        expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
          Array [
            45,
            25,
          ]
        `);
      });

      it("when center left", async () => {
        fireEvent.click(screen.getByTitle("Center vertically"));
        fireEvent.click(screen.getByTitle("Left"));
        expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
          Array [
            15,
            45,
          ]
        `);
      });

      it("when center center", async () => {
        fireEvent.click(screen.getByTitle("Center"));
        fireEvent.click(screen.getByTitle("Center vertically"));

        expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
          Array [
            30,
            45,
          ]
        `);
      });

      it("when center right", async () => {
        fireEvent.click(screen.getByTitle("Right"));
        fireEvent.click(screen.getByTitle("Center vertically"));

        expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
          Array [
            45,
            45,
          ]
        `);
      });

      it("when bottom left", async () => {
        fireEvent.click(screen.getByTitle("Left"));
        fireEvent.click(screen.getByTitle("Align bottom"));

        expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
          Array [
            15,
            65,
          ]
        `);
      });

      it("when bottom center", async () => {
        fireEvent.click(screen.getByTitle("Center"));
        fireEvent.click(screen.getByTitle("Align bottom"));
        expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
          Array [
            30,
            65,
          ]
        `);
      });

      it("when bottom right", async () => {
        fireEvent.click(screen.getByTitle("Right"));
        fireEvent.click(screen.getByTitle("Align bottom"));
        expect([h.layers[1].x, h.layers[1].y]).toMatchInlineSnapshot(`
          Array [
            45,
            65,
          ]
        `);
      });
    });

    it("should wrap text in a container when wrap text in container triggered from context menu", async () => {
      UI.clickTool("text");
      mouse.clickAt(20, 30);
      const editor = getTextEditor();

      updateTextEditor(
        editor,
        "Excalidraw is an opensource virtual collaborative whiteboard"
      );
      await new Promise((cb) => setTimeout(cb, 0));

      editor.select();
      fireEvent.click(screen.getByTitle("Left"));
      await new Promise((r) => setTimeout(r, 0));

      editor.blur();

      const textLayer = h.layers[1] as ExcalidrawTextLayer;
      expect(textLayer.width).toBe(600);
      expect(textLayer.height).toBe(25);
      expect(textLayer.textAlign).toBe(TEXT_ALIGN.LEFT);
      expect((textLayer as ExcalidrawTextLayer).text).toBe(
        "Excalidraw is an opensource virtual collaborative whiteboard"
      );

      API.setSelectedLayers([textLayer]);

      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 20,
        clientY: 30
      });

      const contextMenu = document.querySelector(".context-menu");
      fireEvent.click(
        queryByText(contextMenu as HTMLLayer, "Wrap text in a container")!
      );
      expect(h.layers.length).toBe(3);

      expect(h.layers[1]).toEqual(
        expect.objectContaining({
          angle: 0,
          backgroundColor: "transparent",
          boundLayers: [
            {
              id: h.layers[2].id,
              type: "text"
            }
          ],
          fillStyle: "hachure",
          groupIds: [],
          height: 35,
          isDeleted: false,
          link: null,
          locked: false,
          opacity: 100,
          roughness: 1,
          roundness: {
            type: 3
          },
          strokeColor: "#1e1e1e",
          strokeStyle: "solid",
          strokeWidth: 1,
          type: "rectangle",
          updated: 1,
          version: 1,
          width: 610,
          x: 15,
          y: 25
        })
      );
      expect(h.layers[2] as ExcalidrawTextLayer).toEqual(
        expect.objectContaining({
          text: "Excalidraw is an opensource virtual collaborative whiteboard",
          verticalAlign: VERTICAL_ALIGN.MIDDLE,
          textAlign: TEXT_ALIGN.CENTER,
          boundLayers: null
        })
      );
    });

    it("shouldn't bind to container if container has bound text not centered and text tool is used", async () => {
      expect(h.layers.length).toBe(1);

      Keyboard.keyPress(KEYS.ENTER);

      expect(h.layers.length).toBe(2);

      // Bind first text
      let text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.containerId).toBe(rectangle.id);
      let editor = getTextEditor();
      await new Promise((r) => setTimeout(r, 0));
      updateTextEditor(editor, "Hello!");
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).verticalAlign
      ).toBe(VERTICAL_ALIGN.MIDDLE);

      fireEvent.click(screen.getByTitle("Align bottom"));
      await new Promise((r) => setTimeout(r, 0));

      editor.blur();

      expect(rectangle.boundLayers).toStrictEqual([
        { id: text.id, type: "text" }
      ]);
      expect(
        (h.layers[1] as ExcalidrawTextLayerWithContainer).verticalAlign
      ).toBe(VERTICAL_ALIGN.BOTTOM);

      // Attempt to Bind 2nd text using text tool
      UI.clickTool("text");
      mouse.clickAt(
        rectangle.x + rectangle.width / 2,
        rectangle.y + rectangle.height / 2
      );
      editor = getTextEditor();
      await new Promise((r) => setTimeout(r, 0));
      updateTextEditor(editor, "Excalidraw");
      editor.blur();

      expect(h.layers.length).toBe(3);
      expect(rectangle.boundLayers).toStrictEqual([
        { id: h.layers[1].id, type: "text" }
      ]);
      text = h.layers[2] as ExcalidrawTextLayerWithContainer;
      expect(text.containerId).toBe(null);
      expect(text.text).toBe("Excalidraw");
    });
  });
});
