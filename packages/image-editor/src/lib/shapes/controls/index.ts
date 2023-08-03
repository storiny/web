import {
  Canvas,
  Control,
  controlsUtils,
  Object as FabricObject,
  Point,
  Transform
} from "fabric";

import { CURSORS } from "../../../constants";
import { isArrowObject, isLinearObject } from "../../../utils";
import { CLONE_PROPS } from "../common";

const DISABLED_CONTROLS = ["ml", "mt", "mr", "mb"];
const ALLOWED_LINEAR_CONTROLS = [
  // Move
  "linear_1",
  "linear_2",
  // Clone
  "cl",
  "cr"
];
const CLONE_CONTROL_SIZE = 14;
const MOVE_CONTROL_SIZE = 16;

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
      if (isLinearObject(cloned)) {
        cloned.set({
          x1: target.get("x1") + (direction === "left" ? -24 : 24),
          x2: target.get("x2") + (direction === "left" ? -24 : 24),
          y1: target.get("y1"),
          y2: target.get("y2"),
          width: target.width,
          height: target.height,
          scaleX: 1,
          scaleY: 1
        });

        // Set arrowheads
        if (isArrowObject(cloned)) {
          cloned.set({
            startArrowhead: target.get("startArrowhead"),
            endArrowhead: target.get("endArrowhead")
          });
        }
      } else {
        if (direction === "left") {
          cloned.left -= cloned.width + 24;
        } else {
          cloned.left += cloned.width + 24;
        }

        cloned.set({
          width: target.width,
          height: target.height,
          scaleX: 1,
          scaleY: 1
        });
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

      if (this.object.get("isDrawing")) {
        return;
      }

      ctx.save();

      const retinaScaling = this.object.getCanvasRetinaScaling();
      ctx.setTransform(retinaScaling, 0, 0, retinaScaling, 0, 0);
      ctx.strokeStyle = this.object.cornerColor;
      ctx.fillStyle = this.object.cornerColor;

      if (!this.object.transparentCorners) {
        ctx.strokeStyle = this.object.cornerStrokeColor;
      }

      this.object._setLineDash(ctx, this.object.cornerDashArray);
      this.object.setCoords();

      this.object.forEachControl((control, key) => {
        if (
          DISABLED_CONTROLS.includes(key) ||
          (isLinearObject(this.object) &&
            !ALLOWED_LINEAR_CONTROLS.includes(key))
        ) {
          control.visible = false;
        }

        control.cursorStyleHandler = (eventData, control): string => {
          switch (control.actionName) {
            case "linear-move":
              return CURSORS.move;
            case "clone":
              return CURSORS.copy;
            case "rotate":
              return control.cursorStyle;
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

          if (control.actionName === "linear-move") {
            const boundingRect = this.object.getBoundingRect();
            const flippedX1 = this.object.get("x1") > this.object.left;
            const flippedY1 = this.object.get("y1") > this.object.top;
            const flippedX2 = this.object.get("x2") > this.object.left;
            const flippedY2 = this.object.get("y2") > this.object.top;

            const x =
              key === "linear_1"
                ? flippedX1
                  ? boundingRect.left + boundingRect.width
                  : boundingRect.left
                : flippedX2
                ? boundingRect.left + boundingRect.width
                : boundingRect.left;
            const y =
              key === "linear_1"
                ? flippedY1
                  ? boundingRect.top + boundingRect.height
                  : boundingRect.top
                : flippedY2
                ? boundingRect.top + boundingRect.height
                : boundingRect.top;

            control.positionHandler = (): Point =>
              new Point(x, y - MOVE_CONTROL_SIZE / 2);
            this.object.setCoords();

            ctx.fillStyle = this.object.cornerColor || "";
            ctx.strokeStyle = this.object.cornerStrokeColor || "";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, MOVE_CONTROL_SIZE / 2, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.stroke();
          } else if (control.actionName === "clone") {
            const boundingRect = this.object.getBoundingRect();
            const margin = 24; // px
            const x =
              key === "cl"
                ? boundingRect.left - margin // Clone left
                : boundingRect.left + boundingRect.width + margin; // Clone right
            const y = boundingRect.top + boundingRect.height / 2;

            control.positionHandler = (): Point =>
              new Point(x, y - CLONE_CONTROL_SIZE / 2);
            this.object.setCoords();

            ctx.fillStyle = this.object.cornerColor || "";
            ctx.strokeStyle = this.object.cornerStrokeColor || "";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, CLONE_CONTROL_SIZE / 2, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.stroke();
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
      actionName: "clone",
      sizeX: CLONE_CONTROL_SIZE,
      sizeY: CLONE_CONTROL_SIZE,
      mouseUpHandler: (_, transform): void => cloneObject("left", transform)
    });

    this.object.controls.cr = new Control({
      actionName: "clone",
      sizeX: CLONE_CONTROL_SIZE,
      sizeY: CLONE_CONTROL_SIZE,
      mouseUpHandler: (_, transform): void => cloneObject("right", transform)
    });
  }

  /**
   * Registers controls for linear objects
   * @private
   */
  private registerLinearControls(): void {
    this.object.controls.linear_1 = new Control({
      actionName: "linear-move",
      sizeX: MOVE_CONTROL_SIZE,
      sizeY: MOVE_CONTROL_SIZE,
      actionHandler: (
        _: Event,
        transformData: Transform,
        x: number,
        y: number
      ): boolean => {
        const object = transformData.target;

        if (object) {
          object.set({
            x1: x,
            y1: y
          });

          this.canvas?.fire("linear:moving" as any, { target: object });
          this.canvas?.fire("object:modified" as any, { target: object });

          return true;
        }

        return false;
      }
    });

    this.object.controls.linear_2 = new Control({
      actionName: "linear-move",
      sizeX: MOVE_CONTROL_SIZE,
      sizeY: MOVE_CONTROL_SIZE,
      actionHandler: (
        _: Event,
        transformData: Transform,
        x: number,
        y: number
      ): boolean => {
        const object = transformData.target;

        if (object) {
          object.set({
            x2: x,
            y2: y
          });

          this.canvas?.fire("linear:moving" as any, { target: object });
          this.canvas?.fire("object:modified" as any, { target: object });

          return true;
        }

        return false;
      }
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

    if (isLinearObject(this.object)) {
      this.registerLinearControls();
    }
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
