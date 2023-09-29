import { Canvas } from "fabric";
import hotkeys from "hotkeys-js";

/**
 * Handles keyboard events for objects
 */
class KeyboardPlugin {
  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;

  /**
   * Binds events
   * @private
   */
  private bind_events(): void {
    // Remove object
    hotkeys("delete,backspace", () => {
      const active_objects = this.canvas.getActiveObjects();
      this.canvas.remove(...active_objects);
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
    });
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.bind_events();
  }
}

/**
 * Keyboard plugin
 * @param canvas Canvas
 */
export const register_keyboard = (canvas: Canvas): void => {
  new KeyboardPlugin(canvas).init();
};
