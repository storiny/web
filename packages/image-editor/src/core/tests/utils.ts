import {
  getTransformHandles,
  TransformHandleDirection
} from "../layer/transformHandles";
import { ExcalidrawLayer } from "../layer/types";
import { Keyboard, KeyboardModifiers, Pointer } from "./helpers/ui";

const mouse = new Pointer("mouse");
const { h } = window;

export const resize = (
  layer: ExcalidrawLayer,
  handleDir: TransformHandleDirection,
  mouseMove: [number, number],
  keyboardModifiers: KeyboardModifiers = {}
) => {
  mouse.select(layer);
  const handle = getTransformHandles(layer, h.state.zoom, "mouse")[handleDir]!;
  const clientX = handle[0] + handle[2] / 2;
  const clientY = handle[1] + handle[3] / 2;
  Keyboard.withModifierKeys(keyboardModifiers, () => {
    mouse.reset();
    mouse.down(clientX, clientY);
    mouse.move(mouseMove[0], mouseMove[1]);
    mouse.up();
  });
};

export const rotate = (
  layer: ExcalidrawLayer,
  deltaX: number,
  deltaY: number,
  keyboardModifiers: KeyboardModifiers = {}
) => {
  mouse.select(layer);
  const handle = getTransformHandles(layer, h.state.zoom, "mouse").rotation!;
  const clientX = handle[0] + handle[2] / 2;
  const clientY = handle[1] + handle[3] / 2;

  Keyboard.withModifierKeys(keyboardModifiers, () => {
    mouse.reset();
    mouse.down(clientX, clientY);
    mouse.move(clientX + deltaX, clientY + deltaY);
    mouse.up();
  });
};
