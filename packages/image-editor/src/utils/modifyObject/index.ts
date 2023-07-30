import { BaseFabricObject } from "fabric";

/**
 * Modifies an object
 * @param object Object to modify
 * @param props Props to modify
 */
export const modifyObject = (
  object: BaseFabricObject,
  props: Record<string, any>
): void => {
  const canvas = object.canvas;
  object.set({ ...props, dirty: true });

  if (canvas) {
    canvas.requestRenderAll();
    canvas.fire("object:modified", { target: object } as any);
  }
};
