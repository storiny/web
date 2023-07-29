import { ActiveSelection, BaseFabricObject, Canvas } from "fabric";
import hotkeys from "hotkeys-js";

import { isActiveSelection } from "../../../../utils";

const CLONED_OBJECT_OFFSET = 15; // px

/**
 * Handles keyboard events for cloning objects
 */
class ClonePlugin {
  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;
  /**
   * Cloning cache
   * @private
   */
  private cache: BaseFabricObject | ActiveSelection | null;
  /**
   * The number of times a same object was cloned
   * @private
   */
  private cloneCount: number;

  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.cache = null;
    this.cloneCount = 0;
  }

  /**
   * Clones a single object
   * @param activeObject Object to copy
   * @private
   */
  private cloneObject(activeObject: BaseFabricObject): void {
    this.cloneCount++;

    activeObject.clone().then((cloned) => {
      if (cloned.left === undefined || cloned.top === undefined) {
        return;
      }

      this.canvas.discardActiveObject();

      cloned.left += this.cloneCount * CLONED_OBJECT_OFFSET;
      cloned.top += this.cloneCount * CLONED_OBJECT_OFFSET;

      this.canvas.add(cloned);
      this.canvas.setActiveObject(cloned as any);
      this.canvas.requestRenderAll();
    });
  }

  /**
   * Clones selection or a single object
   * @param object Object to clone
   * @private
   */
  private clone(object: NonNullable<typeof this.cache>): void {
    const activeObject = object || this.canvas.getActiveObject();

    if (activeObject) {
      if (isActiveSelection(activeObject)) {
        // TODO: Implement active selection cloning
        return;
      } else {
        this.cloneObject(activeObject);
      }
    }
  }

  /**
   * Removes the active object from the canvas
   * @private
   */
  private removeActiveObject(): void {
    const activeObject = this.cache;
    this.cloneCount = 0;

    if (activeObject) {
      this.canvas.remove(activeObject);
    }
  }

  /**
   * Binds events
   * @private
   */
  private bindEvents(): void {
    hotkeys("ctrl+c,ctrl+v,ctrl+x", (keyboardEvent, hotkeysEvent) => {
      if (hotkeysEvent.key === "ctrl+c" || hotkeysEvent.key === "ctrl+x") {
        this.cache = this.canvas.getActiveObject() || null;
        this.cloneCount = 0;

        // Cut
        if (hotkeysEvent.key === "ctrl+x") {
          this.removeActiveObject();
        }
      } else if (hotkeysEvent.key === "ctrl+v") {
        if (this.cache) {
          this.clone(this.cache);
        }
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
 * Clone plugin
 * @param canvas Canvas
 */
export const registerClone = (canvas: Canvas): void => {
  new ClonePlugin(canvas).init();
};
