import { FabricObject } from "fabric";

import { LayerType } from "../../constants";
import { get_new_layer_name } from "./get-new-layer-name";

describe("get_new_layer_name", () => {
  it("returns correct layer name", () => {
    const layers: Partial<FabricObject>[] = [];
    const get_layer_name = (type: LayerType = LayerType.RECTANGLE): string =>
      get_new_layer_name(type, undefined, layers);

    expect(get_layer_name()).toEqual("Rectangle 1");

    layers.push({
      _type: LayerType.RECTANGLE,
      name: "Rectangle 1",
      get: function (this: any, prop) {
        return this[prop];
      }
    } as Partial<FabricObject>);

    expect(get_layer_name()).toEqual("Rectangle 2");

    layers.push({
      _type: LayerType.PEN,
      name: "Pen 1",
      get: function (this: any, prop) {
        return this[prop];
      }
    } as Partial<FabricObject>);

    expect(get_layer_name()).toEqual("Rectangle 2");
  });
});
