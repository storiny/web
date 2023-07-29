import { ActiveSelection, BaseFabricObject, Canvas } from "fabric";
import hotkeys from "hotkeys-js";

/**
 * History plugin
 */
class HistoryPlugin {
  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;
  private readonly undoStack: any[];
  private readonly redoStack: any[];
  private nextState: string;
  private isProcessing: boolean;

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
  }

  /**
   * Returns current stringified canvas state
   */
  private getNextState(): string {
    return JSON.stringify(this.canvas.toDatalessJSON());
  }

  private saveAction(): string | void {
    if (this.isProcessing) {
      return;
    }

    const json = this.nextState;
    this.undoStack.push(json);
    this.nextState = this.getNextState();
  }

  private loadHistory(history: string | Record<string, any>): void {
    this.canvas.loadFromJSON(history).then(() => {
      this.canvas.renderAll();
      this.isProcessing = false;
    });
  }

  public undo(): void {
    // The undo process will render the new states of the objects.
    // Therefore, `object:added` and `object:modified` events will trigger again
    // and will cause issues
    this.isProcessing = true;

    const history = this.undoStack.pop();
    if (history) {
      // Push the current state to the redo stack
      this.redoStack.push(this.getNextState());
      this.nextState = history;
      this.loadHistory(history);
    } else {
      this.isProcessing = false;
    }
  }

  /**
   * Binds events
   * @private
   */
  private bindEvents(): void {
    this.canvas.on({
      "object:added": this.saveAction,
      "object:removed": this.saveAction,
      "object:modified": this.saveAction,
      "object:skewing": this.saveAction
    });

    hotkeys("ctrl+c,ctrl+v,ctrl+x", (keyboardEvent, hotkeysEvent) => {
      if (hotkeysEvent.key === "ctrl+c" || hotkeysEvent.key === "ctrl+x") {
        this.cache = this.canvas.getActiveObject() || null;
        this.cloneCount = 0;

        // Cut
        if (hotkeysEvent.key === "ctrl+x") {
          this.removeActiveObject();
        }
      } else if (hotkeysEvent.key === "ctrl+v") {
        if (this.cache) {
          this.clone(this.cache);
        }
      }
    });
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.bindEvents();
  }
}

/**
 * History plugin
 * @param canvas Canvas
 */
export const registerHistory = (canvas: Canvas): void => {
  new HistoryPlugin(canvas).init();
};
