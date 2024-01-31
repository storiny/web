import {
  Canvas,
  Control,
  controlsUtils as control_utils,
  FabricObject,
  Point,
  Transform,
  util
} from "fabric";

import { CURSORS } from "../../../constants";
import {
  compute_object_bounding_rect,
  is_linear_object,
  is_text_object,
  recover_object
} from "../../../utils";
import { CLONE_PROPS } from "../common";

const DISABLED_CONTROLS = ["ml", "mr", "mt", "mb"];
const ROTATION_CONTROLS = ["r_ul", "r_ur", "r_ll", "r_lr"];
const ALLOWED_LINEAR_CONTROLS = [
  // Move
  "linear_1",
  "linear_2",
  // Clone
  "cl",
  "cr"
];
const ALLOWED_TEXT_CONTROLS = [
  "cl",
  "cr",
  "tl",
  "tr",
  "br",
  "bl",
  "mr",
  "ml",
  ...ROTATION_CONTROLS
];
const CLONE_CONTROL_SIZE = 14;
const MOVE_CONTROL_SIZE = 16;

/**
 * Clones an object
 * @param direction Control position
 * @param transform Transform
 */
const clone_object = (
  direction: "left" | "right",
  transform: Transform
): void => {
  const target = transform.target;
  const canvas = target.canvas;

  if (canvas) {
    target.clone(CLONE_PROPS).then((cloned) => {
      recover_object(cloned, target);

      if (is_linear_object(cloned)) {
        cloned.set({
          x1: target.get("x1") + (direction === "left" ? -24 : 24),
          x2: target.get("x2") + (direction === "left" ? -24 : 24)
        });
      } else {
        if (direction === "left") {
          cloned.left -= cloned.width * cloned.scaleX + 24;
        } else {
          cloned.left += cloned.width * cloned.scaleX + 24;
        }
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
   * Ctor
   * @param object Base object
   */
  constructor(object: FabricObject) {
    this.object = object;
    this.canvas = object.canvas;
  }

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
   * Register draw controls
   * @private
   */
  private register_draw_controls(): void {
    this.object.drawControls = (ctx): void => {
      // Assign canvas during drawing, as it is `undefined` initially
      if (!this.canvas) {
        this.canvas = this.object.canvas;
        // Bind the rotation events
        this.register_rotate_controls();
      }

      if (this.object.get("isDrawing")) {
        return;
      }

      ctx.save();

      const retina_scaling = this.object.getCanvasRetinaScaling();
      ctx.setTransform(retina_scaling, 0, 0, retina_scaling, 0, 0);
      ctx.strokeStyle = this.object.cornerColor;
      ctx.fillStyle = this.object.cornerColor;

      if (!this.object.transparentCorners) {
        ctx.strokeStyle = this.object.cornerStrokeColor;
      }

      this.object._setLineDash(ctx, this.object.cornerDashArray);
      this.object.setCoords();

      this.object.forEachControl((control, key) => {
        if (
          (DISABLED_CONTROLS.includes(key) && !is_text_object(this.object)) ||
          (is_linear_object(this.object) &&
            !ALLOWED_LINEAR_CONTROLS.includes(key)) ||
          (is_text_object(this.object) && !ALLOWED_TEXT_CONTROLS.includes(key))
        ) {
          control.visible = false;
        }

        control.cursorStyleHandler = (event_data, control): string => {
          switch (control.actionName) {
            case "linear-move":
              return CURSORS.move;
            case "clone":
              return CURSORS.copy;
            case "rotate":
              return control.cursorStyle;
            default: {
              const cursor = control_utils.scaleCursorStyleHandler(
                event_data,
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
            const bounding_rect = compute_object_bounding_rect(this.object);
            const flipped_x1 = this.object.get("x1") > this.object.left;
            const flipped_y1 = this.object.get("y1") > this.object.top;
            const flipped_x2 = this.object.get("x2") > this.object.left;
            const flipped_y2 = this.object.get("y2") > this.object.top;

            const x =
              key === "linear_1"
                ? flipped_x1
                  ? bounding_rect.left + bounding_rect.width
                  : bounding_rect.left
                : flipped_x2
                  ? bounding_rect.left + bounding_rect.width
                  : bounding_rect.left;
            const y =
              key === "linear_1"
                ? flipped_y1
                  ? bounding_rect.top + bounding_rect.height
                  : bounding_rect.top
                : flipped_y2
                  ? bounding_rect.top + bounding_rect.height
                  : bounding_rect.top;

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
            const bounding_rect = compute_object_bounding_rect(this.object);
            const margin = 24; // (px)
            const x =
              key === "cl"
                ? bounding_rect.left - margin // Clone left
                : bounding_rect.left + bounding_rect.width + margin; // Clone right
            const y = bounding_rect.top + bounding_rect.height / 2;

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
            // Draw a rectangle for width controls.
            if (["ml", "mr"].includes(key)) {
              const x_size = 6;
              const y_size = 12;
              const angle = this.object.getTotalAngle();

              ctx.save();

              ctx.fillStyle = this.object.cornerColor;
              ctx.strokeStyle = this.object.cornerStrokeColor;
              ctx.lineWidth = 1;
              ctx.translate(p.x, p.y);
              ctx.rotate(util.degreesToRadians(angle));
              ctx.fillRect(-(x_size / 2), -(y_size / 2), x_size, y_size);
              ctx.strokeRect(-(x_size / 2), -(y_size / 2), x_size, y_size);

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
        }
      });

      ctx.restore();
    };
  }

  /**
   * Registers controls for cloning objects
   * @private
   */
  private register_clone_controls(): void {
    this.object.controls.cl = new Control({
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      actionName: "clone",
      sizeX: CLONE_CONTROL_SIZE,
      sizeY: CLONE_CONTROL_SIZE,
      mouseUpHandler: (_, transform): void => clone_object("left", transform)
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    });

    this.object.controls.cr = new Control({
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      actionName: "clone",
      sizeX: CLONE_CONTROL_SIZE,
      sizeY: CLONE_CONTROL_SIZE,
      mouseUpHandler: (_, transform): void => clone_object("right", transform)
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    });
  }

  /**
   * Registers controls for linear objects
   * @private
   */
  private register_linear_controls(): void {
    this.object.controls.linear_1 = new Control({
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      actionName: "linear-move",
      sizeX: MOVE_CONTROL_SIZE,
      sizeY: MOVE_CONTROL_SIZE,
      actionHandler: (
        /* eslint-enable prefer-snakecase/prefer-snakecase */
        _: Event,
        transform_data: Transform,
        x: number,
        y: number
      ): boolean => {
        const object = transform_data.target;

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
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      actionName: "linear-move",
      sizeX: MOVE_CONTROL_SIZE,
      sizeY: MOVE_CONTROL_SIZE,
      actionHandler: (
        /* eslint-enable prefer-snakecase/prefer-snakecase */
        _: Event,
        transform_data: Transform,
        x: number,
        y: number
      ): boolean => {
        const object = transform_data.target;

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
  private register_rotate_controls(): void {
    // Upper left
    this.object.controls.r_ul = new Control({
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      x: -0.5,
      y: -0.5,
      offsetY: -10,
      offsetX: -10,
      angle: 20,
      actionName: "rotate",
      actionHandler: control_utils.rotationWithSnapping,
      render: () => ""
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    });

    // Upper right
    this.object.controls.r_ur = new Control({
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      x: 0.5,
      y: -0.5,
      offsetY: -10,
      offsetX: 10,
      angle: 20,
      actionName: "rotate",
      actionHandler: control_utils.rotationWithSnapping,
      render: () => ""
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    });

    // Lower right
    this.object.controls.r_lr = new Control({
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      x: 0.5,
      y: 0.5,
      offsetY: 10,
      offsetX: 10,
      angle: 20,
      actionName: "rotate",
      actionHandler: control_utils.rotationWithSnapping,
      render: () => ""
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    });

    // Lower left
    this.object.controls.r_ll = new Control({
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      x: -0.5,
      y: 0.5,
      offsetY: 10,
      offsetX: -10,
      angle: 20,
      actionName: "rotate",
      actionHandler: control_utils.rotationWithSnapping,
      render: () => ""
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    });

    if (this.canvas) {
      this.canvas.on("after:render", () => {
        if (!this.canvas) {
          return;
        }

        const active_object = this.canvas.getActiveObject();
        const angle = active_object?.angle?.toFixed(2);

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
  private bind_events(): void {
    delete this.object.controls.mtr; // Remove default rotation control
    this.register_draw_controls();
    this.register_clone_controls();

    if (is_linear_object(this.object)) {
      this.register_linear_controls();
    }
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
 * @param object Base object
 */
export const register_controls = (object: FabricObject): void => {
  new ObjectControls(object).init();
};
