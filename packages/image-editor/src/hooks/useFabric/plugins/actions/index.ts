import { BaseFabricObject, Canvas } from "fabric";
import React from "react";

import { isInteractiveObject } from "../../../../utils";

const POPOVER_ID = "object-popover";

/**
 * Renders the actions popver for a selected object
 */
class ActionsPlugin {
  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;
  /**
   * Current active object
   * @private
   */
  private activeObject: BaseFabricObject | undefined;
  /**
   * Vertical margin for the popover (px)
   * @private
   */
  private readonly verticalMargin = 14;
  /**
   * Popover element
   * @private
   */
  private readonly popover: HTMLElement;
  /**
   * Popover size
   * @private
   */
  private popoverSize = { width: 1, height: 1 };

  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.popover = document.createElement("div");
  }

  /**
   * Constructs the popover element
   * @private
   */
  private initializePopover(): void {
    this.popover.id = POPOVER_ID;
    this.popover.ariaHidden = "true";
    this.popover.classList.add("force-dark-mode");
    this.popover.style.cssText = Object.entries({
      position: "absolute",
      left: 0,
      top: 0,
      zIndex: 10,
      width: "fit-content",
      height: "fit-content"
    } as React.CSSProperties)
      .map(([prop, value]) => `${prop}:${value}`)
      .join(";");

    this.canvas.getElement().parentElement?.appendChild(this.popover);
    this.observeResize();
  }

  /**
   * Observes the popover size
   * @private
   */
  private observeResize(): void {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const width = entries[0].contentRect.width || 1;
        const height = entries[0].contentRect.height || 1;
        this.popoverSize = { width, height };
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
  private renderPopover(x: number, y: number): void {
    const left = `${x - this.popoverSize.width / 2}px`;
    const top = `${y - this.popoverSize.height}px`;

    this.popover.style.transform = `translate3d(${left}, ${top}, 0px)`;
    this.popover.style.visibility = "visible";
  }

  /**
   * Hides the popover
   * @private
   */
  private hidePopover(): void {
    this.popover.style.visibility = "hidden";
  }

  /**
   * Binds canvas events
   * @private
   */
  private bindEvents(): void {
    this.canvas.on("before:render", () => {
      this.hidePopover();
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
        const y = boundingRect.top - this.verticalMargin;

        this.renderPopover(x, y);
      }
    });
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.initializePopover();
    this.bindEvents();
  }
}

/**
 * Actions plugin
 * @param canvas Canvas
 */
export const registerActions = (canvas: Canvas): void => {
  new ActionsPlugin(canvas).init();
};
