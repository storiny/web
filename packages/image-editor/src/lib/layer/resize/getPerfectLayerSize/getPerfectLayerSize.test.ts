import { LayerType } from "../../../../constants";
import { getPerfectLayerSize } from "./getPerfectLayerSize";

const EPSILON_DIGITS = 3;

describe("getPerfectLayerSize", () => {
  it("returns height:0 if `layerType` is line and locked angle is 0", () => {
    const { height, width } = getPerfectLayerSize(LayerType.LINE, 149, 10);
    expect(width).toBeCloseTo(149, EPSILON_DIGITS);
    expect(height).toBeCloseTo(0, EPSILON_DIGITS);
  });

  it("returns width:0 if `layerType` is line and locked angle is 90 deg (Math.PI/2)", () => {
    const { height, width } = getPerfectLayerSize(LayerType.LINE, 10, 140);
    expect(width).toBeCloseTo(0, EPSILON_DIGITS);
    expect(height).toBeCloseTo(140, EPSILON_DIGITS);
  });

  it("returns height:0 if `layerType` is arrow and locked angle is 0", () => {
    const { height, width } = getPerfectLayerSize(LayerType.ARROW, 200, 20);
    expect(width).toBeCloseTo(200, EPSILON_DIGITS);
    expect(height).toBeCloseTo(0, EPSILON_DIGITS);
  });

  it("returns width:0 if `layerType` is arrow and locked angle is 90 deg (Math.PI/2)", () => {
    const { height, width } = getPerfectLayerSize(LayerType.ARROW, 10, 100);
    expect(width).toBeCloseTo(0, EPSILON_DIGITS);
    expect(height).toBeCloseTo(100, EPSILON_DIGITS);
  });

  it("adjusts height to be width * tan(locked angle)", () => {
    const { height, width } = getPerfectLayerSize(LayerType.ARROW, 120, 185);
    expect(width).toBeCloseTo(120, EPSILON_DIGITS);
    expect(height).toBeCloseTo(207.846, EPSILON_DIGITS);
  });

  it("returns equal width and height if the locked angle is 45 deg", () => {
    const { height, width } = getPerfectLayerSize(LayerType.ARROW, 135, 145);
    expect(width).toBeCloseTo(135, EPSILON_DIGITS);
    expect(height).toBeCloseTo(135, EPSILON_DIGITS);
  });

  it("returns height:0 and width:0 when width and height are 0", () => {
    const { height, width } = getPerfectLayerSize(LayerType.ARROW, 0, 0);
    expect(width).toBeCloseTo(0, EPSILON_DIGITS);
    expect(height).toBeCloseTo(0, EPSILON_DIGITS);
  });
});
