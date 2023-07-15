import {
  decodePngMetadata,
  decodeSvgMetadata
} from "../../../lib/data/image/image";
import { ImportedDataState } from "../../../lib/data/types";
import * as utils from "../../../lib/packages/utils";
import { API } from "../helpers/api";

// NOTE this test file is using the actual API, unmocked. Hence splitting it
// from the other test file, because I couldn't figure out how to test
// mocked and unmocked API in the same file.

describe("embedding scene data", () => {
  describe("exportToSvg", () => {
    it("embedding scene data shouldn't modify them", async () => {
      const rectangle = API.createLayer({ type: "rectangle" });
      const ellipse = API.createLayer({ type: "ellipse" });

      const sourceLayers = [rectangle, ellipse];

      const svgNode = await utils.exportToSvg({
        layers: sourceLayers,
        appState: {
          viewBackgroundColor: "#ffffff",
          gridSize: null,
          exportEmbedScene: true
        },
        files: null
      });

      const svg = svgNode.outerHTML;

      const parsedString = await decodeSvgMetadata({ svg });
      const importedData: ImportedDataState = JSON.parse(parsedString);

      expect(sourceLayers.map((x) => x.id)).toEqual(
        importedData.layers?.map((el) => el.id)
      );
    });
  });

  // skipped because we can't test png encoding right now
  // (canvas.toBlob not supported in jsdom)
  describe.skip("exportToBlob", () => {
    it("embedding scene data shouldn't modify them", async () => {
      const rectangle = API.createLayer({ type: "rectangle" });
      const ellipse = API.createLayer({ type: "ellipse" });

      const sourceLayers = [rectangle, ellipse];

      const blob = await utils.exportToBlob({
        mimeType: "image/png",
        layers: sourceLayers,
        appState: {
          viewBackgroundColor: "#ffffff",
          gridSize: null,
          exportEmbedScene: true
        },
        files: null
      });

      const parsedString = await decodePngMetadata(blob);
      const importedData: ImportedDataState = JSON.parse(parsedString);

      expect(sourceLayers.map((x) => x.id)).toEqual(
        importedData.layers?.map((el) => el.id)
      );
    });
  });
});
