import { getDataURL } from "../../lib/data/blob/blob";
import {
  decodeSvgMetadata,
  encodePngMetadata,
  encodeSvgMetadata
} from "../../lib/data/image/image";
import { serializeAsJSON } from "../../lib/data/json/json";
import { exportToSvg } from "../../lib/scene/export/export";
import { getDefaultAppState } from "../appState";
import ExcalidrawApp from "../excalidraw-app";
import { FileId } from "../layer/types";
import { API } from "./helpers/api";
import { render, waitFor } from "./test-utils";

const { h } = window;

const testLayers = [
  {
    ...API.createLayer({
      type: "text",
      id: "A",
      text: "😀"
    }),
    // can't get jsdom text measurement to work so this is a temp hack
    // to ensure the layer isn't stripped as invisible
    width: 16,
    height: 16
  }
];

// tiny polyfill for TextDecoder.decode on which we depend
Object.defineProperty(window, "TextDecoder", {
  value: class TextDecoder {
    decode(ab: ArrayBuffer) {
      return new Uint8Array(ab).reduce(
        (acc, c) => acc + String.fromCharCode(c),
        ""
      );
    }
  }
});

describe("export", () => {
  beforeEach(async () => {
    await render(<ExcalidrawApp />);
  });

  it("export embedded png and reimport", async () => {
    const pngBlob = await API.loadFile("./fixtures/smiley.png");
    const pngBlobEmbedded = await encodePngMetadata({
      blob: pngBlob,
      metadata: serializeAsJSON(testLayers, h.state, {}, "local")
    });
    API.drop(pngBlobEmbedded);

    await waitFor(() => {
      expect(h.layers).toEqual([
        expect.objectContaining({ type: "text", text: "😀" })
      ]);
    });
  });

  it("test encoding/decoding scene for SVG export", async () => {
    const encoded = await encodeSvgMetadata({
      text: serializeAsJSON(testLayers, h.state, {}, "local")
    });
    const decoded = JSON.parse(await decodeSvgMetadata({ svg: encoded }));
    expect(decoded.layers).toEqual([
      expect.objectContaining({ type: "text", text: "😀" })
    ]);
  });

  it("import embedded png (legacy v1)", async () => {
    API.drop(await API.loadFile("./fixtures/test_embedded_v1.png"));
    await waitFor(() => {
      expect(h.layers).toEqual([
        expect.objectContaining({ type: "text", text: "test" })
      ]);
    });
  });

  it("import embedded png (v2)", async () => {
    API.drop(await API.loadFile("./fixtures/smiley_embedded_v2.png"));
    await waitFor(() => {
      expect(h.layers).toEqual([
        expect.objectContaining({ type: "text", text: "😀" })
      ]);
    });
  });

  it("import embedded svg (legacy v1)", async () => {
    API.drop(await API.loadFile("./fixtures/test_embedded_v1.svg"));
    await waitFor(() => {
      expect(h.layers).toEqual([
        expect.objectContaining({ type: "text", text: "test" })
      ]);
    });
  });

  it("import embedded svg (v2)", async () => {
    API.drop(await API.loadFile("./fixtures/smiley_embedded_v2.svg"));
    await waitFor(() => {
      expect(h.layers).toEqual([
        expect.objectContaining({ type: "text", text: "😀" })
      ]);
    });
  });

  it("exporting svg containing transformed images", async () => {
    const normalizeAngle = (angle: number) => (angle / 180) * Math.PI;

    const layers = [
      API.createLayer({
        type: "image",
        fileId: "file_A",
        x: 0,
        y: 0,
        scale: [1, 1],
        width: 100,
        height: 100,
        angle: normalizeAngle(315)
      }),
      API.createLayer({
        type: "image",
        fileId: "file_A",
        x: 100,
        y: 0,
        scale: [-1, 1],
        width: 50,
        height: 50,
        angle: normalizeAngle(45)
      }),
      API.createLayer({
        type: "image",
        fileId: "file_A",
        x: 0,
        y: 100,
        scale: [1, -1],
        width: 100,
        height: 100,
        angle: normalizeAngle(45)
      }),
      API.createLayer({
        type: "image",
        fileId: "file_A",
        x: 100,
        y: 100,
        scale: [-1, -1],
        width: 50,
        height: 50,
        angle: normalizeAngle(315)
      })
    ];
    const appState = { ...getDefaultAppState(), exportBackground: false };
    const files = {
      file_A: {
        id: "file_A" as FileId,
        dataURL: await getDataURL(await API.loadFile("./fixtures/deer.png")),
        mimeType: "image/png",
        created: Date.now(),
        lastRetrieved: Date.now()
      }
    } as const;

    const svg = await exportToSvg(layers, appState, files);

    const svgText = svg.outerHTML;

    // expect 1 <image> layer (deduped)
    expect(svgText.match(/<image/g)?.length).toBe(1);
    // expect 4 <use> layers (one for each excalidraw image layer)
    expect(svgText.match(/<use/g)?.length).toBe(4);

    // in case of regressions, save the SVG to a file and visually compare to:
    // src/tests/fixtures/svg-image-exporting-reference.svg
    expect(svgText).toMatchSnapshot(`svg export output`);
  });
});
