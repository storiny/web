import {
  BaseFabricObject,
  Ellipse,
  Line,
  Object as FabricObject,
  Path,
  Rect,
  Textbox,
  TProps
} from "fabric";

import { COMMON_OBJECT_PROPS } from "../common";
import { registerControls } from "../controls";

type Constructor<T extends BaseFabricObject = FabricObject> = new (
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

      registerControls(this);
    }
  };

export class RectPrimitive<
  Props extends TProps<BaseFabricObject>
> extends WithPrimitive(Rect)<Props> {}

export class EllipsePrimitive<
  Props extends TProps<BaseFabricObject>
> extends WithPrimitive(Ellipse)<Props> {}

export class DiamondPrimitve<
  Props extends TProps<BaseFabricObject>
> extends WithPrimitive(FabricObject)<Props> {}

export class LinePrimitive<
  Props extends TProps<BaseFabricObject>
> extends WithPrimitive(Line)<Props> {}

export class ArrowPrimitive<
  Props extends TProps<BaseFabricObject>
> extends WithPrimitive(Line)<Props> {}

export class PenPrimitive<
  Props extends TProps<BaseFabricObject>
> extends WithPrimitive(Path)<Props> {}

export class TextPrimitive extends WithPrimitive(Textbox) {}
