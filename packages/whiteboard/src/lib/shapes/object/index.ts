import {
  Ellipse,
  FabricObject,
  Image,
  Line,
  Path,
  Rect,
  Textbox,
  TProps
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
        originY: "center"
      });

      register_controls(this);
    }
  };

export class RectPrimitive<
  Props extends TProps<FabricObject>
> extends WithPrimitive(Rect)<Props> {}

export class EllipsePrimitive<
  Props extends TProps<FabricObject>
> extends WithPrimitive(Ellipse)<Props> {}

export class DiamondPrimitve<
  Props extends TProps<FabricObject>
> extends WithPrimitive(FabricObject)<Props> {}

export class LinePrimitive<
  Props extends TProps<FabricObject>
> extends WithPrimitive(Line)<Props> {}

export class ArrowPrimitive<
  Props extends TProps<FabricObject>
> extends WithPrimitive(Line)<Props> {}

export class PenPrimitive<
  Props extends TProps<FabricObject>
> extends WithPrimitive(Path)<Props> {}

export class TextPrimitive extends WithPrimitive(Textbox) {}

export class ImagePrimitive<
  Props extends TProps<FabricObject>
> extends WithPrimitive(Image)<Props> {}
