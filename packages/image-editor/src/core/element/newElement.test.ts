import { isPrimitive } from "../../lib/utils/utils";
import { FONT_FAMILY, ROUNDNESS } from "../constants";
import { API } from "../tests/helpers/api";
import { mutateLayer } from "./mutateLayer";
import { duplicateLayer, duplicateLayers } from "./newLayer";
import { ExcalidrawLinearLayer } from "./types";

const assertCloneObjects = (source: any, clone: any) => {
  for (const key in clone) {
    if (clone.hasOwnProperty(key) && !isPrimitive(clone[key])) {
      expect(clone[key]).not.toBe(source[key]);
      if (source[key]) {
        assertCloneObjects(source[key], clone[key]);
      }
    }
  }
};

describe("duplicating single layers", () => {
  it("clones arrow layer", () => {
    const layer = API.createLayer({
      type: "arrow",
      x: 0,
      y: 0,
      strokeColor: "#000000",
      backgroundColor: "transparent",
      fillStyle: "hachure",
      strokeWidth: 1,
      strokeStyle: "solid",
      roundness: { type: ROUNDNESS.PROPORTIONAL_RADIUS },
      roughness: 1,
      opacity: 100
    });

    // @ts-ignore
    layer.__proto__ = { hello: "world" };

    mutateLayer(layer, {
      points: [
        [1, 2],
        [3, 4]
      ]
    });

    const copy = duplicateLayer(null, new Map(), layer);

    assertCloneObjects(layer, copy);

    // assert we clone the object's prototype
    // @ts-ignore
    expect(copy.__proto__).toEqual({ hello: "world" });
    expect(copy.hasOwnProperty("hello")).toBe(false);

    expect(copy.points).not.toBe(layer.points);
    expect(copy).not.toHaveProperty("shape");
    expect(copy.id).not.toBe(layer.id);
    expect(typeof copy.id).toBe("string");
    expect(copy.seed).not.toBe(layer.seed);
    expect(typeof copy.seed).toBe("number");
    expect(copy).toEqual({
      ...layer,
      id: copy.id,
      seed: copy.seed
    });
  });

  it("clones text layer", () => {
    const layer = API.createLayer({
      type: "text",
      x: 0,
      y: 0,
      strokeColor: "#000000",
      backgroundColor: "transparent",
      fillStyle: "hachure",
      strokeWidth: 1,
      strokeStyle: "solid",
      roundness: null,
      roughness: 1,
      opacity: 100,
      text: "hello",
      fontSize: 20,
      fontFamily: FONT_FAMILY.Virgil,
      textAlign: "left",
      verticalAlign: "top"
    });

    const copy = duplicateLayer(null, new Map(), layer);

    assertCloneObjects(layer, copy);

    expect(copy).not.toHaveProperty("points");
    expect(copy).not.toHaveProperty("shape");
    expect(copy.id).not.toBe(layer.id);
    expect(typeof copy.id).toBe("string");
    expect(typeof copy.seed).toBe("number");
  });
});

describe("duplicating multiple layers", () => {
  it("duplicateLayers should clone bindings", () => {
    const rectangle1 = API.createLayer({
      type: "rectangle",
      id: "rectangle1",
      boundLayers: [
        { id: "arrow1", type: "arrow" },
        { id: "arrow2", type: "arrow" },
        { id: "text1", type: "text" }
      ]
    });

    const text1 = API.createLayer({
      type: "text",
      id: "text1",
      containerId: "rectangle1"
    });

    const arrow1 = API.createLayer({
      type: "arrow",
      id: "arrow1",
      startBinding: {
        layerId: "rectangle1",
        focus: 0.2,
        gap: 7
      }
    });

    const arrow2 = API.createLayer({
      type: "arrow",
      id: "arrow2",
      endBinding: {
        layerId: "rectangle1",
        focus: 0.2,
        gap: 7
      },
      boundLayers: [{ id: "text2", type: "text" }]
    });

    const text2 = API.createLayer({
      type: "text",
      id: "text2",
      containerId: "arrow2"
    });

    // -------------------------------------------------------------------------

    const origLayers = [rectangle1, text1, arrow1, arrow2, text2] as const;
    const clonedLayers = duplicateLayers(origLayers);

    // generic id in-equality checks
    // --------------------------------------------------------------------------
    expect(origLayers.map((e) => e.type)).toEqual(
      clonedLayers.map((e) => e.type)
    );
    origLayers.forEach((origLayer, idx) => {
      const clonedLayer = clonedLayers[idx];
      expect(origLayer).toEqual(
        expect.objectContaining({
          id: expect.not.stringMatching(clonedLayer.id),
          type: clonedLayer.type
        })
      );
      if ("containerId" in origLayer) {
        expect(origLayer.containerId).not.toBe(
          (clonedLayer as any).containerId
        );
      }
      if ("endBinding" in origLayer) {
        if (origLayer.endBinding) {
          expect(origLayer.endBinding.layerId).not.toBe(
            (clonedLayer as any).endBinding?.layerId
          );
        } else {
          expect((clonedLayer as any).endBinding).toBeNull();
        }
      }
      if ("startBinding" in origLayer) {
        if (origLayer.startBinding) {
          expect(origLayer.startBinding.layerId).not.toBe(
            (clonedLayer as any).startBinding?.layerId
          );
        } else {
          expect((clonedLayer as any).startBinding).toBeNull();
        }
      }
    });
    // --------------------------------------------------------------------------

    const clonedArrows = clonedLayers.filter(
      (e) => e.type === "arrow"
    ) as ExcalidrawLinearLayer[];

    const [clonedRectangle, clonedText1, , clonedArrow2, clonedArrowLabel] =
      clonedLayers as any as typeof origLayers;

    expect(clonedText1.containerId).toBe(clonedRectangle.id);
    expect(
      clonedRectangle.boundLayers!.find((e) => e.id === clonedText1.id)
    ).toEqual(
      expect.objectContaining({
        id: clonedText1.id,
        type: clonedText1.type
      })
    );

    clonedArrows.forEach((arrow) => {
      // console.log(arrow);
      expect(
        clonedRectangle.boundLayers!.find((e) => e.id === arrow.id)
      ).toEqual(
        expect.objectContaining({
          id: arrow.id,
          type: arrow.type
        })
      );

      if (arrow.endBinding) {
        expect(arrow.endBinding.layerId).toBe(clonedRectangle.id);
      }
      if (arrow.startBinding) {
        expect(arrow.startBinding.layerId).toBe(clonedRectangle.id);
      }
    });

    expect(clonedArrow2.boundLayers).toEqual([
      { type: "text", id: clonedArrowLabel.id }
    ]);
    expect(clonedArrowLabel.containerId).toBe(clonedArrow2.id);
  });

  it("should remove id references of layers that aren't found", () => {
    const rectangle1 = API.createLayer({
      type: "rectangle",
      id: "rectangle1",
      boundLayers: [
        // should keep
        { id: "arrow1", type: "arrow" },
        // should drop
        { id: "arrow-not-exists", type: "arrow" },
        // should drop
        { id: "text-not-exists", type: "text" }
      ]
    });

    const arrow1 = API.createLayer({
      type: "arrow",
      id: "arrow1",
      startBinding: {
        layerId: "rectangle1",
        focus: 0.2,
        gap: 7
      }
    });

    const text1 = API.createLayer({
      type: "text",
      id: "text1",
      containerId: "rectangle-not-exists"
    });

    const arrow2 = API.createLayer({
      type: "arrow",
      id: "arrow2",
      startBinding: {
        layerId: "rectangle1",
        focus: 0.2,
        gap: 7
      },
      endBinding: {
        layerId: "rectangle-not-exists",
        focus: 0.2,
        gap: 7
      }
    });

    const arrow3 = API.createLayer({
      type: "arrow",
      id: "arrow2",
      startBinding: {
        layerId: "rectangle-not-exists",
        focus: 0.2,
        gap: 7
      },
      endBinding: {
        layerId: "rectangle1",
        focus: 0.2,
        gap: 7
      }
    });

    // -------------------------------------------------------------------------

    const origLayers = [rectangle1, text1, arrow1, arrow2, arrow3] as const;
    const clonedLayers = duplicateLayers(
      origLayers
    ) as any as typeof origLayers;
    const [
      clonedRectangle,
      clonedText1,
      clonedArrow1,
      clonedArrow2,
      clonedArrow3
    ] = clonedLayers;

    expect(clonedRectangle.boundLayers).toEqual([
      { id: clonedArrow1.id, type: "arrow" }
    ]);

    expect(clonedText1.containerId).toBe(null);

    expect(clonedArrow2.startBinding).toEqual({
      ...arrow2.startBinding,
      layerId: clonedRectangle.id
    });
    expect(clonedArrow2.endBinding).toBe(null);

    expect(clonedArrow3.startBinding).toBe(null);
    expect(clonedArrow3.endBinding).toEqual({
      ...arrow3.endBinding,
      layerId: clonedRectangle.id
    });
  });

  describe("should duplicate all group ids", () => {
    it("should regenerate all group ids and keep them consistent across layers", () => {
      const rectangle1 = API.createLayer({
        type: "rectangle",
        groupIds: ["g1"]
      });
      const rectangle2 = API.createLayer({
        type: "rectangle",
        groupIds: ["g2", "g1"]
      });
      const rectangle3 = API.createLayer({
        type: "rectangle",
        groupIds: ["g2", "g1"]
      });

      const origLayers = [rectangle1, rectangle2, rectangle3] as const;
      const clonedLayers = duplicateLayers(
        origLayers
      ) as any as typeof origLayers;
      const [clonedRectangle1, clonedRectangle2, clonedRectangle3] =
        clonedLayers;

      expect(rectangle1.groupIds[0]).not.toBe(clonedRectangle1.groupIds[0]);
      expect(rectangle2.groupIds[0]).not.toBe(clonedRectangle2.groupIds[0]);
      expect(rectangle2.groupIds[1]).not.toBe(clonedRectangle2.groupIds[1]);

      expect(clonedRectangle1.groupIds[0]).toBe(clonedRectangle2.groupIds[1]);
      expect(clonedRectangle2.groupIds[0]).toBe(clonedRectangle3.groupIds[0]);
      expect(clonedRectangle2.groupIds[1]).toBe(clonedRectangle3.groupIds[1]);
    });

    it("should keep and regenerate ids of groups even if invalid", () => {
      // lone layer shouldn't be able to be grouped with itself,
      // but hard to check against in a performant way so we ignore it
      const rectangle1 = API.createLayer({
        type: "rectangle",
        groupIds: ["g1"]
      });

      const [clonedRectangle1] = duplicateLayers([rectangle1]);

      expect(typeof clonedRectangle1.groupIds[0]).toBe("string");
      expect(rectangle1.groupIds[0]).not.toBe(clonedRectangle1.groupIds[0]);
    });
  });
});
