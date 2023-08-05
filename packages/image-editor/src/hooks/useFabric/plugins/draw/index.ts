import { BaseFabricObject, Canvas, TPointerEventInfo } from "fabric";

import { CURSORS, DrawableLayerType, LayerType } from "../../../../constants";
import { Arrow, Diamond, Ellipse, Line, Rect } from "../../../../lib";
import { isLinearObject } from "../../../../utils";

type DrawEvent = "draw:start" | "draw:end" | "draw:scaling";
type LinearShape = typeof Arrow | typeof Line;
type SolidShape = typeof Diamond | typeof Ellipse | typeof Rect;
type Shape = LinearShape | SolidShape;

const layerTypeToShapeMap: {
  [k in DrawableLayerType]: Shape;
} = {
  [LayerType.ARROW]: Arrow,
  [LayerType.DIAMOND]: Diamond,
  [LayerType.ELLIPSE]: Ellipse,
  [LayerType.LINE]: Line,
  [LayerType.RECTANGLE]: Rect
};

/**
 * Handles drawing objects using mouse
 */
export class DrawPlugin {
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
   * The type of the layer to draw
   * @private
   */
  private layerType: DrawableLayerType | null;
  /**
   * Draw complete callback
   * @private
   */
  private onDrawComplete: undefined | (() => void);
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
    this.layerType = null;
    this.x = 0;
    this.y = 0;
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
      this.setCrosshairCursor();
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
    } else if (!this.canvas.panManager?.getEnabled()) {
      this.setDefaultCursor();
    }
  }

  /**
   * Mutates the layer type of the plugin
   * @param layerType Type of the shape
   */
  public setLayerType(layerType: DrawableLayerType): void {
    this.layerType = layerType;
  }

  /**
   * Mutates the draw complete callback of the plugin
   * @param callback
   */
  public setDrawComplete(callback?: () => void): void {
    this.onDrawComplete = callback;
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
    this.x = 0;
    this.y = 0;
    this.setDefaultCursor();

    if (this.object) {
      this.object.set({
        hasBorders: true,
        isDrawing: false,
        originX: "center",
        originY: "center",
        // Compensate origin mutation
        left: this.object.left + this.object.width / 2,
        top: this.object.top + this.object.height / 2
      });

      this.canvas.setActiveObject(this.object as any);
      this.fireEvent("draw:end");
      this.object = null;
    }

    if (this.onDrawComplete) {
      this.onDrawComplete();
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
    this.canvas.hoverCursor = CURSORS.crosshair;
    this.canvas.setCursor(CURSORS.crosshair);
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
    this.canvas.drawManager = this;
  }

  /**
   * Mouse down handler
   * @param options Options
   * @private
   */
  private mouseDownHandler(options: TPointerEventInfo): void {
    if (!this.enabled || !this.layerType) {
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

    if ([LayerType.LINE, LayerType.ARROW].includes(this.layerType)) {
      const Class = layerTypeToShapeMap[this.layerType] as LinearShape;

      this.object = new Class({
        x1: this.x,
        y1: this.y,
        x2: this.x + 1,
        y2: this.y + 1,
        hasBorders: false,
        isDrawing: true
      });
    } else {
      const Class = layerTypeToShapeMap[this.layerType] as SolidShape;

      this.object = new Class({
        width: 1,
        height: 1,
        left: this.x,
        top: this.y,
        hasBorders: false,
        isDrawing: true
      });
    }

    this.object.set({
      originX: "left",
      originY: "top"
    });

    this.canvas.add(this.object);
    this.canvas.requestRenderAll();
    this.canvas.setActiveObject(this.object as any);
  }

  /**
   * Mouse move handler
   * @param options Options
   * @private
   */
  private mouseMoveHandler(options: TPointerEventInfo): void {
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
  }

  /**
   * Binds events
   * @private
   */
  private bindEvents(): void {
    this.canvas.on("mouse:down", this.mouseDownHandler.bind(this));
    this.canvas.on("mouse:move", this.mouseMoveHandler.bind(this));
    this.canvas.on("mouse:up", this.endDrawing.bind(this));
    this.canvas.on("mouse:out", (options) => {
      if (!options.target) {
        // Mouse out of canvas
        this.endDrawing();
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
 * Draw plugin
 * @param canvas Canvas
 */
export const registerDraw = (canvas: Canvas): void => {
  new DrawPlugin(canvas).init();
};
