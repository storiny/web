import {
  BaseFabricObject,
  Canvas,
  Object as FabricObject,
  Point,
  util
} from "fabric";

import { isInteractiveObject } from "../../../../utils";

type LineCoords<T extends "vertical" | "horizontal"> = T extends "vertical"
  ? { x: number; y1: number; y2: number }
  : { x1: number; x2: number; y: number };

type ACoordsAppendCenter = NonNullable<BaseFabricObject["aCoords"]> & {
  c: Point;
};

/**
 * Renders align guidelines
 */
class GuidesPlugin {
  /**
   * Line margin (px)
   * @private
   */
  private readonly aligningLineMargin = 4;
  /**
   * Line width (px)
   * @private
   */
  private readonly aligningLineWidth = 0.75;
  /**
   * Line color
   * @private
   */
  private readonly aligningLineColor = "#ff0000";
  /**
   * Sign width (px)
   * @private
   */
  private readonly signWidth = 1;
  /**
   * Sign color
   * @private
   */
  private readonly signColor = this.aligningLineColor;
  /**
   * Sign size (px)
   * @private
   */
  private readonly signSize = 3;
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
   * Vertical guide lines
   * @private
   */
  private readonly verticalLines: LineCoords<"vertical">[] = [];
  /**
   * Horizontal guide lines
   * @private
   */
  private readonly horizontalLines: LineCoords<"horizontal">[] = [];
  /**
   * Current active object
   * @private
   */
  private activeObject: BaseFabricObject = new FabricObject();

  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getSelectionContext();
  }

  /**
   * Draws cross sign
   * @param x X value
   * @param y Y value
   * @private
   */
  private drawSign(x: number, y: number): void {
    const ctx = this.ctx;
    const size = this.signSize;

    ctx.lineWidth = this.signWidth;
    ctx.strokeStyle = this.signColor;
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.stroke();
  }

  /**
   * Draws guide line
   * @param x1 X1
   * @param y1 Y1
   * @param x2 X2
   * @param y2 Y2
   * @private
   */
  private drawLine(x1: number, y1: number, x2: number, y2: number): void {
    const ctx = this.ctx;
    const point1 = util.transformPoint(
      new Point(x1, y1),
      this.canvas.viewportTransform
    );
    const point2 = util.transformPoint(
      new Point(x2, y2),
      this.canvas.viewportTransform
    );

    ctx.save();
    ctx.lineWidth = this.aligningLineWidth;
    ctx.strokeStyle = this.aligningLineColor;
    ctx.beginPath();

    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);

    ctx.stroke();

    this.drawSign(point1.x, point1.y);
    this.drawSign(point2.x, point2.y);

    ctx.restore();
  }

  /**
   * Draws vertical guide line
   * @param coords Line coords
   * @private
   */
  private drawVerticalLine(coords: LineCoords<"vertical">): void {
    const movingCoords = this.getObjDraggingObjCoords(this.activeObject);

    if (
      !Object.keys(movingCoords).some(
        (key) =>
          Math.abs(
            movingCoords[key as keyof typeof movingCoords].x - coords.x
          ) < 0.0001
      )
    ) {
      return;
    }

    this.drawLine(
      coords.x,
      Math.min(coords.y1, coords.y2),
      coords.x,
      Math.max(coords.y1, coords.y2)
    );
  }

  /**
   * Draws horizontal guide line
   * @param coords Line coords
   * @private
   */
  private drawHorizontalLine(coords: LineCoords<"horizontal">): void {
    const movingCoords = this.getObjDraggingObjCoords(this.activeObject);

    if (
      !Object.keys(movingCoords).some(
        (key) =>
          Math.abs(
            movingCoords[key as keyof typeof movingCoords].y - coords.y
          ) < 0.0001
      )
    ) {
      return;
    }

    this.drawLine(
      Math.min(coords.x1, coords.x2),
      coords.y,
      Math.max(coords.x1, coords.x2),
      coords.y
    );
  }

  /**
   * Returns `true` if value2 is within value1, while respecting the aligning
   * line margin and zoom value
   * @param value1 Value
   * @param value2 Another value
   * @private
   */
  private isInRange(value1: number, value2: number): boolean {
    return (
      Math.abs(Math.round(value1) - Math.round(value2)) <=
      this.aligningLineMargin / this.canvas.getZoom()
    );
  }

  /**
   * Watches the mouse down event
   * @private
   */
  private watchMouseDown(): void {
    this.canvas.on("mouse:down", () => {
      this.clearLinesMeta();
    });
  }

  /**
   * Watches the mouse up event
   * @private
   */
  private watchMouseUp(): void {
    this.canvas.on("mouse:up", () => {
      this.clearLinesMeta();
      this.canvas.requestRenderAll();
    });
  }

  /**
   * Watches the mouse wheel event
   * @private
   */
  private watchMouseWheel(): void {
    this.canvas.on("mouse:wheel", () => {
      this.clearLinesMeta();
    });
  }

  /**
   * Clears guide lines cache
   * @private
   */
  private clearLinesMeta(): void {
    this.verticalLines.length = 0;
    this.horizontalLines.length = 0;
  }

  /**
   * Watches the object moving event
   * @private
   */
  private watchObjectMoving(): void {
    this.canvas.on("object:moving", (event) => {
      this.clearLinesMeta();
      const activeObject = event.target;
      this.activeObject = activeObject;

      const canvasObjects = this.canvas
        .getObjects()
        .filter(isInteractiveObject);
      const transform = this.canvas._currentTransform;

      if (!transform) {
        return;
      }

      this.traversAllObjects(activeObject, canvasObjects);
    });
  }

  /**
   * Returns dragging coords
   * @param activeObject Active object
   * @private
   */
  private getObjDraggingObjCoords(
    activeObject: BaseFabricObject
  ): ACoordsAppendCenter {
    const aCoords = activeObject.aCoords as NonNullable<
      BaseFabricObject["aCoords"]
    >;
    const centerPoint = new Point(
      (aCoords.tl.x + aCoords.br.x) / 2,
      (aCoords.tl.y + aCoords.br.y) / 2
    );
    const offsetX = centerPoint.x - activeObject.getCenterPoint().x;
    const offsetY = centerPoint.y - activeObject.getCenterPoint().y;

    return Object.keys(aCoords).reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          x: aCoords[key as keyof typeof aCoords].x - offsetX,
          y: aCoords[key as keyof typeof aCoords].y - offsetY
        }
      }),
      {
        c: activeObject.getCenterPoint()
      } as ACoordsAppendCenter
    );
  }

  /**
   * Omits coordinates. When the object is rotated, some coordinates need to be ignored, for example,
   * the horizontal auxiliary line only takes the uppermost and lower coordinates
   * @param objCoords Object coords
   * @param type Type
   * @private
   */
  private omitCoords(
    objCoords: ACoordsAppendCenter,
    type: "vertical" | "horizontal"
  ): ACoordsAppendCenter {
    let newCoords: ACoordsAppendCenter;
    type PointArr = [keyof ACoordsAppendCenter, Point];

    if (type === "vertical") {
      let l: PointArr = ["tl", objCoords.tl];
      let r: PointArr = ["tl", objCoords.tl];

      Object.keys(objCoords).forEach((key) => {
        if (objCoords[key as keyof typeof objCoords].x < l[1].x) {
          l = [
            key as keyof typeof objCoords,
            objCoords[key as keyof typeof objCoords]
          ];
        }

        if (objCoords[key as keyof typeof objCoords].x > r[1].x) {
          r = [
            key as keyof typeof objCoords,
            objCoords[key as keyof typeof objCoords]
          ];
        }
      });

      newCoords = {
        [l[0]]: l[1],
        [r[0]]: r[1],
        c: objCoords.c
      } as ACoordsAppendCenter;
    } else {
      let t: PointArr = ["tl", objCoords.tl];
      let b: PointArr = ["tl", objCoords.tl];

      Object.keys(objCoords).forEach((key) => {
        if (objCoords[key as keyof typeof objCoords].y < t[1].y) {
          t = [
            key as keyof typeof objCoords,
            objCoords[key as keyof typeof objCoords]
          ];
        }

        if (objCoords[key as keyof typeof objCoords].y > b[1].y) {
          b = [
            key as keyof typeof objCoords,
            objCoords[key as keyof typeof objCoords]
          ];
        }
      });

      newCoords = {
        [t[0]]: t[1],
        [b[0]]: b[1],
        c: objCoords.c
      } as ACoordsAppendCenter;
    }

    return newCoords;
  }

  /**
   * Returns object max width and height using coords
   * @param coords Coords
   * @private
   */
  private getObjMaxWidthHeightByCoords(coords: ACoordsAppendCenter): {
    objHeight: number;
    objWidth: number;
  } {
    const objHeight =
      Math.max(
        Math.abs(coords.c.y - coords["tl"].y),
        Math.abs(coords.c.y - coords["tr"].y)
      ) * 2;
    const objWidth =
      Math.max(
        Math.abs(coords.c.x - coords["tl"].x),
        Math.abs(coords.c.x - coords["tr"].x)
      ) * 2;

    return { objHeight, objWidth };
  }

  /**
   * Returns the real center point of the object
   * @param coords Coords
   * @private
   */
  private calcCenterPointByACoords(
    coords: NonNullable<BaseFabricObject["aCoords"]>
  ): Point {
    return new Point(
      (coords.tl.x + coords.br.x) / 2,
      (coords.tl.y + coords.br.y) / 2
    );
  }

  /**
   * Traverses all the objects
   * @param activeObject Active object
   * @param canvasObjects Canvas objects
   * @private
   */
  private traversAllObjects(
    activeObject: BaseFabricObject,
    canvasObjects: BaseFabricObject[]
  ): void {
    const objCoordsByMovingDistance =
      this.getObjDraggingObjCoords(activeObject);
    const snapXPoints: number[] = [];
    const snapYPoints: number[] = [];

    for (let i = canvasObjects.length; i--; ) {
      if (canvasObjects[i] === activeObject) {
        continue;
      }

      const objCoords = {
        ...canvasObjects[i].aCoords,
        c: canvasObjects[i].getCenterPoint()
      } as ACoordsAppendCenter;
      const { objHeight, objWidth } =
        this.getObjMaxWidthHeightByCoords(objCoords);

      Object.keys(objCoordsByMovingDistance).forEach((activeObjPoint) => {
        const newCoords =
          canvasObjects[i].angle !== 0
            ? this.omitCoords(objCoords, "horizontal")
            : objCoords;

        const calcHorizontalLineCoords = (
          objPoint: keyof ACoordsAppendCenter,
          activeObjCoords: ACoordsAppendCenter
        ): { x1: number; x2: number } => {
          let x1: number;
          let x2: number;

          if (objPoint === "c") {
            x1 = Math.min(
              objCoords.c.x - objWidth / 2,
              activeObjCoords[activeObjPoint as keyof typeof activeObjCoords].x
            );
            x2 = Math.max(
              objCoords.c.x + objWidth / 2,
              activeObjCoords[activeObjPoint as keyof typeof activeObjCoords].x
            );
          } else {
            x1 = Math.min(
              objCoords[objPoint].x,
              activeObjCoords[activeObjPoint as keyof typeof activeObjCoords].x
            );
            x2 = Math.max(
              objCoords[objPoint].x,
              activeObjCoords[activeObjPoint as keyof typeof activeObjCoords].x
            );
          }

          return { x1, x2 };
        };

        Object.keys(newCoords).forEach((objPoint) => {
          if (
            this.isInRange(
              objCoordsByMovingDistance[
                activeObjPoint as keyof typeof objCoordsByMovingDistance
              ].y,
              objCoords[objPoint as keyof typeof objCoords].y
            )
          ) {
            const y = objCoords[objPoint as keyof typeof objCoords].y;
            let { x1, x2 } = calcHorizontalLineCoords(
              objPoint as keyof typeof objCoords,
              objCoordsByMovingDistance
            );
            const offset =
              objCoordsByMovingDistance[
                activeObjPoint as keyof typeof objCoordsByMovingDistance
              ].y - y;

            snapYPoints.push(objCoordsByMovingDistance.c.y - offset);

            if (activeObject.aCoords) {
              let { x1, x2 } = calcHorizontalLineCoords(
                objPoint as keyof typeof objCoords,
                {
                  ...activeObject.aCoords,
                  c: this.calcCenterPointByACoords(activeObject.aCoords)
                } as ACoordsAppendCenter
              );

              this.horizontalLines.push({ y, x1, x2 });
            } else {
              this.horizontalLines.push({ y, x1, x2 });
            }
          }
        });
      });

      Object.keys(objCoordsByMovingDistance).forEach((activeObjPoint) => {
        const newCoords =
          canvasObjects[i].angle !== 0
            ? this.omitCoords(objCoords, "vertical")
            : objCoords;

        const calcVerticalLineCoords = (
          objPoint: keyof ACoordsAppendCenter,
          activeObjCoords: ACoordsAppendCenter
        ): { y1: number; y2: number } => {
          let y1: number;
          let y2: number;

          if (objPoint === "c") {
            y1 = Math.min(
              newCoords.c.y - objHeight / 2,
              activeObjCoords[activeObjPoint as keyof typeof activeObjCoords].y
            );
            y2 = Math.max(
              newCoords.c.y + objHeight / 2,
              activeObjCoords[activeObjPoint as keyof typeof activeObjCoords].y
            );
          } else {
            y1 = Math.min(
              objCoords[objPoint].y,
              activeObjCoords[activeObjPoint as keyof typeof activeObjCoords].y
            );
            y2 = Math.max(
              objCoords[objPoint].y,
              activeObjCoords[activeObjPoint as keyof typeof activeObjCoords].y
            );
          }

          return { y1, y2 };
        };

        Object.keys(newCoords).forEach((objPoint) => {
          if (
            this.isInRange(
              objCoordsByMovingDistance[
                activeObjPoint as keyof typeof objCoordsByMovingDistance
              ].x,
              objCoords[objPoint as keyof typeof objCoords].x
            )
          ) {
            const x = objCoords[objPoint as keyof typeof objCoords].x;
            let { y1, y2 } = calcVerticalLineCoords(
              objPoint as keyof typeof objCoords,
              objCoordsByMovingDistance
            );
            const offset =
              objCoordsByMovingDistance[
                activeObjPoint as keyof typeof objCoordsByMovingDistance
              ].x - x;

            snapXPoints.push(objCoordsByMovingDistance.c.x - offset);

            if (activeObject.aCoords) {
              let { y1, y2 } = calcVerticalLineCoords(
                objPoint as keyof typeof objCoords,
                {
                  ...activeObject.aCoords,
                  c: this.calcCenterPointByACoords(activeObject.aCoords)
                } as ACoordsAppendCenter
              );
              this.verticalLines.push({ x, y1, y2 });
            } else {
              this.verticalLines.push({ x, y1, y2 });
            }
          }
        });
      });

      this.snap({
        activeObject,
        draggingObjCoords: objCoordsByMovingDistance,
        snapXPoints,
        snapYPoints
      });
    }
  }

  /**
   * Snaps the active object to a guide-line
   * @param activeObject Active object
   * @param snapXPoints Snap X points
   * @param draggingObjCoords Dragging object coords
   * @param snapYPoints Snap Y points
   * @private
   */
  private snap({
    activeObject,
    snapXPoints,
    draggingObjCoords,
    snapYPoints
  }: {
    activeObject: BaseFabricObject;
    draggingObjCoords: ACoordsAppendCenter;
    snapXPoints: number[];
    snapYPoints: number[];
  }): void {
    const sortPoints = (list: number[], originPoint: number): number => {
      if (!list.length) {
        return originPoint;
      }

      return list
        .map((val) => ({
          abs: Math.abs(originPoint - val),
          val
        }))
        .sort((a, b) => a.abs - b.abs)[0].val;
    };

    activeObject.setPositionByOrigin(
      // Auto snap nearest object, record all the snap points, and then find the nearest one
      new Point(
        sortPoints(snapXPoints, draggingObjCoords.c.x),
        sortPoints(snapYPoints, draggingObjCoords.c.y)
      ),
      "center",
      "center"
    );
  }

  /**
   * Clears guidelines
   */
  private clearGuideline(): void {
    this.canvas.clearContext(this.ctx);
  }

  /**
   * Watches render events
   */
  private watchRender(): void {
    this.canvas.on("before:render", () => {
      this.clearGuideline();
    });

    this.canvas.on("after:render", () => {
      for (let i = this.verticalLines.length; i--; ) {
        this.drawVerticalLine(this.verticalLines[i]);
      }

      for (let i = this.horizontalLines.length; i--; ) {
        this.drawHorizontalLine(this.horizontalLines[i]);
      }

      this.canvas.calcOffset();
    });
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.watchObjectMoving();
    this.watchRender();
    this.watchMouseDown();
    this.watchMouseUp();
    this.watchMouseWheel();
  }
}

/**
 * Guide-lines plugin
 * @param canvas Canvas
 */
export const registerGuides = (canvas: Canvas): void => {
  new GuidesPlugin(canvas).init();
};
