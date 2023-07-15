import { KEYS } from "../../keys";
import { mutateLayer } from "../../layer/mutateLayer";
import {
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextLayer
} from "../../layer/types";
import { ToolName } from "../queries/toolQueries";
import { fireEvent, GlobalTestState } from "../test-utils";
import { API } from "./api";

const { h } = window;

let altKey = false;
let shiftKey = false;
let ctrlKey = false;

export type KeyboardModifiers = {
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
};
export class Keyboard {
  static withModifierKeys = (modifiers: KeyboardModifiers, cb: () => void) => {
    const prevAltKey = altKey;
    const prevShiftKey = shiftKey;
    const prevCtrlKey = ctrlKey;

    altKey = !!modifiers.alt;
    shiftKey = !!modifiers.shift;
    ctrlKey = !!modifiers.ctrl;

    try {
      cb();
    } finally {
      altKey = prevAltKey;
      shiftKey = prevShiftKey;
      ctrlKey = prevCtrlKey;
    }
  };

  static keyDown = (key: string) => {
    fireEvent.keyDown(document, {
      key,
      ctrlKey,
      shiftKey,
      altKey
    });
  };

  static keyUp = (key: string) => {
    fireEvent.keyUp(document, {
      key,
      ctrlKey,
      shiftKey,
      altKey
    });
  };

  static keyPress = (key: string) => {
    Keyboard.keyDown(key);
    Keyboard.keyUp(key);
  };

  static codeDown = (code: string) => {
    fireEvent.keyDown(document, {
      code,
      ctrlKey,
      shiftKey,
      altKey
    });
  };

  static codeUp = (code: string) => {
    fireEvent.keyUp(document, {
      code,
      ctrlKey,
      shiftKey,
      altKey
    });
  };

  static codePress = (code: string) => {
    Keyboard.codeDown(code);
    Keyboard.codeUp(code);
  };
}

export class Pointer {
  public clientX = 0;
  public clientY = 0;

  constructor(
    private readonly pointerType: "mouse" | "touch" | "pen",
    private readonly pointerId = 1
  ) {}

  reset() {
    this.clientX = 0;
    this.clientY = 0;
  }

  getPosition() {
    return [this.clientX, this.clientY];
  }

  restorePosition(x = 0, y = 0) {
    this.clientX = x;
    this.clientY = y;
    fireEvent.pointerMove(GlobalTestState.canvas, this.getEvent());
  }

  private getEvent() {
    return {
      clientX: this.clientX,
      clientY: this.clientY,
      pointerType: this.pointerType,
      pointerId: this.pointerId,
      altKey,
      shiftKey,
      ctrlKey
    };
  }

  // incremental (moving by deltas)
  // ---------------------------------------------------------------------------

  move(dx: number, dy: number) {
    if (dx !== 0 || dy !== 0) {
      this.clientX += dx;
      this.clientY += dy;
      fireEvent.pointerMove(GlobalTestState.canvas, this.getEvent());
    }
  }

  down(dx = 0, dy = 0) {
    this.move(dx, dy);
    fireEvent.pointerDown(GlobalTestState.canvas, this.getEvent());
  }

  up(dx = 0, dy = 0) {
    this.move(dx, dy);
    fireEvent.pointerUp(GlobalTestState.canvas, this.getEvent());
  }

  click(dx = 0, dy = 0) {
    this.down(dx, dy);
    this.up();
  }

  doubleClick(dx = 0, dy = 0) {
    this.move(dx, dy);
    fireEvent.doubleClick(GlobalTestState.canvas, this.getEvent());
  }

  // absolute coords
  // ---------------------------------------------------------------------------

  moveTo(x: number = this.clientX, y: number = this.clientY) {
    this.clientX = x;
    this.clientY = y;
    fireEvent.pointerMove(GlobalTestState.canvas, this.getEvent());
  }

  downAt(x = this.clientX, y = this.clientY) {
    this.clientX = x;
    this.clientY = y;
    fireEvent.pointerDown(GlobalTestState.canvas, this.getEvent());
  }

  upAt(x = this.clientX, y = this.clientY) {
    this.clientX = x;
    this.clientY = y;
    fireEvent.pointerUp(GlobalTestState.canvas, this.getEvent());
  }

  clickAt(x: number, y: number) {
    this.downAt(x, y);
    this.upAt();
  }

  rightClickAt(x: number, y: number) {
    fireEvent.contextMenu(GlobalTestState.canvas, {
      button: 2,
      clientX: x,
      clientY: y
    });
  }

  doubleClickAt(x: number, y: number) {
    this.moveTo(x, y);
    fireEvent.doubleClick(GlobalTestState.canvas, this.getEvent());
  }

  // ---------------------------------------------------------------------------

  select(
    /** if multiple layers supplied, they're shift-selected */
    layers: ExcalidrawLayer | ExcalidrawLayer[]
  ) {
    API.clearSelection();
    Keyboard.withModifierKeys({ shift: true }, () => {
      layers = Array.isArray(layers) ? layers : [layers];
      layers.forEach((layer) => {
        this.reset();
        this.click(layer.x, layer.y);
      });
    });
    this.reset();
  }

  clickOn(layer: ExcalidrawLayer) {
    this.reset();
    this.click(layer.x, layer.y);
    this.reset();
  }

  doubleClickOn(layer: ExcalidrawLayer) {
    this.reset();
    this.doubleClick(layer.x, layer.y);
    this.reset();
  }
}

const mouse = new Pointer("mouse");

export class UI {
  static clickTool = (toolName: ToolName) => {
    fireEvent.click(GlobalTestState.renderResult.getByToolName(toolName));
  };

  static clickLabeledLayer = (label: string) => {
    const layer = document.querySelector(`[aria-label='${label}']`);
    if (!layer) {
      throw new Error(`No labeled layer found: ${label}`);
    }
    fireEvent.click(layer);
  };

  static clickOnTestId = (testId: string) => {
    const layer = document.querySelector(`[data-testid='${testId}']`);
    // const layer = GlobalTestState.renderResult.queryByTestId(testId);
    if (!layer) {
      throw new Error(`No layer with testid "${testId}" found`);
    }
    fireEvent.click(layer);
  };

  /**
   * Creates an Excalidraw layer, and returns a proxy that wraps it so that
   * accessing props will return the latest ones from the object existing in
   * the app's layers array. This is because across the app lifecycle we tend
   * to recreate layer objects and the returned reference will become stale.
   *
   * If you need to get the actual layer, not the proxy, call `get()` method
   * on the proxy object.
   */
  static createLayer<T extends ToolName>(
    type: T,
    {
      position = 0,
      x = position,
      y = position,
      size = 10,
      width = size,
      height = width,
      angle = 0
    }: {
      angle?: number;
      height?: number;
      position?: number;
      size?: number;
      width?: number;
      x?: number;
      y?: number;
    } = {}
  ): (T extends "arrow" | "line" | "freedraw"
    ? ExcalidrawLinearLayer
    : T extends "text"
    ? ExcalidrawTextLayer
    : ExcalidrawLayer) & {
    /** Returns the actual, current layer from the layers array, instead
        of the proxy */
    get(): T extends "arrow" | "line" | "freedraw"
      ? ExcalidrawLinearLayer
      : T extends "text"
      ? ExcalidrawTextLayer
      : ExcalidrawLayer;
  } {
    UI.clickTool(type);
    mouse.reset();
    mouse.down(x, y);
    mouse.reset();
    mouse.up(x + (width ?? height ?? size), y + (height ?? size));

    const origLayer = h.layers[h.layers.length - 1] as any;

    if (angle !== 0) {
      mutateLayer(origLayer, { angle });
    }

    return new Proxy(
      {},
      {
        get(target, prop) {
          const currentLayer = h.layers.find(
            (layer) => layer.id === origLayer.id
          ) as any;
          if (prop === "get") {
            if (currentLayer.hasOwnProperty("get")) {
              throw new Error(
                "trying to get `get` test property, but ExcalidrawLayer seems to define its own"
              );
            }
            return () => currentLayer;
          }
          return currentLayer[prop];
        }
      }
    ) as any;
  }

  static group(layers: ExcalidrawLayer[]) {
    mouse.select(layers);
    Keyboard.withModifierKeys({ ctrl: true }, () => {
      Keyboard.keyPress(KEYS.G);
    });
  }

  static queryContextMenu = () =>
    GlobalTestState.renderResult.container.querySelector(
      ".context-menu"
    ) as HTMLLayer | null;
}
