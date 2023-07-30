import {
  BaseFabricObject,
  Ellipse,
  Object as FabricObject,
  Rect,
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
        ...COMMON_OBJECT_PROPS
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
