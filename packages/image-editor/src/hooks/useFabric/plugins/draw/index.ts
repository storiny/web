import { BaseFabricObject, Canvas } from "fabric";

import { CURSORS } from "../../../../constants";
import { Arrow } from "../../../../lib";
import { isLinearObject } from "../../../../utils";

type DrawEvent = "draw:start" | "draw:end" | "draw:scaling";

/**
 * Handles drawing objects using mouse
 */
class DrawPlugin {
  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;
  /**
   * Boolean flag indicating whether the drawing operation
   * has been initiated
   * @private
   */
  private started: boolean;
  /**
   * Boolean flag indicating whether the drawing mode
   * is enabled
   * @private
   */
  private enabled: boolean;
  /**
   * The object being drawn
   * @private
   */
  private object: BaseFabricObject | null;
  /**
   * Draw start X position
   * @private
   */
  private x: number;
  /**
   * Draw start Y position
   * @private
   */
  private y: number;

  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.started = false;
    this.enabled = false;
    this.object = null;
    this.x = 0;
    this.y = 0;
  }

  /**
   * Handles draw start event
   * @private
   */
  private startDrawing(): void {
    this.canvas.selection = false;
    this.started = true;
    this.setCrosshairCursor();
    this.fireEvent("draw:start");
  }

  /**
   * Handlers draw end event
   * @private
   */
  private endDrawing(): void {
    if (!this.started) {
      return;
    }

    this.canvas.selection = true;
    this.started = false;
    this.enabled = false;
    this.setDefaultCursor();

    if (this.object) {
      this.object.set({
        hasBorders: true,
        isDrawing: false
      });
      this.canvas.setActiveObject(this.object as any);
      this.fireEvent("draw:end");
      this.object = null;
    }
  }

  /**
   * Fires draw events in the canvas
   * @param eventName Event name
   * @private
   */
  private fireEvent(eventName: DrawEvent): void {
    this.canvas.fire(eventName as any, { target: this.object } as any);
  }

  /**
   * Sets crosshair cursor
   * @private
   */
  private setCrosshairCursor(): void {
    this.canvas.defaultCursor = CURSORS.crosshair;
    this.canvas.setCursor(CURSORS.crosshair);
  }

  /**
   * Sets default cursor
   * @private
   */
  private setDefaultCursor(): void {
    this.canvas.defaultCursor = CURSORS.default;
    this.canvas.setCursor(CURSORS.default);
  }

  /**
   * Binds events
   * @private
   */
  private bindEvents(): void {
    this.canvas.on("mouse:down", (options) => {
      if (!this.enabled) {
        return;
      }

      if (this.started) {
        this.endDrawing();
        return;
      }

      this.startDrawing();

      const mouse = this.canvas.getPointer(options.e);
      this.x = mouse.x;
      this.y = mouse.y;

      // this.object = new Ellipse({
      //   width: 1,
      //   height: 1,
      //   left: this.x,
      //   top: this.y,
      //   hasBorder: false,
      //   isDrawing: true
      // });
      this.object = new Arrow({
        x1: this.x,
        y1: this.y,
        x2: this.x + 1,
        y2: this.y + 1,
        hasBorder: false,
        isDrawing: true
      });

      this.object.set("hasBorders", false);
      this.canvas.add(this.object);
      this.canvas.requestRenderAll();
      this.canvas.setActiveObject(this.object as any);
    });

    this.canvas.on("mouse:move", (options) => {
      if (!this.enabled || !this.started || !this.object) {
        return;
      }

      const mouse = this.canvas.getPointer(options.e);

      if (isLinearObject(this.object)) {
        this.object.set({
          x2: mouse.x,
          y2: mouse.y,
          dirty: true
        });
      } else {
        const w = mouse.x - this.x;
        const h = mouse.y - this.y;

        if (!w || !h) {
          return;
        }

        this.object.set({
          width: Math.abs(w),
          height: Math.abs(h),
          left: w < 0 ? this.x + w : this.object.left,
          top: h < 0 ? this.y + h : this.object.top,
          dirty: true
        });
      }

      this.fireEvent("draw:scaling");
      this.canvas.requestRenderAll();
    });

    this.canvas.on("mouse:up", this.endDrawing.bind(this));
    this.canvas.on("mouse:out", this.endDrawing.bind(this));
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.bindEvents();

    if (this.enabled) {
      this.setCrosshairCursor();
    }
  }
}

/**
 * Draw plugin
 * @param canvas Canvas
 */
export const registerDraw = (canvas: Canvas): void => {
  new DrawPlugin(canvas).init();
};
