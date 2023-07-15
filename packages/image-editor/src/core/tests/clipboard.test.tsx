import ReactDOM from "react-dom";

import { copyToClipboard } from "../clipboard";
import ExcalidrawApp from "../excalidraw-app";
import { KEYS } from "../keys";
import { getLayerBounds } from "../layer";
import { getDefaultLineHeight, getLineHeightInPx } from "../layer/textLayer";
import { NormalizedZoomValue } from "../types";
import { API } from "./helpers/api";
import { Keyboard, Pointer } from "./helpers/ui";
import {
  createPasteEvent,
  GlobalTestState,
  render,
  waitFor
} from "./test-utils";

const { h } = window;

const mouse = new Pointer("mouse");

jest.mock("../keys.ts", () => {
  const actual = jest.requireActual("../keys.ts");
  return {
    __esmodule: true,
    ...actual,
    isDarwin: false,
    KEYS: {
      ...actual.KEYS,
      CTRL_OR_CMD: "ctrlKey"
    }
  };
});

const setClipboardText = (text: string) => {
  Object.assign(navigator, {
    clipboard: {
      readText: () => text
    }
  });
};

const sendPasteEvent = (text?: string) => {
  const clipboardEvent = createPasteEvent(
    text || (() => window.navigator.clipboard.readText())
  );
  document.dispatchEvent(clipboardEvent);
};

const pasteWithCtrlCmdShiftV = (text?: string) => {
  Keyboard.withModifierKeys({ ctrl: true, shift: true }, () => {
    //triggering keydown with an empty clipboard
    Keyboard.keyPress(KEYS.V);
    //triggering paste event with faked clipboard
    sendPasteEvent(text);
  });
};

const pasteWithCtrlCmdV = (text?: string) => {
  Keyboard.withModifierKeys({ ctrl: true }, () => {
    //triggering keydown with an empty clipboard
    Keyboard.keyPress(KEYS.V);
    //triggering paste event with faked clipboard
    sendPasteEvent(text);
  });
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(() => resolve(null), ms));

beforeEach(async () => {
  ReactDOM.unmountComponentAtNode(document.getLayerById("root")!);

  localStorage.clear();

  mouse.reset();

  await render(<ExcalidrawApp />);
  h.app.setAppState({ zoom: { value: 1 as NormalizedZoomValue } });
  setClipboardText("");
  Object.assign(document, {
    layerFromPoint: () => GlobalTestState.canvas
  });
});

describe("general paste behavior", () => {
  it("should randomize seed on paste", async () => {
    const rectangle = API.createLayer({ type: "rectangle" });
    const clipboardJSON = (await copyToClipboard([rectangle], null))!;

    pasteWithCtrlCmdV(clipboardJSON);

    await waitFor(() => {
      expect(h.layers.length).toBe(1);
      expect(h.layers[0].seed).not.toBe(rectangle.seed);
    });
  });

  it("should retain seed on shift-paste", async () => {
    const rectangle = API.createLayer({ type: "rectangle" });
    const clipboardJSON = (await copyToClipboard([rectangle], null))!;

    // assert we don't randomize seed on shift-paste
    pasteWithCtrlCmdShiftV(clipboardJSON);
    await waitFor(() => {
      expect(h.layers.length).toBe(1);
      expect(h.layers[0].seed).toBe(rectangle.seed);
    });
  });
});

describe("paste text as single lines", () => {
  it("should create an layer for each line when copying with Ctrl/Cmd+V", async () => {
    const text = "sajgfakfn\naaksfnknas\nakefnkasf";
    setClipboardText(text);
    pasteWithCtrlCmdV();
    await waitFor(() => {
      expect(h.layers.length).toEqual(text.split("\n").length);
    });
  });

  it("should ignore empty lines when creating an layer for each line", async () => {
    const text = "\n\nsajgfakfn\n\n\naaksfnknas\n\nakefnkasf\n\n\n";
    setClipboardText(text);
    pasteWithCtrlCmdV();
    await waitFor(() => {
      expect(h.layers.length).toEqual(3);
    });
  });

  it("should not create any layer if clipboard has only new lines", async () => {
    const text = "\n\n\n\n\n";
    setClipboardText(text);
    pasteWithCtrlCmdV();
    await waitFor(async () => {
      await sleep(50); // layers lenght will always be zero if we don't wait, since paste is async
      expect(h.layers.length).toEqual(0);
    });
  });

  it("should space items correctly", async () => {
    const text = "hkhkjhki\njgkjhffjh\njgkjhffjh";
    const lineHeightPx =
      getLineHeightInPx(
        h.app.state.currentItemFontSize,
        getDefaultLineHeight(h.state.currentItemFontFamily)
      ) +
      10 / h.app.state.zoom.value;
    mouse.moveTo(100, 100);
    setClipboardText(text);
    pasteWithCtrlCmdV();
    await waitFor(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [fx, firstElY] = getLayerBounds(h.layers[0]);
      for (let i = 1; i < h.layers.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [fx, elY] = getLayerBounds(h.layers[i]);
        expect(elY).toEqual(firstElY + lineHeightPx * i);
      }
    });
  });

  it("should leave a space for blank new lines", async () => {
    const text = "hkhkjhki\n\njgkjhffjh";
    const lineHeightPx =
      getLineHeightInPx(
        h.app.state.currentItemFontSize,
        getDefaultLineHeight(h.state.currentItemFontFamily)
      ) +
      10 / h.app.state.zoom.value;
    mouse.moveTo(100, 100);
    setClipboardText(text);
    pasteWithCtrlCmdV();
    await waitFor(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [fx, firstElY] = getLayerBounds(h.layers[0]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [lx, lastElY] = getLayerBounds(h.layers[1]);
      expect(lastElY).toEqual(firstElY + lineHeightPx * 2);
    });
  });
});

describe("paste text as a single layer", () => {
  it("should create single text layer when copying text with Ctrl/Cmd+Shift+V", async () => {
    const text = "sajgfakfn\naaksfnknas\nakefnkasf";
    setClipboardText(text);
    pasteWithCtrlCmdShiftV();
    await waitFor(() => {
      expect(h.layers.length).toEqual(1);
    });
  });
  it("should not create any layer when only new lines in clipboard", async () => {
    const text = "\n\n\n\n";
    setClipboardText(text);
    pasteWithCtrlCmdShiftV();
    await waitFor(async () => {
      await sleep(50);
      expect(h.layers.length).toEqual(0);
    });
  });
});

describe("Paste bound text container", () => {
  const container = {
    type: "ellipse",
    id: "container-id",
    x: 554.984375,
    y: 196.0234375,
    width: 166,
    height: 187.01953125,
    roundness: { type: 2 },
    boundLayers: [{ type: "text", id: "text-id" }]
  };
  const textLayer = {
    type: "text",
    id: "text-id",
    x: 560.51171875,
    y: 202.033203125,
    width: 154,
    height: 175,
    fontSize: 20,
    fontFamily: 1,
    text: "Excalidraw is a\nvirtual \nopensource \nwhiteboard for \nsketching \nhand-drawn like\ndiagrams",
    baseline: 168,
    textAlign: "center",
    verticalAlign: "middle",
    containerId: container.id,
    originalText:
      "Excalidraw is a virtual opensource whiteboard for sketching hand-drawn like diagrams"
  };

  it("should fix ellipse bounding box", async () => {
    const data = JSON.stringify({
      type: "excalidraw/clipboard",
      layers: [container, textLayer]
    });
    setClipboardText(data);
    pasteWithCtrlCmdShiftV();

    await waitFor(async () => {
      await sleep(1);
      expect(h.layers.length).toEqual(2);
      const container = h.layers[0];
      expect(container.height).toBe(368);
      expect(container.width).toBe(166);
    });
  });

  it("should fix diamond bounding box", async () => {
    const data = JSON.stringify({
      type: "excalidraw/clipboard",
      layers: [
        {
          ...container,
          type: "diamond"
        },
        textLayer
      ]
    });
    setClipboardText(data);
    pasteWithCtrlCmdShiftV();

    await waitFor(async () => {
      await sleep(1);
      expect(h.layers.length).toEqual(2);
      const container = h.layers[0];
      expect(container.height).toBe(770);
      expect(container.width).toBe(166);
    });
  });
});
