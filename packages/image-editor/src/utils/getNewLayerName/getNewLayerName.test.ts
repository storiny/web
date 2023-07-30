import { BaseFabricObject } from "fabric";

import { LayerType } from "../../constants";
import { getNewLayerName } from "./getNewLayerName";

describe("getNewLayerName", () => {
  it("returns correct layer name", () => {
    const layers: Partial<BaseFabricObject>[] = [];

    const getLayerName = (type: LayerType = LayerType.RECTANGLE): string =>
      getNewLayerName(type, undefined, layers);

    expect(getLayerName()).toEqual("Rectangle 1");

    layers.push({
      _type: LayerType.RECTANGLE,
      name: "Rectangle 1",
      get: function (this: any, prop) {
        return this[prop];
      }
    } as Partial<BaseFabricObject>);

    expect(getLayerName()).toEqual("Rectangle 2");

    layers.push({
      _type: LayerType.PEN,
      name: "Pen 1",
      get: function (this: any, prop) {
        return this[prop];
      }
    } as Partial<BaseFabricObject>);

    expect(getLayerName()).toEqual("Rectangle 2");
  });
});
