import { BaseFabricObject, Canvas } from "fabric";
import React from "react";

import { is_interactive_object } from "../../../../utils";

const POPOVER_ID = "object-popover";

/**
 * Renders the actions popver for a selected object
 */
class ActionsPlugin {
  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.popover = document.createElement("div");
  }

  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;
  /**
   * Current active object
   * @private
   */
  private active_object: BaseFabricObject | undefined;
  /**
   * Vertical margin for the popover (px)
   * @private
   */
  private readonly vertical_margin = 14;
  /**
   * Popover element
   * @private
   */
  private readonly popover: HTMLElement;
  /**
   * Popover size
   * @private
   */
  private popover_size = { width: 1, height: 1 };

  /**
   * Constructs the popover element
   * @private
   */
  private initialize_popover(): void {
    this.popover.id = POPOVER_ID;
    this.popover.ariaHidden = "true";
    this.popover.classList.add("force-dark-mode", "fit-w", "fit-h");
    this.popover.style.cssText = Object.entries({
      position: "absolute",
      left: 0,
      top: 0,
      zIndex: 10
    } as React.CSSProperties)
      .map(([prop, value]) => `${prop}:${value}`)
      .join(";");

    this.canvas.getElement().parentElement?.appendChild(this.popover);
    this.observe_resize();
  }

  /**
   * Observes the popover size
   * @private
   */
  private observe_resize(): void {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const width = entries[0].contentRect.width || 1;
        const height = entries[0].contentRect.height || 1;
        this.popover_size = { width, height };
      }
    });

    observer.observe(this.popover);
  }

  /**
   * Renders the popover
   * @param x X value
   * @param y Y value
   * @private
   */
  private render_popover(x: number, y: number): void {
    const left = `${x - this.popover_size.width / 2}px`;
    const top = `${y - this.popover_size.height}px`;

    this.popover.style.transform = `translate3d(${left}, ${top}, 0px)`;
    this.popover.style.visibility = "visible";
  }

  /**
   * Hides the popover
   * @private
   */
  private hide_popover(): void {
    this.popover.style.visibility = "hidden";
  }

  /**
   * Binds canvas events
   * @private
   */
  private bind_events(): void {
    this.canvas.on("before:render", () => {
      this.hide_popover();
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
        const y = bounding_rect.top - this.vertical_margin;

        this.render_popover(x, y);
      }
    });
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.initialize_popover();
    this.bind_events();
  }
}

/**
 * Actions plugin
 * @param canvas Canvas
 */
export const register_actions = (canvas: Canvas): void => {
  new ActionsPlugin(canvas).init();
};
