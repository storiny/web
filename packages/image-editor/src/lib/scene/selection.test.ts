import { makeNextSelectedLayerIds } from "./selection";

describe("makeNextSelectedLayerIds", () => {
  const _makeNextSelectedLayerIds = (
    selectedLayerIds: { [id: string]: true },
    prevSelectedLayerIds: { [id: string]: true },
    expectUpdated: boolean
  ) => {
    const ret = makeNextSelectedLayerIds(selectedLayerIds, {
      selectedLayerIds: prevSelectedLayerIds
    });
    expect(ret === selectedLayerIds).toBe(expectUpdated);
  };
  it("should return prevState selectedLayerIds if no change", () => {
    _makeNextSelectedLayerIds({}, {}, false);
    _makeNextSelectedLayerIds({ 1: true }, { 1: true }, false);
    _makeNextSelectedLayerIds(
      { 1: true, 2: true },
      { 1: true, 2: true },
      false
    );
  });
  it("should return new selectedLayerIds if changed", () => {
    // _makeNextSelectedLayerIds({ 1: true }, { 1: false }, true);
    _makeNextSelectedLayerIds({ 1: true }, {}, true);
    _makeNextSelectedLayerIds({}, { 1: true }, true);
    _makeNextSelectedLayerIds({ 1: true }, { 2: true }, true);
    _makeNextSelectedLayerIds({ 1: true }, { 1: true, 2: true }, true);
    _makeNextSelectedLayerIds({ 1: true, 2: true }, { 1: true, 3: true }, true);
  });
});
