import {
  Ellipse,
  FabricObject,
  Image,
  Line,
  Path,
  Rect,
  Textbox,
  TFabricObjectProps
} from "fabric";

import { COMMON_OBJECT_PROPS } from "../common";
import { register_controls } from "../controls";

type Constructor<T extends FabricObject = FabricObject> = new (
  ...args: any[]
) => T;

export const WithPrimitive = <TBase extends Constructor>(Base: TBase): TBase =>
  class Primitive extends Base {
    constructor(...args: any[]) {
      super(...args);

      this.set({
        ...COMMON_OBJECT_PROPS,
        originX: "center",
        originY: this.isType("text") ? "top" : "center"
      });

      register_controls(this);
    }
  };

export class RectPrimitive<
  Props extends TFabricObjectProps
> extends WithPrimitive(Rect)<Props> {}

export class EllipsePrimitive<
  Props extends TFabricObjectProps
> extends WithPrimitive(Ellipse)<Props> {}

export class DiamondPrimitve<
  Props extends TFabricObjectProps
> extends WithPrimitive(FabricObject)<Props> {}

export class LinePrimitive<
  Props extends TFabricObjectProps
> extends WithPrimitive(Line)<Props> {}

export class ArrowPrimitive<
  Props extends TFabricObjectProps
> extends WithPrimitive(Line)<Props> {}

export class PenPrimitive<
  Props extends TFabricObjectProps
> extends WithPrimitive(Path)<Props> {}

export class TextPrimitive<
  Props extends TFabricObjectProps
> extends WithPrimitive(Textbox)<Props> {}

export class ImagePrimitive<
  Props extends TFabricObjectProps
> extends WithPrimitive(Image)<Props> {}
