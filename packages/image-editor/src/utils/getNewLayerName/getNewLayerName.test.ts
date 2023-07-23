import { LayerType } from "../../constants";
import { Layer } from "../../types";
import { getNewLayerName } from "./getNewLayerName";

describe("getNewLayerName", () => {
  it("returns correct layer name", () => {
    const layers: Layer[] = [];

    const getLayerName = (type: LayerType = LayerType.RECTANGLE): string =>
      getNewLayerName(type, layers);

    expect(getLayerName()).toEqual("Rectangle 1");
    layers.push({ type: LayerType.RECTANGLE, name: "Rectangle 1" } as Layer);
    expect(getLayerName()).toEqual("Rectangle 2");
    layers.push({ type: LayerType.PEN, name: "Pen 1" } as Layer);
    expect(getLayerName()).toEqual("Rectangle 2");
  });
});
