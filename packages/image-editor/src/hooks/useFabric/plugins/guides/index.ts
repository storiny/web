import { Canvas, Point, TMat2D } from "fabric";

import { isGroup } from "../../../../utils";

type Coordinates<T extends "vertical" | "horizontal"> = {
  center?: boolean;
} & (T extends "vertical"
  ? { x: number; y1: number; y2: number }
  : { x1: number; x2: number; y: number });

const ALIGNING_LINE_OFFSET = 5;
const ALIGNING_LINE_MARGIN = 4;
const ALIGNING_LINE_SIZE = 1; // In px
const ALIGNING_CENTER_LINE_SIZE = 1.25; // In px
const ALIGNING_LINE_COLOR = "rgb(255,0,0)";
const ALIGNING_LINE_DASH = [3, 3];

/**
 * Returns `true` if value2 is within value1, while respecting the aligning
 * line margin
 * @param value1 Value
 * @param value2 Another value
 */
const isInRange = (value1: number, value2: number): boolean =>
  value2 > value1 - ALIGNING_LINE_MARGIN &&
  value2 < value1 + ALIGNING_LINE_MARGIN;

/**
 * Guides plugin
 * @param canvas Canvas
 */
export const registerGuidesPlugin = (canvas: Canvas): void => {
  let ctx = canvas.getSelectionContext();
  let viewportTransform: TMat2D;
  let zoom = 1;
  let verticalLines: Coordinates<"vertical">[] = [];
  let horizontalLines: Coordinates<"horizontal">[] = [];

  canvas.on("mouse:down", () => {
    viewportTransform = canvas.viewportTransform;
    zoom = canvas.getZoom();
  });

  canvas.on("object:scaling", (event) => {
    if (!canvas._currentTransform) {
      return;
    }

    let activeObject = event.target;

    if (isGroup(activeObject)) {
      return;
    }

    let activeObjectCenter = activeObject.getCenterPoint();
    let activeObjectBoundingRect = activeObject.getBoundingRect();
    let activeObjectHalfHeight =
      activeObjectBoundingRect.height / (2 * viewportTransform[3]);
    let activeObjectHalfWidth =
      activeObjectBoundingRect.width / (2 * viewportTransform[0]);

    canvas
      .getObjects()
      .filter(
        (object) =>
          object !== activeObject && object.visible && !object.get("locked")
      )
      .forEach((object) => {
        let objectCenter = object.getCenterPoint();
        let objectBoundingRect = object.getBoundingRect();
        let objectHalfHeight =
          objectBoundingRect.height / (2 * viewportTransform[3]);
        let objectHalfWidth =
          objectBoundingRect.width / (2 * viewportTransform[0]);

        /**
         * Snaps an object vertically
         * @param objEdge Object edge
         * @param activeObjEdge Active edge
         * @param snapCenter Snap center
         * @param center Center line flag
         */
        const snapVertical = (
          objEdge: number,
          activeObjEdge: number,
          snapCenter: number,
          center?: boolean
        ): void => {
          if (isInRange(objEdge, activeObjEdge)) {
            verticalLines.push({
              center,
              x: objEdge,
              y1:
                objectCenter.y < activeObjectCenter.y
                  ? objectCenter.y - objectHalfHeight - ALIGNING_LINE_OFFSET
                  : objectCenter.y + objectHalfHeight + ALIGNING_LINE_OFFSET,
              y2:
                activeObjectCenter.y > objectCenter.y
                  ? activeObjectCenter.y +
                    activeObjectHalfHeight +
                    ALIGNING_LINE_OFFSET
                  : activeObjectCenter.y -
                    activeObjectHalfHeight -
                    ALIGNING_LINE_OFFSET
            });

            activeObject.setPositionByOrigin(
              new Point(snapCenter, activeObjectCenter.y),
              "center",
              "center"
            );
          }
        };

        /**
         * Snaps an object horizontally
         * @param objEdge Object edge
         * @param activeObjEdge Active object edge
         * @param snapCenter Snap center
         * @param center Center line flag
         */
        const snapHorizontal = (
          objEdge: number,
          activeObjEdge: number,
          snapCenter: number,
          center?: boolean
        ): void => {
          if (isInRange(objEdge, activeObjEdge)) {
            horizontalLines.push({
              center,
              y: objEdge,
              x1:
                objectCenter.x < activeObjectCenter.x
                  ? objectCenter.x - objectHalfWidth - ALIGNING_LINE_OFFSET
                  : objectCenter.x + objectHalfWidth + ALIGNING_LINE_OFFSET,
              x2:
                activeObjectCenter.x > objectCenter.x
                  ? activeObjectCenter.x +
                    activeObjectHalfWidth +
                    ALIGNING_LINE_OFFSET
                  : activeObjectCenter.x -
                    activeObjectHalfWidth -
                    ALIGNING_LINE_OFFSET
            });

            activeObject.setPositionByOrigin(
              new Point(activeObjectCenter.x, snapCenter),
              "center",
              "center"
            );
          }
        };

        // Snap by the horizontal center line
        snapVertical(
          objectCenter.x,
          activeObjectCenter.x,
          objectCenter.x,
          true
        );

        // Snap by the left object edge matching left active edge
        snapVertical(
          objectCenter.x - objectHalfWidth,
          activeObjectCenter.x - activeObjectHalfWidth,
          objectCenter.x - objectHalfWidth + activeObjectHalfWidth
        );

        // Snap by the left object edge matching right active edge
        snapVertical(
          objectCenter.x - objectHalfWidth,
          activeObjectCenter.x + activeObjectHalfWidth,
          objectCenter.x - objectHalfWidth - activeObjectHalfWidth
        );

        // Snap by the right object edge matching right active edge
        snapVertical(
          objectCenter.x + objectHalfWidth,
          activeObjectCenter.x + activeObjectHalfWidth,
          objectCenter.x + objectHalfWidth - activeObjectHalfWidth
        );

        // Snap by the right object edge matching left active edge
        snapVertical(
          objectCenter.x + objectHalfWidth,
          activeObjectCenter.x - activeObjectHalfWidth,
          objectCenter.x + objectHalfWidth + activeObjectHalfWidth
        );

        // Snap by the vertical center line
        snapHorizontal(
          objectCenter.y,
          activeObjectCenter.y,
          objectCenter.y,
          true
        );

        // Snap by the top object edge matching the top active edge
        snapHorizontal(
          objectCenter.y - objectHalfHeight,
          activeObjectCenter.y - activeObjectHalfHeight,
          objectCenter.y - objectHalfHeight + activeObjectHalfHeight
        );

        // Snap by the top object edge matching the bottom active edge
        snapHorizontal(
          objectCenter.y - objectHalfHeight,
          activeObjectCenter.y + activeObjectHalfHeight,
          objectCenter.y - objectHalfHeight - activeObjectHalfHeight
        );

        // Snap by the bottom object edge matching the bottom active edge
        snapHorizontal(
          objectCenter.y + objectHalfHeight,
          activeObjectCenter.y + activeObjectHalfHeight,
          objectCenter.y + objectHalfHeight - activeObjectHalfHeight
        );

        // Snap by the bottom object edge matching the top active edge
        snapHorizontal(
          objectCenter.y + objectHalfHeight,
          activeObjectCenter.y - activeObjectHalfHeight,
          objectCenter.y + objectHalfHeight + activeObjectHalfHeight
        );
      });
  });

  canvas.on("before:render", () => {
    canvas.clearContext(canvas.contextTop);
  });

  canvas.on("after:render", () => {
    verticalLines.forEach((line) => drawVerticalLine(line));
    horizontalLines.forEach((line) => drawHorizontalLine(line));

    verticalLines = [];
    horizontalLines = [];
  });

  canvas.on("mouse:up", () => {
    canvas.renderAll();
  });

  const drawVerticalLine = (coords: Coordinates<"vertical">): void => {
    drawLine(
      coords.x + 0.5,
      coords.y1 > coords.y2 ? coords.y2 : coords.y1,
      coords.x + 0.5,
      coords.y2 > coords.y1 ? coords.y2 : coords.y1,
      coords.center
    );
  };

  const drawHorizontalLine = (coords: Coordinates<"horizontal">): void => {
    drawLine(
      coords.x1 > coords.x2 ? coords.x2 : coords.x1,
      coords.y + 0.5,
      coords.x2 > coords.x1 ? coords.x2 : coords.x1,
      coords.y + 0.5,
      coords.center
    );
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    center?: boolean
  ): void => {
    ctx.save();

    ctx.lineWidth = center ? ALIGNING_CENTER_LINE_SIZE : ALIGNING_LINE_SIZE;
    ctx.strokeStyle = ALIGNING_LINE_COLOR;

    if (!center) {
      ctx.setLineDash(ALIGNING_LINE_DASH);
    }

    ctx.beginPath();
    ctx.moveTo(
      x1 * zoom + viewportTransform[4],
      y1 * zoom + viewportTransform[5]
    );
    ctx.lineTo(
      x2 * zoom + viewportTransform[4],
      y2 * zoom + viewportTransform[5]
    );
    ctx.stroke();

    ctx.restore();
  };
};
