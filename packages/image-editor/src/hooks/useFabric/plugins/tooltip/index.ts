import { BaseFabricObject, Canvas } from "fabric";

import { isInteractiveObject } from "../../../../utils";

/**
 * Renders tooltips for a selected object
 */
class ObjectTooltip {
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
  private activeObject: BaseFabricObject | undefined;
  /**
   * Vertical margin for the tooltip (px)
   * @private
   */
  private readonly verticalMargin = 10;
  /**
   * Tooltip font
   * @private
   */
  private readonly font = "500 10px var(--font-secondary)";
  /**
   * Tooltip background color
   * @private
   */
  private readonly backgroundColor = "#505050";
  /**
   * Tooltip foreground color
   * @private
   */
  private readonly foregroundColor = "#fafafa";
  /**
   * Tooltip inline padding (px)
   * @private
   */
  private readonly inlinePadding = 10;

  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getSelectionContext();
  }

  /**
   * Renders the tooltip
   * @param text Tooltip text
   * @param x X value
   * @param y Y value
   * @private
   */
  private renderTooltip(text: string, x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();

    ctx.font = this.font;
    ctx.textBaseline = "top";
    ctx.fillStyle = this.backgroundColor;

    const width = ctx.measureText(text).width;

    ctx.beginPath();
    ctx.roundRect(
      x - (width + this.inlinePadding) / 2,
      y,
      width + this.inlinePadding,
      17,
      2
    );
    ctx.fill();

    ctx.fillStyle = this.foregroundColor;
    ctx.fillText(text, x - width / 2, y + 4);

    ctx.restore();
  }

  /**
   * Clears tooltip
   * @private
   */
  private clearTooltip(): void {
    this.canvas.clearContext(this.ctx);
  }

  /**
   * Binds canvas events
   * @private
   */
  private bindEvents(): void {
    this.canvas.on("before:render", () => {
      this.clearTooltip();
    });

    this.canvas.on("selection:created", (event) => {
      const [object] = event.selected;
      this.activeObject = object;
    });

    this.canvas.on("selection:updated", (options) => {
      const [object] = options.selected;
      this.activeObject = object;
    });

    this.canvas.on("selection:cleared", () => {
      this.activeObject = undefined;
    });

    this.canvas.on("after:render", () => {
      if (
        this.activeObject &&
        isInteractiveObject(this.activeObject) &&
        !this.activeObject.get("isMoving")
      ) {
        const boundingRect = this.activeObject.getBoundingRect();
        const x = boundingRect.left + boundingRect.width / 2;
        const y = boundingRect.top + boundingRect.height + this.verticalMargin;
        const text = `${Math.round(this.activeObject.width)} ✕ ${Math.round(
          this.activeObject.height
        )}`;

        this.renderTooltip(text, x, y);
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
 * Tooltip plugin
 * @param canvas Canvas
 */
export const registerTooltip = (canvas: Canvas): void => {
  new ObjectTooltip(canvas).init();
};
