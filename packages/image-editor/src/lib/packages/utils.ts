import { getDefaultAppState } from "../../core/appState";
import {
  copyBlobToClipboardAsPng,
  copyTextToSystemClipboard,
  copyToClipboard
} from "../../core/clipboard";
import { MIME_TYPES } from "../../core/constants";
import { duplicateLayers } from "../../core/layer/newLayer";
import { ExcalidrawLayer, NonDeleted } from "../../core/layer/types";
import { AppState, BinaryFiles } from "../../core/types";
import { encodePngMetadata } from "../data/image/image";
import { serializeAsJSON } from "../data/json/json";
import { restore } from "../data/restore/restore";
import {
  exportToCanvas as _exportToCanvas,
  exportToSvg as _exportToSvg
} from "../scene/export";
import Scene from "../scene/Scene";

// getContainerLayer and getBoundTextLayer and potentially other helpers
// depend on `Scene` which will not be available when these pure utils are
// called outside initialized Excalidraw editor instance or even if called
// from inside Excalidraw if the layers were never cached by Scene (e.g.
// for library layers).
//
// As such, before passing the layers down, we need to initialize a custom
// Scene instance and assign them to it.
//
// FIXME This is a super hacky workaround and we'll need to rewrite this soon.
const passLayersSafely = (layers: readonly ExcalidrawLayer[]) => {
  const scene = new Scene();
  scene.replaceAllLayers(duplicateLayers(layers));
  return scene.getNonDeletedLayers();
};

export { MIME_TYPES };

type ExportOpts = {
  appState?: Partial<Omit<AppState, "offsetTop" | "offsetLeft">>;
  files: BinaryFiles | null;
  getDimensions?: (
    width: number,
    height: number
  ) => { height: number; scale?: number; width: number };
  layers: readonly NonDeleted<ExcalidrawLayer>[];
  maxWidthOrHeight?: number;
};

export const exportToCanvas = ({
  layers,
  appState,
  files,
  maxWidthOrHeight,
  getDimensions,
  exportPadding
}: ExportOpts & {
  exportPadding?: number;
}) => {
  const { layers: restoredLayers, appState: restoredAppState } = restore(
    { layers, appState },
    null,
    null
  );
  const { exportBackground, viewBackgroundColor } = restoredAppState;
  return _exportToCanvas(
    passLayersSafely(restoredLayers),
    { ...restoredAppState, offsetTop: 0, offsetLeft: 0, width: 0, height: 0 },
    files || {},
    { exportBackground, exportPadding, viewBackgroundColor },
    (width: number, height: number) => {
      const canvas = document.createLayer("canvas");

      if (maxWidthOrHeight) {
        if (typeof getDimensions === "function") {
          console.warn(
            "`getDimensions()` is ignored when `maxWidthOrHeight` is supplied."
          );
        }

        const max = Math.max(width, height);

        // if content is less then maxWidthOrHeight, fallback on supplied scale
        const scale =
          maxWidthOrHeight < max
            ? maxWidthOrHeight / max
            : appState?.exportScale ?? 1;

        canvas.width = width * scale;
        canvas.height = height * scale;

        return {
          canvas,
          scale
        };
      }

      const ret = getDimensions?.(width, height) || { width, height };

      canvas.width = ret.width;
      canvas.height = ret.height;

      return {
        canvas,
        scale: ret.scale ?? 1
      };
    }
  );
};

export const exportToBlob = async (
  opts: ExportOpts & {
    exportPadding?: number;
    mimeType?: string;
    quality?: number;
  }
): Promise<Blob> => {
  let { mimeType = MIME_TYPES.png, quality } = opts;

  if (mimeType === MIME_TYPES.png && typeof quality === "number") {
    console.warn(`"quality" will be ignored for "${MIME_TYPES.png}" mimeType`);
  }

  // typo in MIME type (should be "jpeg")
  if (mimeType === "image/jpg") {
    mimeType = MIME_TYPES.jpg;
  }

  if (mimeType === MIME_TYPES.jpg && !opts.appState?.exportBackground) {
    console.warn(
      `Defaulting "exportBackground" to "true" for "${MIME_TYPES.jpg}" mimeType`
    );
    opts = {
      ...opts,
      appState: { ...opts.appState, exportBackground: true }
    };
  }

  const canvas = await exportToCanvas({
    ...opts,
    layers: passLayersSafely(opts.layers)
  });
  quality = quality ? quality : /image\/jpe?g/.test(mimeType) ? 0.92 : 0.8;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          return reject(new Error("couldn't export to blob"));
        }
        if (
          blob &&
          mimeType === MIME_TYPES.png &&
          opts.appState?.exportEmbedScene
        ) {
          blob = await encodePngMetadata({
            blob,
            metadata: serializeAsJSON(
              // NOTE as long as we're using the Scene hack, we need to ensure
              // we pass the original, uncloned layers when serializing
              // so that we keep ids stable
              opts.layers,
              opts.appState,
              opts.files || {},
              "local"
            )
          });
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
};

export const exportToSvg = async ({
  layers,
  appState = getDefaultAppState(),
  files = {},
  exportPadding
}: Omit<ExportOpts, "getDimensions"> & {
  exportPadding?: number;
}): Promise<SVGSVGLayer> => {
  const { layers: restoredLayers, appState: restoredAppState } = restore(
    { layers, appState },
    null,
    null
  );

  const exportAppState = {
    ...restoredAppState,
    exportPadding
  };

  return _exportToSvg(passLayersSafely(restoredLayers), exportAppState, files, {
    // NOTE as long as we're using the Scene hack, we need to ensure
    // we pass the original, uncloned layers when serializing
    // so that we keep ids stable. Hence adding the serializeAsJSON helper
    // support into the downstream exportToSvg function.
    serializeAsJSON: () =>
      serializeAsJSON(restoredLayers, exportAppState, files || {}, "local")
  });
};

export const exportToClipboard = async (
  opts: ExportOpts & {
    mimeType?: string;
    quality?: number;
    type: "png" | "svg" | "json";
  }
) => {
  if (opts.type === "svg") {
    const svg = await exportToSvg(opts);
    await copyTextToSystemClipboard(svg.outerHTML);
  } else if (opts.type === "png") {
    await copyBlobToClipboardAsPng(exportToBlob(opts));
  } else if (opts.type === "json") {
    await copyToClipboard(opts.layers, opts.files);
  } else {
    throw new Error("Invalid export type");
  }
};

export { getFreeDrawSvgPath } from "../../core/renderer/renderLayer";
export {
  loadFromBlob,
  loadLibraryFromBlob,
  loadSceneOrLibraryFromBlob
} from "../data/blob/blob";
export { serializeAsJSON, serializeLibraryAsJSON } from "../data/json/json";
export { mergeLibraryItems } from "../data/library";
