import { Canvas } from "fabric";
import hotkeys from "hotkeys-js";

/**
 * Handles keyboard events for objects
 */
class ObjectKeyboard {
  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;

  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  /**
   * Binds events
   * @private
   */
  private bindEvents(): void {
    // Remove object
    hotkeys("delete,backspace", () => {
      const activeObjects = this.canvas.getActiveObjects();
      this.canvas.remove(...activeObjects);
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
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
 * Keyboard plugin
 * @param canvas Canvas
 */
export const registerKeyboard = (canvas: Canvas): void => {
  new ObjectKeyboard(canvas).init();
};
