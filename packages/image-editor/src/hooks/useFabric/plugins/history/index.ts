import { Canvas } from "fabric";
import hotkeys from "hotkeys-js";

import { Layer } from "../../../../types";

/**
 * Debounces a function for the provided delay
 * @param func Function
 * @param timeout Timeout delay
 */
const debounce = <Params extends any[]>(
  func: (...args: Params) => any,
  timeout: number
): ((...args: Params) => void) => {
  let timer: NodeJS.Timeout;
  return (...args: Params) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
};

/**
 * History plugin
 */
export class HistoryPlugin {
  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;
  /**
   * Undo stack
   * @private
   */
  private readonly undoStack: any[];
  /**
   * Redo stack
   * @private
   */
  private readonly redoStack: any[];
  /**
   * Undo and redo stack limit
   * @private
   */
  private readonly stackLimit = 150;
  /**
   * Next serialized state
   * @private
   */
  private nextState: string;
  /**
   * The undo and redo processes will render the new states of the objects.
   * Therefore, `object:added` and `object:modified` events will trigger again,
   * and will cause issues
   * @private
   */
  private isProcessing: boolean;
  /**
   * Properties to include when serializing the state
   * @private
   */
  private readonly propertiesToInclude: Array<keyof Layer | string> = [
    "_type",
    "id",
    "interactive",
    "name",
    "locked",
    "selected",
    "seed",
    "fillStyle",
    "fillWeight",
    "hachureGap",
    "roughness",
    "strokeStyle",
    "fontFamily",
    "fontSize",
    "lineHeight",
    "text",
    "textAlign",
    "verticalAlign"
  ];
  /**
   * Debounced save action
   * @private
   */
  private readonly debouncedSaveAction: () => void;

  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.undoStack = [];
    this.redoStack = [];
    this.nextState = this.getNextState();
    this.isProcessing = false;
    this.debouncedSaveAction = debounce(this.saveActionImpl.bind(this), 100);
  }

  /**
   * Returns current stringified canvas state
   */
  private getNextState(): string {
    return JSON.stringify(this.canvas.toDatalessJSON(this.propertiesToInclude));
  }

  /**
   * Saves action to the store
   * @private
   */
  private saveAction(): void {
    if (this.isProcessing) {
      return;
    }

    this.debouncedSaveAction();
  }

  /**
   * Save action implementation
   * @private
   */
  private saveActionImpl(): string | void {
    const json = this.nextState;
    this.undoStack.push(json);
    this.nextState = this.getNextState();

    // Stack limit
    while (this.undoStack.length > this.stackLimit) {
      this.undoStack.shift();
    }
  }

  /**
   * Loads history to the canvas
   * @param history History
   * @private
   */
  private loadHistory(history: string | Record<string, any>): void {
    this.canvas
      .loadFromJSON(history, (prop, object) => {
        object.set({
          width: prop.width,
          height: prop.height,
          scaleX: 1,
          scaleY: 1
        });
      })
      .then(() => {
        this.canvas.renderAll();
        this.isProcessing = false;
      });
  }

  /**
   * Undo
   */
  public undo(): void {
    this.isProcessing = true;
    const history = this.undoStack.pop();

    if (history) {
      // Push the current state to the redo stack
      this.redoStack.push(this.getNextState());
      this.nextState = history;
      this.loadHistory(history);

      // Stack limit
      while (this.redoStack.length > this.stackLimit) {
        this.redoStack.shift();
      }
    } else {
      this.isProcessing = false;
    }
  }

  /**
   * Redo
   */
  public redo(): void {
    this.isProcessing = true;
    const history = this.redoStack.pop();

    if (history) {
      // Every redo action is actually a new action to the undo history
      this.undoStack.push(this.getNextState());
      this.nextState = history;
      this.loadHistory(history);
    } else {
      this.isProcessing = false;
    }
  }

  /**
   * Clears the history
   */
  public clear(): void {
    this.undoStack.length = 0;
    this.undoStack.length = 0;
  }

  /**
   * Pauses capturing the history
   */
  public pause(): void {
    this.isProcessing = true;
  }

  /**
   * Resumes capturing the history
   */
  public resume(): void {
    this.isProcessing = false;
    this.saveAction();
  }

  /**
   * Predicate method for determining undo
   */
  public canUndo(): boolean {
    return Boolean(this.undoStack.length);
  }

  /**
   * Predicate method for determining undo
   */
  public canRedo(): boolean {
    return Boolean(this.redoStack.length);
  }

  /**
   * Augments the canvas
   * @private
   */
  private augmentCanvas(): void {
    this.canvas.historyManager = this;
  }

  /**
   * Binds events
   * @private
   */
  private bindEvents(): void {
    this.canvas.on({
      "object:added": this.saveAction.bind(this),
      "object:removed": this.saveAction.bind(this),
      "object:modified": this.saveAction.bind(this),
      "object:skewing": this.saveAction.bind(this)
    });

    hotkeys("ctrl+z,ctrl+y,ctrl+shift+z", (keyboardEvent, hotkeysEvent) => {
      switch (hotkeysEvent.key) {
        case "ctrl+z":
          this.undo();
          break;
        case "ctrl+y":
        case "ctrl+shift+z":
          this.redo();
          break;
        default:
          break;
      }
    });
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.bindEvents();
    this.augmentCanvas();
  }
}

/**
 * History plugin
 * @param canvas Canvas
 */
export const registerHistory = (canvas: Canvas): void => {
  new HistoryPlugin(canvas).init();
};
