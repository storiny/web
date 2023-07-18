import * as utils from "../../../lib/packages/utils";
import * as mockedSceneExportUtils from "../../../lib/scene/export/export";
import { MIME_TYPES } from "../../constants";
import { diagramFactory } from "../fixtures/diagramFixture";

jest.mock("../../scene/export", () => ({
  __esmodule: true,
  ...jest.requireActual("../../scene/export"),
  exportToSvg: jest.fn()
}));

describe("exportToCanvas", () => {
  const EXPORT_PADDING = 10;

  it("with default arguments", async () => {
    const canvas = await utils.exportToCanvas({
      ...diagramFactory({ layerOverrides: { width: 100, height: 100 } })
    });

    expect(canvas.width).toBe(100 + 2 * EXPORT_PADDING);
    expect(canvas.height).toBe(100 + 2 * EXPORT_PADDING);
  });

  it("when custom width and height", async () => {
    const canvas = await utils.exportToCanvas({
      ...diagramFactory({ layerOverrides: { width: 100, height: 100 } }),
      getDimensions: () => ({ width: 200, height: 200, scale: 1 })
    });

    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(200);
  });
});

describe("exportToBlob", () => {
  describe("mime type", () => {
    afterEach(jest.restoreAllMocks);

    it("should change image/jpg to image/jpeg", async () => {
      const blob = await utils.exportToBlob({
        ...diagramFactory(),
        getDimensions: (width, height) => ({ width, height, scale: 1 }),
        // testing typo in MIME type (jpg → jpeg)
        mimeType: "image/jpg",
        editorState: {
          exportBackground: true
        }
      });
      expect(blob?.type).toBe(MIME_TYPES.jpg);
    });

    it("should default to image/png", async () => {
      const blob = await utils.exportToBlob({
        ...diagramFactory()
      });
      expect(blob?.type).toBe(MIME_TYPES.png);
    });

    it("should warn when using quality with image/png", async () => {
      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementationOnce(() => void 0);

      await utils.exportToBlob({
        ...diagramFactory(),
        mimeType: MIME_TYPES.png,
        quality: 1
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        `"quality" will be ignored for "${MIME_TYPES.png}" mimeType`
      );
    });
  });
});

describe("exportToSvg", () => {
  const mockedExportUtil = mockedSceneExportUtils.exportToSvg as jest.Mock;
  const passedLayers = () => mockedExportUtil.mock.calls[0][0];
  const passedOptions = () => mockedExportUtil.mock.calls[0][1];
  afterEach(jest.resetAllMocks);

  it("with default arguments", async () => {
    await utils.exportToSvg({
      ...diagramFactory({
        overrides: { editorState: void 0 }
      })
    });

    const passedOptionsWhenDefault = {
      ...passedOptions(),
      // To avoid varying snapshots
      name: "name"
    };
    expect(passedLayers().length).toBe(3);
    expect(passedOptionsWhenDefault).toMatchSnapshot();
  });

  it("with deleted layers", async () => {
    await utils.exportToSvg({
      ...diagramFactory({
        overrides: { editorState: void 0 },
        layerOverrides: { isDeleted: true }
      })
    });

    expect(passedLayers().length).toBe(0);
  });

  it("with exportPadding", async () => {
    await utils.exportToSvg({
      ...diagramFactory({
        overrides: { editorState: { name: "diagram name" } }
      }),
      exportPadding: 0
    });

    expect(passedLayers().length).toBe(3);
    expect(passedOptions()).toEqual(
      expect.objectContaining({ exportPadding: 0 })
    );
  });

  it("with exportEmbedScene", async () => {
    await utils.exportToSvg({
      ...diagramFactory({
        overrides: {
          editorState: { name: "diagram name", exportEmbedScene: true }
        }
      })
    });

    expect(passedLayers().length).toBe(3);
    expect(passedOptions().exportEmbedScene).toBe(true);
  });
});
