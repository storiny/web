import { KEYS } from "../keys";

export enum Shape {
  ARROW = "arrow",
  DIAMOND = "diamond",
  ELLIPSE = "ellipse",
  ERASER = "eraser",
  FREE_DRAW = "freedraw",
  HAND = "hand",
  IMAGE = "image",
  LINE = "line",
  RECTANGLE = "rectangle",
  SELECTION = "selection",
  TEXT = "text"
}

export const SHAPES = [
  {
    value: Shape.SELECTION,
    key: KEYS.V,
    numericKey: KEYS["1"]
  },
  {
    value: Shape.RECTANGLE,
    key: KEYS.R,
    numericKey: KEYS["2"]
  },
  {
    value: Shape.DIAMOND,
    key: KEYS.D,
    numericKey: KEYS["3"]
  },
  {
    value: Shape.ELLIPSE,
    key: KEYS.O,
    numericKey: KEYS["4"]
  },
  {
    value: Shape.ARROW,
    key: KEYS.A,
    numericKey: KEYS["5"]
  },
  {
    value: Shape.LINE,
    key: KEYS.L,
    numericKey: KEYS["6"]
  },
  {
    value: Shape.FREE_DRAW,
    key: [KEYS.P, KEYS.X],
    numericKey: KEYS["7"]
  },
  {
    value: Shape.TEXT,
    key: KEYS.T,
    numericKey: KEYS["8"]
  },
  {
    value: Shape.IMAGE,
    key: null,
    numericKey: KEYS["9"]
  },
  {
    value: Shape.ERASER,
    key: KEYS.E,
    numericKey: KEYS["0"]
  }
] as const;
