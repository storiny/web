import { Canvas, TPointerEventInfo } from "fabric";

import { CURSORS } from "../../../../constants";

type PanEvent = "pan:start" | "pan:end" | "pan:move";

/**
 * Handles panning the canvas
 */
export class PanPlugin {
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
  private isPanning: boolean;
  /**
   * Last mouse X position
   * @private
   */
  private lastX: number;
  /**
   * Last mouse Y position
   * @private
   */
  private lastY: number;

  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.enabled = false;
    this.isPanning = false;
    this.lastX = 0;
    this.lastY = 0;
  }

  /**
   * Returns the enabled state of the plugin
   */
  public getEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Mutates the enabled state of the plugin
   * @param enabled Enabled state
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (enabled) {
      this.setCursor("grab");
      this.canvas.selection = false;
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
    } else if (!this.canvas.drawManager?.getEnabled()) {
      this.setDefaultCursor();
      this.canvas.selection = true;
    }

    this.bindEvents(); // Rebind events
  }

  /**
   * Fires pan events in the canvas
   * @param eventName Event name
   * @private
   */
  private fireEvent(eventName: PanEvent): void {
    this.canvas.fire(eventName as any);
  }

  /**
   * Sets the cursor
   * @private
   */
  private setCursor(type: "grab" | "grabbing"): void {
    this.canvas.defaultCursor = CURSORS[type];
    this.canvas.hoverCursor = CURSORS[type];
    this.canvas.setCursor(CURSORS[type]);
  }

  /**
   * Sets default cursor
   * @private
   */
  private setDefaultCursor(): void {
    this.canvas.defaultCursor = CURSORS.default;
    this.canvas.hoverCursor = CURSORS.default;
    this.canvas.setCursor(CURSORS.default);
  }

  /**
   * Augments the canvas
   * @private
   */
  private augmentCanvas(): void {
    this.canvas.panManager = this;
  }

  /**
   * Mouse down handler
   * @param options Options
   * @private
   */
  private mouseDownHandler(options: TPointerEventInfo): void {
    if (!this.enabled) {
      return;
    }

    this.lastX = (options.e as any).clientX;
    this.lastY = (options.e as any).clientY;
    this.isPanning = true;
    this.canvas.selection = false;
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.setCursor("grabbing");
    this.fireEvent("pan:start");
  }

  /**
   * Mouse move handler
   * @param options Options
   * @private
   */
  private mouseMoveHandler(options: TPointerEventInfo): void {
    if (!this.enabled || !this.isPanning) {
      return;
    }

    const viewportTransform = this.canvas.viewportTransform;
    viewportTransform[4] += (options.e as any).clientX - this.lastX;
    viewportTransform[5] += (options.e as any).clientY - this.lastY;

    this.canvas.requestRenderAll();
    this.lastX = (options.e as any).clientX;
    this.lastY = (options.e as any).clientY;
    this.fireEvent("pan:move");
  }

  /**
   * Mouse up handler
   * @private
   */
  private mouseUpHandler(): void {
    if (!this.enabled || !this.isPanning) {
      return;
    }

    this.canvas.setViewportTransform(this.canvas.viewportTransform);
    this.isPanning = false;
    this.canvas.selection = true;
    this.canvas.requestRenderAll();
    this.setCursor("grab");
    this.fireEvent("pan:end");
  }

  /**
   * Binds events
   * @private
   */
  private bindEvents(): void {
    this.canvas.on("mouse:down", this.mouseDownHandler.bind(this));
    this.canvas.on("mouse:move", this.mouseMoveHandler.bind(this));
    this.canvas.on("mouse:up", this.mouseUpHandler.bind(this));
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
 * Pan plugin
 * @param canvas Canvas
 */
export const registerPan = (canvas: Canvas): void => {
  new PanPlugin(canvas).init();
};
