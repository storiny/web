import { BaseFabricObject, Canvas } from "fabric";

import { is_interactive_object } from "../../../../utils";

/**
 * Renders tooltips for a selected object
 */
class TooltipPlugin {
  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getSelectionContext();
  }

  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;
  /**
   * Canvas context
   * @private
   */
  private readonly ctx: CanvasRenderingContext2D;
  /**
   * Current active object
   * @private
   */
  private active_object: BaseFabricObject | undefined;
  /**
   * Vertical margin for the tooltip (px)
   * @private
   */
  private readonly vertical_margin = 10;
  /**
   * Tooltip font
   * @private
   */
  private readonly font = "500 10px var(--font-secondary)";
  /**
   * Tooltip background color
   * @private
   */
  private readonly background_color = "#505050";
  /**
   * Tooltip foreground color
   * @private
   */
  private readonly foreground_color = "#fafafa";
  /**
   * Tooltip inline padding (px)
   * @private
   */
  private readonly inline_padding = 10;

  /**
   * Renders the tooltip
   * @param text Tooltip text
   * @param x X value
   * @param y Y value
   * @private
   */
  private render_tooltip(text: string, x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = this.font;
    ctx.textBaseline = "top";
    ctx.fillStyle = this.background_color;

    const width = ctx.measureText(text).width;

    ctx.beginPath();
    ctx.roundRect(
      x - (width + this.inline_padding) / 2,
      y,
      width + this.inline_padding,
      17,
      2
    );
    ctx.fill();
    ctx.fillStyle = this.foreground_color;
    ctx.fillText(text, x - width / 2, y + 4);
    ctx.restore();
  }

  /**
   * Clears tooltip
   * @private
   */
  private clear_tooltip(): void {
    this.canvas.clearContext(this.ctx);
  }

  /**
   * Binds canvas events
   * @private
   */
  private bind_events(): void {
    this.canvas.on("before:render", () => {
      this.clear_tooltip();
    });

    this.canvas.on("selection:created", (event) => {
      const [object] = event.selected;
      this.active_object = object;
    });

    this.canvas.on("selection:updated", (options) => {
      const [object] = options.selected;
      this.active_object = object;
    });

    this.canvas.on("selection:cleared", () => {
      this.active_object = undefined;
    });

    this.canvas.on("after:render", () => {
      if (
        this.active_object &&
        is_interactive_object(this.active_object) &&
        !this.active_object.get("isMoving") &&
        !this.active_object.get("isDrawing")
      ) {
        const bounding_rect = this.active_object.getBoundingRect();
        const x = bounding_rect.left + bounding_rect.width / 2;
        const y =
          bounding_rect.top + bounding_rect.height + this.vertical_margin;
        const text = `${Math.round(
          this.active_object.width * this.active_object.scaleX
        )} ✕ ${Math.round(
          this.active_object.height * this.active_object.scaleY
        )}`;

        this.render_tooltip(text, x, y);
      }
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
 * Tooltip plugin
 * @param canvas Canvas
 */
export const register_tooltip = (canvas: Canvas): void => {
  new TooltipPlugin(canvas).init();
};
