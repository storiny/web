export interface RectangleBox {
  angle: number;
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface BoundingBox {
  height: number;
  maxX: number;
  maxY: number;
  midX: number;
  midY: number;
  minX: number;
  minY: number;
  width: number;
}

// x and y position of the top left corner, x and y position of the bottom right corner
export type Bounds = readonly [x1: number, y1: number, x2: number, y2: number];
