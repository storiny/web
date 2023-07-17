import { makeNextSelectedLayerIds } from "./selection";

describe("makeNextSelectedLayerIds", () => {
  const makeNextSelectedLayerIdsImpl = (
    selectedLayerIds: { [id: string]: true },
    prevSelectedLayerIds: { [id: string]: true },
    expectUpdated: boolean
  ): void => {
    const ret = makeNextSelectedLayerIds(selectedLayerIds, {
      selectedLayerIds: prevSelectedLayerIds
    });

    expect(ret === selectedLayerIds).toBe(expectUpdated);
  };

  it("returns previous `selectedLayerIds` if unchanged", () => {
    makeNextSelectedLayerIdsImpl({}, {}, false);
    makeNextSelectedLayerIdsImpl({ 1: true }, { 1: true }, false);
    makeNextSelectedLayerIdsImpl(
      { 1: true, 2: true },
      { 1: true, 2: true },
      false
    );
  });

  it("returns new `selectedLayerIds` if they have changed", () => {
    makeNextSelectedLayerIdsImpl({ 1: true }, {}, true);
    makeNextSelectedLayerIdsImpl({}, { 1: true }, true);
    makeNextSelectedLayerIdsImpl({ 1: true }, { 2: true }, true);
    makeNextSelectedLayerIdsImpl({ 1: true }, { 1: true, 2: true }, true);
    makeNextSelectedLayerIdsImpl(
      { 1: true, 2: true },
      { 1: true, 3: true },
      true
    );
  });
});
