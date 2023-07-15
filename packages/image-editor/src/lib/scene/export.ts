import rough from "roughjs/bin/rough";

import { getDefaultAppState } from "../../core/appState";
import {
  DEFAULT_EXPORT_PADDING,
  SVG_NS,
  THEME_FILTER
} from "../../core/constants";
import {
  getCommonBounds,
  getLayerAbsoluteCoords
} from "../../core/layer/bounds";
import {
  getInitializedImageLayers,
  updateImageCache
} from "../../core/layer/image";
import { NonDeletedExcalidrawLayer } from "../../core/layer/types";
import { renderScene, renderSceneToSvg } from "../../core/renderer/renderScene";
import { AppState, BinaryFiles } from "../../core/types";
import { distance, isOnlyExportingSingleFrame } from "../../core/utils";
import { serializeAsJSON } from "../data/json/json";
import Scene from "./Scene";

export const SVG_EXPORT_TAG = `<!-- svg-source:excalidraw -->`;

export const exportToCanvas = async (
  layers: readonly NonDeletedExcalidrawLayer[],
  appState: AppState,
  files: BinaryFiles,
  {
    exportBackground,
    exportPadding = DEFAULT_EXPORT_PADDING,
    viewBackgroundColor
  }: {
    exportBackground: boolean;
    exportPadding?: number;
    viewBackgroundColor: string;
  },
  createCanvas: (
    width: number,
    height: number
  ) => { canvas: HTMLCanvasLayer; scale: number } = (width, height) => {
    const canvas = document.createLayer("canvas");
    canvas.width = width * appState.exportScale;
    canvas.height = height * appState.exportScale;
    return { canvas, scale: appState.exportScale };
  }
) => {
  const [minX, minY, width, height] = getCanvasSize(layers, exportPadding);

  const { canvas, scale = 1 } = createCanvas(width, height);

  const defaultAppState = getDefaultAppState();

  const { imageCache } = await updateImageCache({
    imageCache: new Map(),
    fileIds: getInitializedImageLayers(layers).map((layer) => layer.fileId),
    files
  });

  const onlyExportingSingleFrame = isOnlyExportingSingleFrame(layers);

  renderScene({
    layers,
    appState,
    scale,
    rc: rough.canvas(canvas),
    canvas,
    renderConfig: {
      viewBackgroundColor: exportBackground ? viewBackgroundColor : null,
      scrollX: -minX + (onlyExportingSingleFrame ? 0 : exportPadding),
      scrollY: -minY + (onlyExportingSingleFrame ? 0 : exportPadding),
      zoom: defaultAppState.zoom,
      remotePointerViewportCoords: {},
      remoteSelectedLayerIds: {},
      shouldCacheIgnoreZoom: false,
      remotePointerUsernames: {},
      remotePointerUserStates: {},
      theme: appState.exportWithDarkMode ? "dark" : "light",
      imageCache,
      renderScrollbars: false,
      renderSelection: false,
      renderGrid: false,
      isExporting: true
    }
  });

  return canvas;
};

export const exportToSvg = async (
  layers: readonly NonDeletedExcalidrawLayer[],
  appState: {
    exportBackground: boolean;
    exportEmbedScene?: boolean;
    exportPadding?: number;
    exportScale?: number;
    exportWithDarkMode?: boolean;
    renderFrame?: boolean;
    viewBackgroundColor: string;
  },
  files: BinaryFiles | null,
  opts?: {
    serializeAsJSON?: () => string;
  }
): Promise<SVGSVGLayer> => {
  const {
    exportPadding = DEFAULT_EXPORT_PADDING,
    viewBackgroundColor,
    exportScale = 1,
    exportEmbedScene
  } = appState;
  let metadata = "";
  if (exportEmbedScene) {
    try {
      metadata = await (
        await import(/* webpackChunkName: "image" */ "../../src/data/image")
      ).encodeSvgMetadata({
        text: opts?.serializeAsJSON
          ? opts?.serializeAsJSON?.()
          : serializeAsJSON(layers, appState, files || {}, "local")
      });
    } catch (error: any) {
      console.error(error);
    }
  }
  const [minX, minY, width, height] = getCanvasSize(layers, exportPadding);

  // initialize SVG root
  const svgRoot = document.createLayerNS(SVG_NS, "svg");
  svgRoot.setAttribute("version", "1.1");
  svgRoot.setAttribute("xmlns", SVG_NS);
  svgRoot.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svgRoot.setAttribute("width", `${width * exportScale}`);
  svgRoot.setAttribute("height", `${height * exportScale}`);
  if (appState.exportWithDarkMode) {
    svgRoot.setAttribute("filter", THEME_FILTER);
  }

  let assetPath = "https://excalidraw.com/";

  // Asset path needs to be determined only when using package
  if (process.env.IS_EXCALIDRAW_NPM_PACKAGE) {
    assetPath =
      window.EXCALIDRAW_ASSET_PATH ||
      `https://unpkg.com/${process.env.PKG_NAME}@${process.env.PKG_VERSION}`;

    if (assetPath?.startsWith("/")) {
      assetPath = assetPath.replace("/", `${window.location.origin}/`);
    }
    assetPath = `${assetPath}/dist/excalidraw-assets/`;
  }

  // do not apply clipping when we're exporting the whole scene
  const isExportingWholeCanvas =
    Scene.getScene(layers[0])?.getNonDeletedLayers()?.length === layers.length;

  const onlyExportingSingleFrame = isOnlyExportingSingleFrame(layers);

  const offsetX = -minX + (onlyExportingSingleFrame ? 0 : exportPadding);
  const offsetY = -minY + (onlyExportingSingleFrame ? 0 : exportPadding);

  const exportingFrame =
    isExportingWholeCanvas || !onlyExportingSingleFrame
      ? undefined
      : layers.find((layer) => layer.type === "frame");

  let exportingFrameClipPath = "";
  if (exportingFrame) {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(exportingFrame);
    const cx = (x2 - x1) / 2 - (exportingFrame.x - x1);
    const cy = (y2 - y1) / 2 - (exportingFrame.y - y1);

    exportingFrameClipPath = `<clipPath id=${exportingFrame.id}>
            <rect transform="translate(${exportingFrame.x + offsetX} ${
      exportingFrame.y + offsetY
    }) rotate(${exportingFrame.angle} ${cx} ${cy})"
          width="${exportingFrame.width}"
          height="${exportingFrame.height}"
          >
          </rect>
        </clipPath>`;
  }

  svgRoot.innerHTML = `
  ${SVG_EXPORT_TAG}
  ${metadata}
  <defs>
    <style class="style-fonts">
      @font-face {
        font-family: "Virgil";
        src: url("${assetPath}Virgil.woff2");
      }
      @font-face {
        font-family: "Cascadia";
        src: url("${assetPath}Cascadia.woff2");
      }
    </style>
    ${exportingFrameClipPath}
  </defs>
  `;

  // render background rect
  if (appState.exportBackground && viewBackgroundColor) {
    const rect = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", `${width}`);
    rect.setAttribute("height", `${height}`);
    rect.setAttribute("fill", viewBackgroundColor);
    svgRoot.appendChild(rect);
  }

  const rsvg = rough.svg(svgRoot);
  renderSceneToSvg(layers, rsvg, svgRoot, files || {}, {
    offsetX,
    offsetY,
    exportWithDarkMode: appState.exportWithDarkMode,
    exportingFrameId: exportingFrame?.id || null
  });

  return svgRoot;
};

// calculate smallest area to fit the contents in
const getCanvasSize = (
  layers: readonly NonDeletedExcalidrawLayer[],
  exportPadding: number
): [number, number, number, number] => {
  // we should decide if we are exporting the whole canvas
  // if so, we are not clipping layers in the frame
  // and therefore, we should not do anything special

  const isExportingWholeCanvas =
    Scene.getScene(layers[0])?.getNonDeletedLayers()?.length === layers.length;

  const onlyExportingSingleFrame = isOnlyExportingSingleFrame(layers);

  if (!isExportingWholeCanvas || onlyExportingSingleFrame) {
    const frames = layers.filter((layer) => layer.type === "frame");

    const exportedFrameIds = frames.reduce((acc, frame) => {
      acc[frame.id] = true;
      return acc;
    }, {} as Record<string, true>);

    // layers in a frame do not affect the canvas size if we're not exporting
    // the whole canvas
    layers = layers.filter((layer) => !exportedFrameIds[layer.frameId ?? ""]);
  }

  const [minX, minY, maxX, maxY] = getCommonBounds(layers);
  const width =
    distance(minX, maxX) + (onlyExportingSingleFrame ? 0 : exportPadding * 2);
  const height =
    distance(minY, maxY) + (onlyExportingSingleFrame ? 0 : exportPadding * 2);

  return [minX, minY, width, height];
};

export const getExportSize = (
  layers: readonly NonDeletedExcalidrawLayer[],
  exportPadding: number,
  scale: number
): [number, number] => {
  const [, , width, height] = getCanvasSize(layers, exportPadding).map(
    (dimension) => Math.trunc(dimension * scale)
  );

  return [width, height];
};
