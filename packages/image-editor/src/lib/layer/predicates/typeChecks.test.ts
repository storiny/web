import { API } from "../tests/helpers/api";
import { hasBoundTextLayer } from "./typeChecks";

describe("Test TypeChecks", () => {
  describe("Test hasBoundTextLayer", () => {
    it("should return true for text bindable containers with bound text", () => {
      expect(
        hasBoundTextLayer(
          API.createLayer({
            type: "rectangle",
            boundLayers: [{ type: "text", id: "text-id" }]
          })
        )
      ).toBeTruthy();

      expect(
        hasBoundTextLayer(
          API.createLayer({
            type: "ellipse",
            boundLayers: [{ type: "text", id: "text-id" }]
          })
        )
      ).toBeTruthy();

      expect(
        hasBoundTextLayer(
          API.createLayer({
            type: "arrow",
            boundLayers: [{ type: "text", id: "text-id" }]
          })
        )
      ).toBeTruthy();
    });

    it("should return false for text bindable containers without bound text", () => {
      expect(
        hasBoundTextLayer(
          API.createLayer({
            type: "freedraw",
            boundLayers: [{ type: "arrow", id: "arrow-id" }]
          })
        )
      ).toBeFalsy();
    });

    it("should return false for non text bindable containers", () => {
      expect(
        hasBoundTextLayer(
          API.createLayer({
            type: "freedraw",
            boundLayers: [{ type: "text", id: "text-id" }]
          })
        )
      ).toBeFalsy();
    });

    expect(
      hasBoundTextLayer(
        API.createLayer({
          type: "image",
          boundLayers: [{ type: "text", id: "text-id" }]
        })
      )
    ).toBeFalsy();
  });
});
