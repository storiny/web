import { Canvas, TPointerEventInfo } from "fabric";

import { CURSORS } from "../../../../constants";

type PanEvent = "pan:start" | "pan:end" | "pan:move";

/**
 * Handles panning the canvas
 */
export class PanPlugin {
  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.enabled = false;
    this.is_panning = false;
    this.last_x = 0;
    this.last_y = 0;
  }

  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;
  /**
   * Boolean flag indicating whether the panning mode
   * is enabled
   * @private
   */
  private enabled: boolean;
  /**
   * Boolean flag indicating whether the panning is in
   * progress
   * @private
   */
  private is_panning: boolean;
  /**
   * Last mouse X position
   * @private
   */
  private last_x: number;
  /**
   * Last mouse Y position
   * @private
   */
  private last_y: number;

  /**
   * Returns the enabled state of the plugin
   */
  public get_enabled(): boolean {
    return this.enabled;
  }

  /**
   * Mutates the enabled state of the plugin
   * @param enabled Enabled state
   */
  public set_enabled(enabled: boolean): void {
    this.enabled = enabled;

    if (enabled) {
      this.set_cursor("grab");
      this.canvas.selection = false;
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
    } else if (!this.canvas.draw_manager?.get_enabled()) {
      this.set_default_cursor();
      this.canvas.selection = true;
    }

    this.bind_events(); // Rebind events
  }

  /**
   * Fires pan events in the canvas
   * @param event_name Event name
   * @private
   */
  private fire_event(event_name: PanEvent): void {
    this.canvas.fire(event_name as any);
  }

  /**
   * Sets the cursor
   * @private
   */
  private set_cursor(type: "grab" | "grabbing"): void {
    this.canvas.defaultCursor = CURSORS[type];
    this.canvas.hoverCursor = CURSORS[type];
    this.canvas.setCursor(CURSORS[type]);
  }

  /**
   * Sets default cursor
   * @private
   */
  private set_default_cursor(): void {
    this.canvas.defaultCursor = CURSORS.default;
    this.canvas.hoverCursor = CURSORS.default;
    this.canvas.setCursor(CURSORS.default);
  }

  /**
   * Augments the canvas
   * @private
   */
  private augment_canvas(): void {
    this.canvas.pan_manager = this;
  }

  /**
   * Mouse down handler
   * @param options Options
   * @private
   */
  private mouse_down_handler(options: TPointerEventInfo): void {
    if (!this.enabled) {
      return;
    }

    this.last_x = (options.e as any).clientX;
    this.last_y = (options.e as any).clientY;
    this.is_panning = true;
    this.canvas.selection = false;
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.set_cursor("grabbing");
    this.fire_event("pan:start");
  }

  /**
   * Mouse move handler
   * @param options Options
   * @private
   */
  private mouse_move_handler(options: TPointerEventInfo): void {
    if (!this.enabled || !this.is_panning) {
      return;
    }

    const viewport_transform = this.canvas.viewportTransform;
    viewport_transform[4] += (options.e as any).clientX - this.last_x;
    viewport_transform[5] += (options.e as any).clientY - this.last_y;

    this.canvas.requestRenderAll();
    this.last_x = (options.e as any).clientX;
    this.last_y = (options.e as any).clientY;
    this.fire_event("pan:move");
  }

  /**
   * Mouse up handler
   * @private
   */
  private mouse_up_handler(): void {
    if (!this.enabled || !this.is_panning) {
      return;
    }

    this.canvas.setViewportTransform(this.canvas.viewportTransform);
    this.is_panning = false;
    this.canvas.selection = true;
    this.canvas.requestRenderAll();
    this.set_cursor("grab");
    this.fire_event("pan:end");
  }

  /**
   * Binds events
   * @private
   */
  private bind_events(): void {
    this.canvas.on("mouse:down", this.mouse_down_handler.bind(this));
    this.canvas.on("mouse:move", this.mouse_move_handler.bind(this));
    this.canvas.on("mouse:up", this.mouse_up_handler.bind(this));
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.bind_events();
    this.augment_canvas();
  }
}

/**
 * Pan plugin
 * @param canvas Canvas
 */
export const register_pan = (canvas: Canvas): void => {
  new PanPlugin(canvas).init();
};
