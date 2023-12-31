import { get_shortcut_slug } from "@storiny/shared/src/utils/get-shortcut-slug";
import { ActiveSelection, Canvas, FabricObject } from "fabric";
import hotkeys from "hotkeys-js";

import { CLONE_PROPS } from "../../../../lib";
import {
  is_active_selection,
  is_linear_object,
  recover_object
} from "../../../../utils";

const CLONED_OBJECT_OFFSET = 15; // (px)

/**
 * Handles keyboard events for cloning objects
 */
class ClonePlugin {
  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.cache = null;
    this.clone_count = 0;
  }
  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;
  /**
   * Cloning cache
   * @private
   */
  private cache: FabricObject | ActiveSelection | null;
  /**
   * The number of times a same object was cloned
   * @private
   */
  private clone_count: number;

  /**
   * Clones a single object
   * @param active_object Object to copy
   * @private
   */
  private clone_object(active_object: FabricObject): void {
    this.clone_count++;

    active_object.clone(CLONE_PROPS).then((cloned) => {
      recover_object(cloned, active_object);

      if (is_linear_object(cloned)) {
        cloned.set({
          x1: active_object.get("x1") + CLONED_OBJECT_OFFSET,
          x2: active_object.get("x2") + CLONED_OBJECT_OFFSET
        });
      } else {
        cloned.left += this.clone_count * CLONED_OBJECT_OFFSET;
        cloned.top += this.clone_count * CLONED_OBJECT_OFFSET;
      }

      this.canvas.add(cloned);
    });
  }

  /**
   * Clones selection or a single object
   * @param object Object to clone
   * @private
   */
  private clone(object?: NonNullable<typeof this.cache>): void {
    const active_object = object || this.canvas.getActiveObject();

    if (active_object) {
      if (is_active_selection(active_object)) {
        // TODO: Implement active selection cloning
        return;
      } else {
        this.clone_object(active_object);
      }
    }
  }

  /**
   * Removes the active object from the canvas
   * @private
   */
  private remove_active_object(): void {
    const active_object = this.cache;
    this.clone_count = 0;

    if (active_object) {
      this.canvas.remove(active_object);
    }
  }

  /**
   * Binds events
   * @private
   */
  private bind_events(): void {
    const copy_key = get_shortcut_slug({ ctrl: true, key: "c" });
    const paste_key = get_shortcut_slug({ ctrl: true, key: "v" });
    const cut_key = get_shortcut_slug({ ctrl: true, key: "x" });
    const duplicate_key = get_shortcut_slug({ ctrl: true, key: "d" });

    hotkeys(
      [copy_key, paste_key, cut_key, duplicate_key].join(","),
      (keyboard_event) => {
        switch (keyboard_event.key) {
          // Cut and copy
          case copy_key:
          case cut_key:
            this.cache = this.canvas.getActiveObject() || null;
            this.clone_count = 0;

            // Cut
            if (keyboard_event.key === cut_key) {
              this.remove_active_object();
            }

            break;
          // Paste
          case paste_key:
            if (this.cache) {
              this.clone(this.cache);
            }
            break;
          // Duplicate
          case duplicate_key:
            keyboard_event.preventDefault();
            this.clone();
            break;
          default:
            break;
        }
      }
    );
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.bind_events();
  }
}

/**
 * Clone plugin
 * @param canvas Canvas
 */
export const register_clone = (canvas: Canvas): void => {
  new ClonePlugin(canvas).init();
};
