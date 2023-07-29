import {
  Canvas,
  Control,
  controlsUtils,
  Object as FabricObject,
  Transform
} from "fabric";

import { CURSORS } from "../../../constants";
import { CLONE_PROPS } from "../common";

const DISABLED_CONTROLS = ["ml", "mt", "mr", "mb"];
const CLONE_CONTROL_SIZE = 14;

/**
 * Clones an object
 * @param direction Control position
 * @param transform Transform
 */
const cloneObject = (
  direction: "left" | "right",
  transform: Transform
): void => {
  const target = transform.target;
  const canvas = target.canvas;

  if (canvas) {
    target.clone(CLONE_PROPS).then((cloned) => {
      if (direction === "left") {
        cloned.left -= cloned.width + 24;
      } else {
        cloned.left += cloned.width + 24;
      }

      canvas.add(cloned);
    });
  }
};

/**
 * Handles object controls
 */
class ObjectControls {
  /**
   * Base object
   * @private
   */
  private readonly object: FabricObject;
  /**
   * Canvas
   * @private
   */
  private canvas: Canvas | undefined;

  /**
   * Ctor
   * @param object Base object
   */
  constructor(object: FabricObject) {
    this.object = object;
    this.canvas = object.canvas;
  }

  /**
   * Register draw controls
   * @private
   */
  private registerDrawControls(): void {
    this.object.drawControls = (ctx): void => {
      // Assign canvas during drawing, as it is undefined
      // initially
      if (!this.canvas) {
        this.canvas = this.object.canvas;
        // Bind the rotation events
        this.registerRotateControls();
      }

      ctx.save();

      const retinaScaling = this.object.getCanvasRetinaScaling();
      ctx.setTransform(retinaScaling, 0, 0, retinaScaling, 0, 0);
      ctx.strokeStyle = ctx.fillStyle = this.object.cornerColor;

      if (!this.object.transparentCorners) {
        ctx.strokeStyle = this.object.cornerStrokeColor;
      }

      this.object._setLineDash(ctx, this.object.cornerDashArray);
      this.object.setCoords();

      this.object.forEachControl((control, key) => {
        if (DISABLED_CONTROLS.includes(key)) {
          control.visible = false;
        }

        control.cursorStyleHandler = (eventData, control): string => {
          switch (control.actionName) {
            case "rotate":
              return control.cursorStyle;
            case "clone":
              return CURSORS.copy;
            default: {
              const cursor = controlsUtils.scaleCursorStyleHandler(
                eventData,
                control,
                this.object
              );

              return (CURSORS as any)[cursor] || cursor;
            }
          }
        };

        if (control.getVisibility(this.object, key)) {
          const p = this.object.oCoords[key];

          if (control.actionName === "clone") {
            ctx.save();
            ctx.fillStyle = this.object.cornerColor || "";
            ctx.strokeStyle = this.object.cornerStrokeColor || "";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, CLONE_CONTROL_SIZE / 2, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          } else {
            control.render(
              ctx,
              p.x,
              p.y,
              {
                cornerStrokeColor: this.object.cornerStrokeColor,
                cornerDashArray: this.object.cornerDashArray,
                cornerColor: this.object.cornerColor
              },
              this.object
            );
          }
        }
      });

      ctx.restore();
    };
  }

  /**
   * Registers controls for cloning objects
   * @private
   */
  private registerCloneControls(): void {
    this.object.controls.cl = new Control({
      x: -0.5,
      y: 0,
      offsetX: -24,
      cursorStyle: "pointer",
      mouseUpHandler: (_, transform): void => cloneObject("left", transform),
      actionName: "clone"
    });

    this.object.controls.cr = new Control({
      x: 0.5,
      y: 0,
      offsetX: 24,
      cursorStyle: "pointer",
      mouseUpHandler: (_, transform): void => cloneObject("right", transform),
      actionName: "clone"
    });
  }

  /**
   * Registers controls for rotating objects
   * @private
   */
  private registerRotateControls(): void {
    // Upper left
    this.object.controls.r_ul = new Control({
      x: -0.5,
      y: -0.5,
      offsetY: -10,
      offsetX: -10,
      angle: 20,
      actionName: "rotate",
      actionHandler: controlsUtils.rotationWithSnapping,
      render: () => ""
    });

    // Upper right
    this.object.controls.r_ur = new Control({
      x: 0.5,
      y: -0.5,
      offsetY: -10,
      offsetX: 10,
      angle: 20,
      actionName: "rotate",
      actionHandler: controlsUtils.rotationWithSnapping,
      render: () => ""
    });

    // Lower right
    this.object.controls.r_lr = new Control({
      x: 0.5,
      y: 0.5,
      offsetY: 10,
      offsetX: 10,
      angle: 20,
      actionName: "rotate",
      actionHandler: controlsUtils.rotationWithSnapping,
      render: () => ""
    });

    // Lower left
    this.object.controls.r_ll = new Control({
      x: -0.5,
      y: 0.5,
      offsetY: 10,
      offsetX: -10,
      angle: 20,
      actionName: "rotate",
      actionHandler: controlsUtils.rotationWithSnapping,
      render: () => ""
    });

    if (this.canvas) {
      this.canvas.on("after:render", () => {
        if (!this.canvas) {
          return;
        }

        const activeObject = this.canvas.getActiveObject();
        const angle = activeObject?.angle?.toFixed(2);

        if (angle !== undefined) {
          this.object.controls.r_ul.cursorStyle = CURSORS.rotate(Number(angle));
          this.object.controls.r_ur.cursorStyle = CURSORS.rotate(
            Number(angle) + 90
          );
          this.object.controls.r_lr.cursorStyle = CURSORS.rotate(
            Number(angle) + 180
          );
          this.object.controls.r_ll.cursorStyle = CURSORS.rotate(
            Number(angle) + 270
          );
        }
      });

      // Update rotate icon in real time
      this.canvas.on("object:rotating", (event) => {
        if (!this.canvas) {
          return;
        }

        const body = this.canvas.lowerCanvasEl.nextSibling as HTMLElement;
        const angle = this.canvas.getActiveObject()?.angle?.toFixed(2);

        if (angle === undefined) {
          return;
        }

        switch (event.transform?.corner) {
          case "r_ul":
            body.style.cursor = CURSORS.rotate(Number(angle));
            break;
          case "r_ur":
            body.style.cursor = CURSORS.rotate(Number(angle) + 90);
            break;
          case "r_lr":
            body.style.cursor = CURSORS.rotate(Number(angle) + 180);
            break;
          case "r_ll":
            body.style.cursor = CURSORS.rotate(Number(angle) + 270);
            break;
          default:
            break;
        }
      });
    }
  }

  /**
   * Binds events
   * @private
   */
  private bindEvents(): void {
    delete this.object.controls.mtr; // Remove default rotation control
    this.registerDrawControls();
    this.registerCloneControls();
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
 * @param object Base object
 */
export const registerControls = (object: FabricObject): void => {
  new ObjectControls(object).init();
};
