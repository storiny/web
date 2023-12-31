import { Canvas, FabricObject, Point, util } from "fabric";

import { is_interactive_object } from "../../../../utils";

type LineCoords<T extends "vertical" | "horizontal"> = T extends "vertical"
  ? { x: number; y1: number; y2: number }
  : { x1: number; x2: number; y: number };

type ACoordsAppendCenter = NonNullable<FabricObject["aCoords"]> & {
  c: Point;
};

/**
 * Renders align guidelines
 */
class GuidesPlugin {
  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getSelectionContext();
  }

  /**
   * Line margin (px)
   * @private
   */
  private readonly aligning_line_margin = 4;
  /**
   * Line width (px)
   * @private
   */
  private readonly aligning_line_width = 0.75;
  /**
   * Line color
   * @private
   */
  private readonly aligning_line_color = "#ff0000";
  /**
   * Sign width (px)
   * @private
   */
  private readonly sign_width = 1;
  /**
   * Sign color
   * @private
   */
  private readonly sign_color = this.aligning_line_color;
  /**
   * Sign size (px)
   * @private
   */
  private readonly sign_size = 3;
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
  private readonly vertical_lines: LineCoords<"vertical">[] = [];
  /**
   * Horizontal guide lines
   * @private
   */
  private readonly horizontal_lines: LineCoords<"horizontal">[] = [];
  /**
   * Current active object
   * @private
   */
  private active_object: FabricObject = new FabricObject();

  /**
   * Draws cross sign
   * @param x X value
   * @param y Y value
   * @private
   */
  private draw_sign(x: number, y: number): void {
    const ctx = this.ctx;
    const size = this.sign_size;

    ctx.lineWidth = this.sign_width;
    ctx.strokeStyle = this.sign_color;
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
  private draw_line(x1: number, y1: number, x2: number, y2: number): void {
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
    ctx.lineWidth = this.aligning_line_width;
    ctx.strokeStyle = this.aligning_line_color;
    ctx.beginPath();

    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);

    ctx.stroke();

    this.draw_sign(point1.x, point1.y);
    this.draw_sign(point2.x, point2.y);

    ctx.restore();
  }

  /**
   * Draws vertical guide line
   * @param coords Line coords
   * @private
   */
  private draw_vertical_line(coords: LineCoords<"vertical">): void {
    const moving_coords = this.get_obj_dragging_obj_coords(this.active_object);

    if (
      !Object.keys(moving_coords).some(
        (key) =>
          Math.abs(
            moving_coords[key as keyof typeof moving_coords].x - coords.x
          ) < 0.0001
      )
    ) {
      return;
    }

    this.draw_line(
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
  private draw_horizontal_line(coords: LineCoords<"horizontal">): void {
    const moving_coords = this.get_obj_dragging_obj_coords(this.active_object);

    if (
      !Object.keys(moving_coords).some(
        (key) =>
          Math.abs(
            moving_coords[key as keyof typeof moving_coords].y - coords.y
          ) < 0.0001
      )
    ) {
      return;
    }

    this.draw_line(
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
  private is_in_range(value1: number, value2: number): boolean {
    return (
      Math.abs(Math.round(value1) - Math.round(value2)) <=
      this.aligning_line_margin / this.canvas.getZoom()
    );
  }

  /**
   * Watches the mouse down event
   * @private
   */
  private watch_mouse_down(): void {
    this.canvas.on("mouse:down", () => {
      this.clear_lines_meta();
    });
  }

  /**
   * Watches the mouse up event
   * @private
   */
  private watch_mouse_up(): void {
    this.canvas.on("mouse:up", () => {
      this.clear_lines_meta();
      this.canvas.requestRenderAll();
    });
  }

  /**
   * Watches the mouse wheel event
   * @private
   */
  private watch_mouse_wheel(): void {
    this.canvas.on("mouse:wheel", () => {
      this.clear_lines_meta();
    });
  }

  /**
   * Clears guide lines cache
   * @private
   */
  private clear_lines_meta(): void {
    this.vertical_lines.length = 0;
    this.horizontal_lines.length = 0;
  }

  /**
   * Watches the `object:moving` event
   * @private
   */
  private watch_object_moving(): void {
    this.canvas.on("object:moving", (event) => {
      this.clear_lines_meta();
      const active_object = event.target;
      this.active_object = active_object;
      const canvas_objects = this.canvas
        .getObjects()
        .filter(is_interactive_object);
      const transform = this.canvas._currentTransform;

      if (!transform) {
        return;
      }

      this.traverse_all_objects(active_object, canvas_objects);
    });
  }

  /**
   * Returns dragging coords
   * @param active_object Active object
   * @private
   */
  private get_obj_dragging_obj_coords(
    active_object: FabricObject
  ): ACoordsAppendCenter {
    const a_coords = active_object.aCoords as NonNullable<
      FabricObject["aCoords"]
    >;
    const center_point = new Point(
      (a_coords.tl.x + a_coords.br.x) / 2,
      (a_coords.tl.y + a_coords.br.y) / 2
    );
    const offsetX = center_point.x - active_object.getCenterPoint().x;
    const offsetY = center_point.y - active_object.getCenterPoint().y;

    return Object.keys(a_coords).reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          x: a_coords[key as keyof typeof a_coords].x - offsetX,
          y: a_coords[key as keyof typeof a_coords].y - offsetY
        }
      }),
      {
        c: active_object.getCenterPoint()
      } as ACoordsAppendCenter
    );
  }

  /**
   * Omits coordinates. When the object is rotated, some coordinates need to be ignored, for example,
   * the horizontal auxiliary line only takes the uppermost and lower coordinates
   * @param obj_coords Object coords
   * @param type Type
   * @private
   */
  private omit_coords(
    obj_coords: ACoordsAppendCenter,
    type: "vertical" | "horizontal"
  ): ACoordsAppendCenter {
    let new_coords: ACoordsAppendCenter;
    type PointArr = [keyof ACoordsAppendCenter, Point];

    if (type === "vertical") {
      let l: PointArr = ["tl", obj_coords.tl];
      let r: PointArr = ["tl", obj_coords.tl];

      Object.keys(obj_coords).forEach((key) => {
        if (obj_coords[key as keyof typeof obj_coords].x < l[1].x) {
          l = [
            key as keyof typeof obj_coords,
            obj_coords[key as keyof typeof obj_coords]
          ];
        }

        if (obj_coords[key as keyof typeof obj_coords].x > r[1].x) {
          r = [
            key as keyof typeof obj_coords,
            obj_coords[key as keyof typeof obj_coords]
          ];
        }
      });

      new_coords = {
        [l[0]]: l[1],
        [r[0]]: r[1],
        c: obj_coords.c
      } as ACoordsAppendCenter;
    } else {
      let t: PointArr = ["tl", obj_coords.tl];
      let b: PointArr = ["tl", obj_coords.tl];

      Object.keys(obj_coords).forEach((key) => {
        if (obj_coords[key as keyof typeof obj_coords].y < t[1].y) {
          t = [
            key as keyof typeof obj_coords,
            obj_coords[key as keyof typeof obj_coords]
          ];
        }

        if (obj_coords[key as keyof typeof obj_coords].y > b[1].y) {
          b = [
            key as keyof typeof obj_coords,
            obj_coords[key as keyof typeof obj_coords]
          ];
        }
      });

      new_coords = {
        [t[0]]: t[1],
        [b[0]]: b[1],
        c: obj_coords.c
      } as ACoordsAppendCenter;
    }

    return new_coords;
  }

  /**
   * Returns object max width and height using coords
   * @param coords Coords
   * @private
   */
  private get_obj_max_width_height_by_coords(coords: ACoordsAppendCenter): {
    obj_height: number;
    obj_width: number;
  } {
    const obj_height =
      Math.max(
        Math.abs(coords.c.y - coords["tl"].y),
        Math.abs(coords.c.y - coords["tr"].y)
      ) * 2;
    const obj_width =
      Math.max(
        Math.abs(coords.c.x - coords["tl"].x),
        Math.abs(coords.c.x - coords["tr"].x)
      ) * 2;

    return { obj_height, obj_width };
  }

  /**
   * Returns the real center point of the object
   * @param coords Coords
   * @private
   */
  private calc_center_point_by_a_coords(
    coords: NonNullable<FabricObject["aCoords"]>
  ): Point {
    return new Point(
      (coords.tl.x + coords.br.x) / 2,
      (coords.tl.y + coords.br.y) / 2
    );
  }

  /**
   * Traverses all the objects
   * @param active_object Active object
   * @param canvas_objects Canvas objects
   * @private
   */
  private traverse_all_objects(
    active_object: FabricObject,
    canvas_objects: FabricObject[]
  ): void {
    const obj_coords_by_moving_distance =
      this.get_obj_dragging_obj_coords(active_object);
    const snap_x_points: number[] = [];
    const snap_y_points: number[] = [];

    for (let i = canvas_objects.length; i--; ) {
      if (canvas_objects[i] === active_object) {
        continue;
      }

      const obj_coords = {
        ...canvas_objects[i].aCoords,
        c: canvas_objects[i].getCenterPoint()
      } as ACoordsAppendCenter;
      const { obj_height, obj_width } =
        this.get_obj_max_width_height_by_coords(obj_coords);

      Object.keys(obj_coords_by_moving_distance).forEach((active_obj_point) => {
        const new_coords =
          canvas_objects[i].angle !== 0
            ? this.omit_coords(obj_coords, "horizontal")
            : obj_coords;

        const calc_horizontal_line_coords = (
          obj_point: keyof ACoordsAppendCenter,
          active_obj_coords: ACoordsAppendCenter
        ): { x1: number; x2: number } => {
          let x1: number;
          let x2: number;

          if (obj_point === "c") {
            x1 = Math.min(
              obj_coords.c.x - obj_width / 2,
              active_obj_coords[
                active_obj_point as keyof typeof active_obj_coords
              ].x
            );
            x2 = Math.max(
              obj_coords.c.x + obj_width / 2,
              active_obj_coords[
                active_obj_point as keyof typeof active_obj_coords
              ].x
            );
          } else {
            x1 = Math.min(
              obj_coords[obj_point].x,
              active_obj_coords[
                active_obj_point as keyof typeof active_obj_coords
              ].x
            );
            x2 = Math.max(
              obj_coords[obj_point].x,
              active_obj_coords[
                active_obj_point as keyof typeof active_obj_coords
              ].x
            );
          }

          return { x1, x2 };
        };

        Object.keys(new_coords).forEach((obj_point) => {
          if (
            this.is_in_range(
              obj_coords_by_moving_distance[
                active_obj_point as keyof typeof obj_coords_by_moving_distance
              ].y,
              obj_coords[obj_point as keyof typeof obj_coords].y
            )
          ) {
            const y = obj_coords[obj_point as keyof typeof obj_coords].y;
            const { x1, x2 } = calc_horizontal_line_coords(
              obj_point as keyof typeof obj_coords,
              obj_coords_by_moving_distance
            );
            const offset =
              obj_coords_by_moving_distance[
                active_obj_point as keyof typeof obj_coords_by_moving_distance
              ].y - y;

            snap_y_points.push(obj_coords_by_moving_distance.c.y - offset);

            if (active_object.aCoords) {
              const { x1, x2 } = calc_horizontal_line_coords(
                obj_point as keyof typeof obj_coords,
                {
                  ...active_object.aCoords,
                  c: this.calc_center_point_by_a_coords(active_object.aCoords)
                } as ACoordsAppendCenter
              );

              this.horizontal_lines.push({ y, x1, x2 });
            } else {
              this.horizontal_lines.push({ y, x1, x2 });
            }
          }
        });
      });

      Object.keys(obj_coords_by_moving_distance).forEach((active_obj_point) => {
        const new_coords =
          canvas_objects[i].angle !== 0
            ? this.omit_coords(obj_coords, "vertical")
            : obj_coords;

        const calc_vertical_line_coords = (
          obj_point: keyof ACoordsAppendCenter,
          active_obj_coords: ACoordsAppendCenter
        ): { y1: number; y2: number } => {
          let y1: number;
          let y2: number;

          if (obj_point === "c") {
            y1 = Math.min(
              new_coords.c.y - obj_height / 2,
              active_obj_coords[
                active_obj_point as keyof typeof active_obj_coords
              ].y
            );
            y2 = Math.max(
              new_coords.c.y + obj_height / 2,
              active_obj_coords[
                active_obj_point as keyof typeof active_obj_coords
              ].y
            );
          } else {
            y1 = Math.min(
              obj_coords[obj_point].y,
              active_obj_coords[
                active_obj_point as keyof typeof active_obj_coords
              ].y
            );
            y2 = Math.max(
              obj_coords[obj_point].y,
              active_obj_coords[
                active_obj_point as keyof typeof active_obj_coords
              ].y
            );
          }

          return { y1, y2 };
        };

        Object.keys(new_coords).forEach((obj_point) => {
          if (
            this.is_in_range(
              obj_coords_by_moving_distance[
                active_obj_point as keyof typeof obj_coords_by_moving_distance
              ].x,
              obj_coords[obj_point as keyof typeof obj_coords].x
            )
          ) {
            const x = obj_coords[obj_point as keyof typeof obj_coords].x;
            const { y1, y2 } = calc_vertical_line_coords(
              obj_point as keyof typeof obj_coords,
              obj_coords_by_moving_distance
            );
            const offset =
              obj_coords_by_moving_distance[
                active_obj_point as keyof typeof obj_coords_by_moving_distance
              ].x - x;

            snap_x_points.push(obj_coords_by_moving_distance.c.x - offset);

            if (active_object.aCoords) {
              const { y1, y2 } = calc_vertical_line_coords(
                obj_point as keyof typeof obj_coords,
                {
                  ...active_object.aCoords,
                  c: this.calc_center_point_by_a_coords(active_object.aCoords)
                } as ACoordsAppendCenter
              );
              this.vertical_lines.push({ x, y1, y2 });
            } else {
              this.vertical_lines.push({ x, y1, y2 });
            }
          }
        });
      });

      this.snap({
        active_object,
        dragging_obj_coords: obj_coords_by_moving_distance,
        snap_x_points,
        snap_y_points
      });
    }
  }

  /**
   * Snaps the active object to a guide-line
   * @param active_object Active object
   * @param snap_x_points Snap X points
   * @param dragging_obj_coords Dragging object coords
   * @param snap_y_points Snap Y points
   * @private
   */
  private snap({
    active_object,
    snap_x_points,
    dragging_obj_coords,
    snap_y_points
  }: {
    active_object: FabricObject;
    dragging_obj_coords: ACoordsAppendCenter;
    snap_x_points: number[];
    snap_y_points: number[];
  }): void {
    const sort_points = (list: number[], origin_point: number): number => {
      if (!list.length) {
        return origin_point;
      }

      return list
        .map((val) => ({
          abs: Math.abs(origin_point - val),
          val
        }))
        .sort((a, b) => a.abs - b.abs)[0].val;
    };

    active_object.setPositionByOrigin(
      // Auto snap nearest object, record all the snap points, and then find
      // the nearest one
      new Point(
        sort_points(snap_x_points, dragging_obj_coords.c.x),
        sort_points(snap_y_points, dragging_obj_coords.c.y)
      ),
      "center",
      "center"
    );
  }

  /**
   * Clears guidelines
   */
  private clear_guidelines(): void {
    this.canvas.clearContext(this.ctx);
  }

  /**
   * Watches render events
   */
  private watch_render(): void {
    this.canvas.on("before:render", () => {
      this.clear_guidelines();
    });

    this.canvas.on("after:render", () => {
      for (let i = this.vertical_lines.length; i--; ) {
        this.draw_vertical_line(this.vertical_lines[i]);
      }

      for (let i = this.horizontal_lines.length; i--; ) {
        this.draw_horizontal_line(this.horizontal_lines[i]);
      }

      this.canvas.calcOffset();
    });
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.watch_object_moving();
    this.watch_render();
    this.watch_mouse_down();
    this.watch_mouse_up();
    this.watch_mouse_wheel();
  }
}

/**
 * Guide-lines plugin
 * @param canvas Canvas
 */
export const register_guides = (canvas: Canvas): void => {
  new GuidesPlugin(canvas).init();
};
