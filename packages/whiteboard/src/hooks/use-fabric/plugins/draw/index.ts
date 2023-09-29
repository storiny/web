import { BaseFabricObject, Canvas, TPointerEventInfo } from "fabric";

import { CURSORS, DrawableLayerType, LayerType } from "../../../../constants";
import { Arrow, Diamond, Ellipse, Line, Rect } from "../../../../lib";
import { is_linear_object } from "../../../../utils";

type DrawEvent = "draw:start" | "draw:end" | "draw:scaling";
type LinearShape = typeof Arrow | typeof Line;
type SolidShape = typeof Diamond | typeof Ellipse | typeof Rect;
type Shape = LinearShape | SolidShape;

const LAYER_TYPE_SHAPE_MAP: {
  [k in DrawableLayerType]: Shape;
} = {
  [LayerType.ARROW /*    */]: Arrow,
  [LayerType.DIAMOND /*  */]: Diamond,
  [LayerType.ELLIPSE /*  */]: Ellipse,
  [LayerType.LINE /*     */]: Line,
  [LayerType.RECTANGLE /**/]: Rect
};

/**
 * Handles drawing objects using mouse
 */
export class DrawPlugin {
  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.started = false;
    this.enabled = false;
    this.object = null;
    this.layer_type = null;
    this.x = 0;
    this.y = 0;
  }

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
  private layer_type: DrawableLayerType | null;
  /**
   * Draw complete callback
   * @private
   */
  private on_draw_complete: undefined | (() => void);
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
      this.set_crosshair_cursor();
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
    } else if (!this.canvas.pan_manager?.get_enabled()) {
      this.set_default_cursor();
    }
  }

  /**
   * Mutates the layer type of the plugin
   * @param layer_type Type of the shape
   */
  public set_layer_type(layer_type: DrawableLayerType): void {
    this.layer_type = layer_type;
  }

  /**
   * Mutates the draw complete callback of the plugin
   * @param callback
   */
  public set_draw_complete(callback?: () => void): void {
    this.on_draw_complete = callback;
  }

  /**
   * Handles draw start event
   * @private
   */
  private start_drawing(): void {
    this.canvas.selection = false;
    this.started = true;
    this.set_crosshair_cursor();
    this.fire_event("draw:start");
  }

  /**
   * Handlers draw end event
   * @private
   */
  private end_drawing(): void {
    if (!this.started) {
      return;
    }

    this.canvas.selection = true;
    this.started = false;
    this.enabled = false;
    this.x = 0;
    this.y = 0;
    this.set_default_cursor();

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
      this.fire_event("draw:end");
      this.object = null;
    }

    if (this.on_draw_complete) {
      this.on_draw_complete();
    }
  }

  /**
   * Fires draw events in the canvas
   * @param event_name Event name
   * @private
   */
  private fire_event(event_name: DrawEvent): void {
    this.canvas.fire(event_name as any, { target: this.object } as any);
  }

  /**
   * Sets crosshair cursor
   * @private
   */
  private set_crosshair_cursor(): void {
    this.canvas.defaultCursor = CURSORS.crosshair;
    this.canvas.hoverCursor = CURSORS.crosshair;
    this.canvas.setCursor(CURSORS.crosshair);
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
    this.canvas.draw_manager = this;
  }

  /**
   * Mouse down handler
   * @param options Options
   * @private
   */
  private mouse_down_handler(options: TPointerEventInfo): void {
    if (!this.enabled || !this.layer_type) {
      return;
    }

    if (this.started) {
      this.end_drawing();
      return;
    }

    this.start_drawing();

    const mouse = this.canvas.getPointer(options.e);
    this.x = mouse.x;
    this.y = mouse.y;

    if ([LayerType.LINE, LayerType.ARROW].includes(this.layer_type)) {
      const Class = LAYER_TYPE_SHAPE_MAP[this.layer_type] as LinearShape;

      this.object = new Class({
        x1: this.x,
        y1: this.y,
        x2: this.x + 1,
        y2: this.y + 1,
        hasBorders: false,
        isDrawing: true
      });
    } else {
      const Class = LAYER_TYPE_SHAPE_MAP[this.layer_type] as SolidShape;

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
  private mouse_move_handler(options: TPointerEventInfo): void {
    if (!this.enabled || !this.started || !this.object) {
      return;
    }

    const mouse = this.canvas.getPointer(options.e);

    if (is_linear_object(this.object)) {
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

    this.fire_event("draw:scaling");
    this.canvas.requestRenderAll();
  }

  /**
   * Binds events
   * @private
   */
  private bind_events(): void {
    this.canvas.on("mouse:down", this.mouse_down_handler.bind(this));
    this.canvas.on("mouse:move", this.mouse_move_handler.bind(this));
    this.canvas.on("mouse:up", this.end_drawing.bind(this));
    this.canvas.on("mouse:out", (options) => {
      if (!options.target) {
        // Mouse out of canvas
        this.end_drawing();
      }
    });
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
 * Draw plugin
 * @param canvas Canvas
 */
export const register_draw = (canvas: Canvas): void => {
  new DrawPlugin(canvas).init();
};
