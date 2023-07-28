import {
  BaseFabricObject,
  Control,
  controlsUtils,
  Object as FabricObject,
  Rect,
  TProps,
  Transform
} from "fabric";

import { CURSORS } from "../../../constants";
import { CLONE_PROPS } from "../common";

const DISABLED_CONTROLS = ["ml", "mt", "mr", "mb"];
const CLONE_CONTROL_SIZE = 14;

type Constructor<T = FabricObject> = new (...args: any[]) => T;

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

export const WithPrimitive = <TBase extends Constructor>(Base: TBase): TBase =>
  class Primitive extends Base {
    constructor(...args: any[]) {
      super(...args);

      this.controls.cl = new Control({
        x: -0.5,
        y: 0,
        offsetX: -24,
        cursorStyle: "pointer",
        mouseUpHandler: (_, transform): void => cloneObject("left", transform),
        actionName: "clone"
      });

      this.controls.cr = new Control({
        x: 0.5,
        y: 0,
        offsetX: 24,
        cursorStyle: "pointer",
        mouseUpHandler: (_, transform): void => cloneObject("right", transform),
        actionName: "clone"
      });
    }

    /**
     * Draws controls
     * @param ctx Canvas context
     */
    drawControls(ctx: CanvasRenderingContext2D): void {
      ctx.save();

      const retinaScaling = this.getCanvasRetinaScaling();
      ctx.setTransform(retinaScaling, 0, 0, retinaScaling, 0, 0);
      ctx.strokeStyle = ctx.fillStyle = this.cornerColor;

      if (!this.transparentCorners) {
        ctx.strokeStyle = this.cornerStrokeColor;
      }

      this._setLineDash(ctx, this.cornerDashArray);
      this.setCoords();

      this.forEachControl((control, key) => {
        if (DISABLED_CONTROLS.includes(key)) {
          control.visible = false;
        }

        control.cursorStyleHandler = (eventData, control): string => {
          switch (control.actionName) {
            case "rotate":
              return CURSORS.crosshair;
            case "clone":
              return CURSORS.copy;
            default: {
              const cursor = controlsUtils.scaleCursorStyleHandler(
                eventData,
                control,
                this
              );

              return CURSORS[cursor] || cursor;
            }
          }
        };

        if (control.getVisibility(this, key)) {
          const p = this.oCoords[key];

          if (control.actionName === "clone") {
            ctx.save();
            ctx.fillStyle = this.cornerColor || "";
            ctx.strokeStyle = this.cornerStrokeColor || "";
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
                cornerStyle:
                  control.actionName === "rotate" ? "circle" : "rect",
                cornerStrokeColor: this.cornerStrokeColor,
                cornerDashArray: this.cornerDashArray,
                cornerColor: this.cornerColor
              },
              this
            );
          }
        }
      });

      ctx.restore();
    }
  };

export class RectPrimitive<
  Props extends TProps<BaseFabricObject>
> extends WithPrimitive(Rect)<Props> {}
