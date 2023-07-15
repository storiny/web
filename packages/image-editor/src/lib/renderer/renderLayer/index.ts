import { getStroke, StrokeOptions } from "perfect-freehand";
import { RoughCanvas } from "roughjs/bin/canvas";
import { Drawable, Options } from "roughjs/bin/core";
import { RoughGenerator } from "roughjs/bin/generator";
import rough from "roughjs/bin/rough";
import { RoughSVG } from "roughjs/bin/svg";

import { getDefaultAppState } from "../appState";
import {
  BOUND_TEXT_PADDING,
  FRAME_STYLE,
  MAX_DECIMALS_FOR_SVG_EXPORT,
  MIME_TYPES,
  SVG_NS
} from "../constants";
import { normalizeLink } from "../data/url";
import { getContainingFrame } from "../frame";
import {
  getArrowheadPoints,
  getDiamondPoints,
  getLayerAbsoluteCoords
} from "../layer/bounds";
import { LinearLayerEditor } from "../layer/linearLayerEditor";
import {
  getBoundTextLayer,
  getBoundTextMaxHeight,
  getBoundTextMaxWidth,
  getContainerCoords,
  getContainerLayer,
  getLineHeightInPx
} from "../layer/textLayer";
import {
  hasBoundTextLayer,
  isArrowLayer,
  isFreeDrawLayer,
  isInitializedImageLayer,
  isLinearLayer,
  isTextLayer
} from "../layer/typeChecks";
import {
  Arrowhead,
  ExcalidrawFreeDrawLayer,
  ExcalidrawImageLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextLayer,
  ExcalidrawTextLayerWithContainer,
  NonDeletedExcalidrawLayer
} from "../layer/types";
import { getCornerRadius, isPathALoop, isRightAngle } from "../math";
import { RenderConfig } from "../scene/types";
import { AppState, BinaryFiles, Zoom } from "../types";
import { distance, getFontFamilyString, getFontString, isRTL } from "../utils";

// using a stronger invert (100% vs our regular 93%) and saturate
// as a temp hack to make images in dark theme look closer to original
// color scheme (it's still not quite there and the colors look slightly
// desatured, alas...)
const IMAGE_INVERT_FILTER = "invert(100%) hue-rotate(180deg) saturate(1.25)";

const defaultAppState = getDefaultAppState();

const isPendingImageLayer = (
  layer: ExcalidrawLayer,
  renderConfig: RenderConfig
) =>
  isInitializedImageLayer(layer) && !renderConfig.imageCache.has(layer.fileId);

const shouldResetImageFilter = (
  layer: ExcalidrawLayer,
  renderConfig: RenderConfig
) =>
  renderConfig.theme === "dark" &&
  isInitializedImageLayer(layer) &&
  !isPendingImageLayer(layer, renderConfig) &&
  renderConfig.imageCache.get(layer.fileId)?.mimeType !== MIME_TYPES.svg;

const getDashArrayDashed = (strokeWidth: number) => [8, 8 + strokeWidth];

const getDashArrayDotted = (strokeWidth: number) => [1.5, 6 + strokeWidth];

const getCanvasPadding = (layer: ExcalidrawLayer) =>
  layer.type === "freedraw" ? layer.strokeWidth * 12 : 20;

export interface ExcalidrawLayerWithCanvas {
  boundTextLayerVersion: number | null;
  canvas: HTMLCanvasLayer;
  canvasOffsetX: number;
  canvasOffsetY: number;
  containingFrameOpacity: number;
  layer: ExcalidrawLayer | ExcalidrawTextLayer;
  scale: number;
  theme: RenderConfig["theme"];
  zoomValue: RenderConfig["zoom"]["value"];
}

const cappedLayerCanvasSize = (
  layer: NonDeletedExcalidrawLayer,
  zoom: Zoom
): {
  height: number;
  scale: number;
  width: number;
} => {
  // these limits are ballpark, they depend on specific browsers and device.
  // We've chosen lower limits to be safe. We might want to change these limits
  // based on browser/device type, if we get reports of low quality rendering
  // on zoom.
  //
  // ~ safari mobile canvas area limit
  const AREA_LIMIT = 16777216;
  // ~ safari width/height limit based on developer.mozilla.org.
  const WIDTH_HEIGHT_LIMIT = 32767;

  const padding = getCanvasPadding(layer);

  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const layerWidth =
    isLinearLayer(layer) || isFreeDrawLayer(layer)
      ? distance(x1, x2)
      : layer.width;
  const layerHeight =
    isLinearLayer(layer) || isFreeDrawLayer(layer)
      ? distance(y1, y2)
      : layer.height;

  let width = layerWidth * window.devicePixelRatio + padding * 2;
  let height = layerHeight * window.devicePixelRatio + padding * 2;

  let scale: number = zoom.value;

  // rescale to ensure width and height is within limits
  if (
    width * scale > WIDTH_HEIGHT_LIMIT ||
    height * scale > WIDTH_HEIGHT_LIMIT
  ) {
    scale = Math.min(WIDTH_HEIGHT_LIMIT / width, WIDTH_HEIGHT_LIMIT / height);
  }

  // rescale to ensure canvas area is within limits
  if (width * height * scale * scale > AREA_LIMIT) {
    scale = Math.sqrt(AREA_LIMIT / (width * height));
  }

  width = Math.floor(width * scale);
  height = Math.floor(height * scale);

  return { width, height, scale };
};

const generateLayerCanvas = (
  layer: NonDeletedExcalidrawLayer,
  zoom: Zoom,
  renderConfig: RenderConfig
): ExcalidrawLayerWithCanvas => {
  const canvas = document.createLayer("canvas");
  const context = canvas.getContext("2d")!;
  const padding = getCanvasPadding(layer);

  const { width, height, scale } = cappedLayerCanvasSize(layer, zoom);

  canvas.width = width;
  canvas.height = height;

  let canvasOffsetX = 0;
  let canvasOffsetY = 0;

  if (isLinearLayer(layer) || isFreeDrawLayer(layer)) {
    const [x1, y1] = getLayerAbsoluteCoords(layer);

    canvasOffsetX =
      layer.x > x1
        ? distance(layer.x, x1) * window.devicePixelRatio * scale
        : 0;

    canvasOffsetY =
      layer.y > y1
        ? distance(layer.y, y1) * window.devicePixelRatio * scale
        : 0;

    context.translate(canvasOffsetX, canvasOffsetY);
  }

  context.save();
  context.translate(padding * scale, padding * scale);
  context.scale(
    window.devicePixelRatio * scale,
    window.devicePixelRatio * scale
  );

  const rc = rough.canvas(canvas);

  // in dark theme, revert the image color filter
  if (shouldResetImageFilter(layer, renderConfig)) {
    context.filter = IMAGE_INVERT_FILTER;
  }

  drawLayerOnCanvas(layer, rc, context, renderConfig);
  context.restore();

  return {
    layer,
    canvas,
    theme: renderConfig.theme,
    scale,
    zoomValue: zoom.value,
    canvasOffsetX,
    canvasOffsetY,
    boundTextLayerVersion: getBoundTextLayer(layer)?.version || null,
    containingFrameOpacity: getContainingFrame(layer)?.opacity || 100
  };
};

export const DEFAULT_LINK_SIZE = 14;

const IMAGE_PLACEHOLDER_IMG = document.createLayer("img");
IMAGE_PLACEHOLDER_IMG.src = `data:${MIME_TYPES.svg},${encodeURIComponent(
  `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="image" class="svg-inline--fa fa-image fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#888" d="M464 448H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h416c26.51 0 48 21.49 48 48v288c0 26.51-21.49 48-48 48zM112 120c-30.928 0-56 25.072-56 56s25.072 56 56 56 56-25.072 56-56-25.072-56-56-56zM64 384h384V272l-87.515-87.515c-4.686-4.686-12.284-4.686-16.971 0L208 320l-55.515-55.515c-4.686-4.686-12.284-4.686-16.971 0L64 336v48z"></path></svg>`
)}`;

const IMAGE_ERROR_PLACEHOLDER_IMG = document.createLayer("img");
IMAGE_ERROR_PLACEHOLDER_IMG.src = `data:${MIME_TYPES.svg},${encodeURIComponent(
  `<svg viewBox="0 0 668 668" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2"><path d="M464 448H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h416c26.51 0 48 21.49 48 48v288c0 26.51-21.49 48-48 48ZM112 120c-30.928 0-56 25.072-56 56s25.072 56 56 56 56-25.072 56-56-25.072-56-56-56ZM64 384h384V272l-87.515-87.515c-4.686-4.686-12.284-4.686-16.971 0L208 320l-55.515-55.515c-4.686-4.686-12.284-4.686-16.971 0L64 336v48Z" style="fill:#888;fill-rule:nonzero" transform="matrix(.81709 0 0 .81709 124.825 145.825)"/><path d="M256 8C119.034 8 8 119.033 8 256c0 136.967 111.034 248 248 248s248-111.034 248-248S392.967 8 256 8Zm130.108 117.892c65.448 65.448 70 165.481 20.677 235.637L150.47 105.216c70.204-49.356 170.226-44.735 235.638 20.676ZM125.892 386.108c-65.448-65.448-70-165.481-20.677-235.637L361.53 406.784c-70.203 49.356-170.226 44.736-235.638-20.676Z" style="fill:#888;fill-rule:nonzero" transform="matrix(.30366 0 0 .30366 506.822 60.065)"/></svg>`
)}`;

const drawImagePlaceholder = (
  layer: ExcalidrawImageLayer,
  context: CanvasRenderingContext2D,
  zoomValue: AppState["zoom"]["value"]
) => {
  context.fillStyle = "#E7E7E7";
  context.fillRect(0, 0, layer.width, layer.height);

  const imageMinWidthOrHeight = Math.min(layer.width, layer.height);

  const size = Math.min(
    imageMinWidthOrHeight,
    Math.min(imageMinWidthOrHeight * 0.4, 100)
  );

  context.drawImage(
    layer.status === "error"
      ? IMAGE_ERROR_PLACEHOLDER_IMG
      : IMAGE_PLACEHOLDER_IMG,
    layer.width / 2 - size / 2,
    layer.height / 2 - size / 2,
    size,
    size
  );
};
const drawLayerOnCanvas = (
  layer: NonDeletedExcalidrawLayer,
  rc: RoughCanvas,
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig
) => {
  context.globalAlpha =
    ((getContainingFrame(layer)?.opacity ?? 100) * layer.opacity) / 10000;
  switch (layer.type) {
    case "rectangle":
    case "diamond":
    case "ellipse": {
      context.lineJoin = "round";
      context.lineCap = "round";
      rc.draw(getShapeForLayer(layer)!);
      break;
    }
    case "arrow":
    case "line": {
      context.lineJoin = "round";
      context.lineCap = "round";

      getShapeForLayer(layer)!.forEach((shape) => {
        rc.draw(shape);
      });
      break;
    }
    case "freedraw": {
      // Draw directly to canvas
      context.save();
      context.fillStyle = layer.strokeColor;

      const path = getFreeDrawPath2D(layer) as Path2D;
      const fillShape = getShapeForLayer(layer);

      if (fillShape) {
        rc.draw(fillShape);
      }

      context.fillStyle = layer.strokeColor;
      context.fill(path);

      context.restore();
      break;
    }
    case "image": {
      const img = isInitializedImageLayer(layer)
        ? renderConfig.imageCache.get(layer.fileId)?.image
        : undefined;
      if (img != null && !(img instanceof Promise)) {
        context.drawImage(
          img,
          0 /* hardcoded for the selection box*/,
          0,
          layer.width,
          layer.height
        );
      } else {
        drawImagePlaceholder(layer, context, renderConfig.zoom.value);
      }
      break;
    }
    default: {
      if (isTextLayer(layer)) {
        const rtl = isRTL(layer.text);
        const shouldTemporarilyAttach = rtl && !context.canvas.isConnected;
        if (shouldTemporarilyAttach) {
          // to correctly render RTL text mixed with LTR, we have to append it
          // to the DOM
          document.body.appendChild(context.canvas);
        }
        context.canvas.setAttribute("dir", rtl ? "rtl" : "ltr");
        context.save();
        context.font = getFontString(layer);
        context.fillStyle = layer.strokeColor;
        context.textAlign = layer.textAlign as CanvasTextAlign;

        // Canvas does not support multiline text by default
        const lines = layer.text.replace(/\r\n?/g, "\n").split("\n");

        const horizontalOffset =
          layer.textAlign === "center"
            ? layer.width / 2
            : layer.textAlign === "right"
            ? layer.width
            : 0;
        const lineHeightPx = getLineHeightInPx(
          layer.fontSize,
          layer.lineHeight
        );
        const verticalOffset = layer.height - layer.baseline;
        for (let index = 0; index < lines.length; index++) {
          context.fillText(
            lines[index],
            horizontalOffset,
            (index + 1) * lineHeightPx - verticalOffset
          );
        }
        context.restore();
        if (shouldTemporarilyAttach) {
          context.canvas.remove();
        }
      } else {
        throw new Error(`Unimplemented type ${layer.type}`);
      }
    }
  }
  context.globalAlpha = 1;
};

const layerWithCanvasCache = new WeakMap<
  ExcalidrawLayer,
  ExcalidrawLayerWithCanvas
>();

const shapeCache = new WeakMap<ExcalidrawLayer, LayerShape>();

type LayerShape = Drawable | Drawable[] | null;

type LayerShapes = {
  arrow: Drawable[];
  freedraw: Drawable | null;
  image: null;
  line: Drawable[];
  text: null;
};

export const getShapeForLayer = <T extends ExcalidrawLayer>(layer: T) =>
  shapeCache.get(layer) as T["type"] extends keyof LayerShapes
    ? LayerShapes[T["type"]] | undefined
    : Drawable | null | undefined;

export const setShapeForLayer = <T extends ExcalidrawLayer>(
  layer: T,
  shape: T["type"] extends keyof LayerShapes ? LayerShapes[T["type"]] : Drawable
) => shapeCache.set(layer, shape);

export const invalidateShapeForLayer = (layer: ExcalidrawLayer) =>
  shapeCache.delete(layer);

export const generateRoughOptions = (
  layer: ExcalidrawLayer,
  continuousPath = false
): Options => {
  const options: Options = {
    seed: layer.seed,
    strokeLineDash:
      layer.strokeStyle === "dashed"
        ? getDashArrayDashed(layer.strokeWidth)
        : layer.strokeStyle === "dotted"
        ? getDashArrayDotted(layer.strokeWidth)
        : undefined,
    // for non-solid strokes, disable multiStroke because it tends to make
    // dashes/dots overlay each other
    disableMultiStroke: layer.strokeStyle !== "solid",
    // for non-solid strokes, increase the width a bit to make it visually
    // similar to solid strokes, because we're also disabling multiStroke
    strokeWidth:
      layer.strokeStyle !== "solid"
        ? layer.strokeWidth + 0.5
        : layer.strokeWidth,
    // when increasing strokeWidth, we must explicitly set fillWeight and
    // hachureGap because if not specified, roughjs uses strokeWidth to
    // calculate them (and we don't want the fills to be modified)
    fillWeight: layer.strokeWidth / 2,
    hachureGap: layer.strokeWidth * 4,
    roughness: layer.roughness,
    stroke: layer.strokeColor,
    preserveVertices: continuousPath
  };

  switch (layer.type) {
    case "rectangle":
    case "diamond":
    case "ellipse": {
      options.fillStyle = layer.fillStyle;
      options.fill =
        layer.backgroundColor === "transparent"
          ? undefined
          : layer.backgroundColor;
      if (layer.type === "ellipse") {
        options.curveFitting = 1;
      }
      return options;
    }
    case "line":
    case "freedraw": {
      if (isPathALoop(layer.points)) {
        options.fillStyle = layer.fillStyle;
        options.fill =
          layer.backgroundColor === "transparent"
            ? undefined
            : layer.backgroundColor;
      }
      return options;
    }
    case "arrow":
      return options;
    default: {
      throw new Error(`Unimplemented type ${layer.type}`);
    }
  }
};

/**
 * Generates the layer's shape and puts it into the cache.
 * @param layer
 * @param generator
 */
const generateLayerShape = (
  layer: NonDeletedExcalidrawLayer,
  generator: RoughGenerator
) => {
  let shape = shapeCache.get(layer);

  // `null` indicates no rc shape applicable for this layer type
  // (= do not generate anything)
  if (shape === undefined) {
    layerWithCanvasCache.delete(layer);

    switch (layer.type) {
      case "rectangle": {
        if (layer.roundness) {
          const w = layer.width;
          const h = layer.height;
          const r = getCornerRadius(Math.min(w, h), layer);
          shape = generator.path(
            `M ${r} 0 L ${w - r} 0 Q ${w} 0, ${w} ${r} L ${w} ${
              h - r
            } Q ${w} ${h}, ${w - r} ${h} L ${r} ${h} Q 0 ${h}, 0 ${
              h - r
            } L 0 ${r} Q 0 0, ${r} 0`,
            generateRoughOptions(layer, true)
          );
        } else {
          shape = generator.rectangle(
            0,
            0,
            layer.width,
            layer.height,
            generateRoughOptions(layer)
          );
        }
        setShapeForLayer(layer, shape);

        break;
      }
      case "diamond": {
        const [topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY] =
          getDiamondPoints(layer);
        if (layer.roundness) {
          const verticalRadius = getCornerRadius(Math.abs(topX - leftX), layer);

          const horizontalRadius = getCornerRadius(
            Math.abs(rightY - topY),
            layer
          );

          shape = generator.path(
            `M ${topX + verticalRadius} ${topY + horizontalRadius} L ${
              rightX - verticalRadius
            } ${rightY - horizontalRadius}
            C ${rightX} ${rightY}, ${rightX} ${rightY}, ${
              rightX - verticalRadius
            } ${rightY + horizontalRadius}
            L ${bottomX + verticalRadius} ${bottomY - horizontalRadius}
            C ${bottomX} ${bottomY}, ${bottomX} ${bottomY}, ${
              bottomX - verticalRadius
            } ${bottomY - horizontalRadius}
            L ${leftX + verticalRadius} ${leftY + horizontalRadius}
            C ${leftX} ${leftY}, ${leftX} ${leftY}, ${leftX + verticalRadius} ${
              leftY - horizontalRadius
            }
            L ${topX - verticalRadius} ${topY + horizontalRadius}
            C ${topX} ${topY}, ${topX} ${topY}, ${topX + verticalRadius} ${
              topY + horizontalRadius
            }`,
            generateRoughOptions(layer, true)
          );
        } else {
          shape = generator.polygon(
            [
              [topX, topY],
              [rightX, rightY],
              [bottomX, bottomY],
              [leftX, leftY]
            ],
            generateRoughOptions(layer)
          );
        }
        setShapeForLayer(layer, shape);

        break;
      }
      case "ellipse":
        shape = generator.ellipse(
          layer.width / 2,
          layer.height / 2,
          layer.width,
          layer.height,
          generateRoughOptions(layer)
        );
        setShapeForLayer(layer, shape);

        break;
      case "line":
      case "arrow": {
        const options = generateRoughOptions(layer);

        // points array can be empty in the beginning, so it is important to add
        // initial position to it
        const points = layer.points.length ? layer.points : [[0, 0]];

        // curve is always the first layer
        // this simplifies finding the curve for an layer
        if (!layer.roundness) {
          if (options.fill) {
            shape = [generator.polygon(points as [number, number][], options)];
          } else {
            shape = [
              generator.linearPath(points as [number, number][], options)
            ];
          }
        } else {
          shape = [generator.curve(points as [number, number][], options)];
        }

        // add lines only in arrow
        if (layer.type === "arrow") {
          const { startArrowhead = null, endArrowhead = "arrow" } = layer;

          const getArrowheadShapes = (
            layer: ExcalidrawLinearLayer,
            shape: Drawable[],
            position: "start" | "end",
            arrowhead: Arrowhead
          ) => {
            const arrowheadPoints = getArrowheadPoints(
              layer,
              shape,
              position,
              arrowhead
            );

            if (arrowheadPoints === null) {
              return [];
            }

            // Other arrowheads here...
            if (arrowhead === "dot") {
              const [x, y, r] = arrowheadPoints;

              return [
                generator.circle(x, y, r, {
                  ...options,
                  fill: layer.strokeColor,
                  fillStyle: "solid",
                  stroke: "none"
                })
              ];
            }

            if (arrowhead === "triangle") {
              const [x, y, x2, y2, x3, y3] = arrowheadPoints;

              // always use solid stroke for triangle arrowhead
              delete options.strokeLineDash;

              return [
                generator.polygon(
                  [
                    [x, y],
                    [x2, y2],
                    [x3, y3],
                    [x, y]
                  ],
                  {
                    ...options,
                    fill: layer.strokeColor,
                    fillStyle: "solid"
                  }
                )
              ];
            }

            // Arrow arrowheads
            const [x2, y2, x3, y3, x4, y4] = arrowheadPoints;

            if (layer.strokeStyle === "dotted") {
              // for dotted arrows caps, reduce gap to make it more legible
              const dash = getDashArrayDotted(layer.strokeWidth - 1);
              options.strokeLineDash = [dash[0], dash[1] - 1];
            } else {
              // for solid/dashed, keep solid arrow cap
              delete options.strokeLineDash;
            }
            return [
              generator.line(x3, y3, x2, y2, options),
              generator.line(x4, y4, x2, y2, options)
            ];
          };

          if (startArrowhead !== null) {
            const shapes = getArrowheadShapes(
              layer,
              shape,
              "start",
              startArrowhead
            );
            shape.push(...shapes);
          }

          if (endArrowhead !== null) {
            if (endArrowhead === undefined) {
              // Hey, we have an old arrow here!
            }

            const shapes = getArrowheadShapes(
              layer,
              shape,
              "end",
              endArrowhead
            );
            shape.push(...shapes);
          }
        }

        setShapeForLayer(layer, shape);

        break;
      }
      case "freedraw": {
        generateFreeDrawShape(layer);

        if (isPathALoop(layer.points)) {
          // generate rough polygon to fill freedraw shape
          shape = generator.polygon(layer.points as [number, number][], {
            ...generateRoughOptions(layer),
            stroke: "none"
          });
        } else {
          shape = null;
        }
        setShapeForLayer(layer, shape);
        break;
      }
      case "text":
      case "image": {
        // just to ensure we don't regenerate layer.canvas on rerenders
        setShapeForLayer(layer, null);
        break;
      }
    }
  }
};

const generateLayerWithCanvas = (
  layer: NonDeletedExcalidrawLayer,
  renderConfig: RenderConfig
) => {
  const zoom: Zoom = renderConfig ? renderConfig.zoom : defaultAppState.zoom;
  const prevLayerWithCanvas = layerWithCanvasCache.get(layer);
  const shouldRegenerateBecauseZoom =
    prevLayerWithCanvas &&
    prevLayerWithCanvas.zoomValue !== zoom.value &&
    !renderConfig?.shouldCacheIgnoreZoom;
  const boundTextLayerVersion = getBoundTextLayer(layer)?.version || null;
  const containingFrameOpacity = getContainingFrame(layer)?.opacity || 100;

  if (
    !prevLayerWithCanvas ||
    shouldRegenerateBecauseZoom ||
    prevLayerWithCanvas.theme !== renderConfig.theme ||
    prevLayerWithCanvas.boundTextLayerVersion !== boundTextLayerVersion ||
    prevLayerWithCanvas.containingFrameOpacity !== containingFrameOpacity
  ) {
    const layerWithCanvas = generateLayerCanvas(layer, zoom, renderConfig);

    layerWithCanvasCache.set(layer, layerWithCanvas);

    return layerWithCanvas;
  }
  return prevLayerWithCanvas;
};

const drawLayerFromCanvas = (
  layerWithCanvas: ExcalidrawLayerWithCanvas,
  rc: RoughCanvas,
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig
) => {
  const layer = layerWithCanvas.layer;
  const padding = getCanvasPadding(layer);
  const zoom = layerWithCanvas.scale;
  let [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);

  // Free draw layers will otherwise "shuffle" as the min x and y change
  if (isFreeDrawLayer(layer)) {
    x1 = Math.floor(x1);
    x2 = Math.ceil(x2);
    y1 = Math.floor(y1);
    y2 = Math.ceil(y2);
  }

  const cx = ((x1 + x2) / 2 + renderConfig.scrollX) * window.devicePixelRatio;
  const cy = ((y1 + y2) / 2 + renderConfig.scrollY) * window.devicePixelRatio;

  context.save();
  context.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
  const boundTextLayer = getBoundTextLayer(layer);

  if (isArrowLayer(layer) && boundTextLayer) {
    const tempCanvas = document.createLayer("canvas");
    const tempCanvasContext = tempCanvas.getContext("2d")!;

    // Take max dimensions of arrow canvas so that when canvas is rotated
    // the arrow doesn't get clipped
    const maxDim = Math.max(distance(x1, x2), distance(y1, y2));
    tempCanvas.width =
      maxDim * window.devicePixelRatio * zoom +
      padding * layerWithCanvas.scale * 10;
    tempCanvas.height =
      maxDim * window.devicePixelRatio * zoom +
      padding * layerWithCanvas.scale * 10;
    const offsetX = (tempCanvas.width - layerWithCanvas.canvas!.width) / 2;
    const offsetY = (tempCanvas.height - layerWithCanvas.canvas!.height) / 2;

    tempCanvasContext.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCanvasContext.rotate(layer.angle);

    tempCanvasContext.drawImage(
      layerWithCanvas.canvas!,
      -layerWithCanvas.canvas.width / 2,
      -layerWithCanvas.canvas.height / 2,
      layerWithCanvas.canvas.width,
      layerWithCanvas.canvas.height
    );

    const [, , , , boundTextCx, boundTextCy] =
      getLayerAbsoluteCoords(boundTextLayer);

    tempCanvasContext.rotate(-layer.angle);

    // Shift the canvas to the center of the bound text layer
    const shiftX =
      tempCanvas.width / 2 -
      (boundTextCx - x1) * window.devicePixelRatio * zoom -
      offsetX -
      padding * zoom;

    const shiftY =
      tempCanvas.height / 2 -
      (boundTextCy - y1) * window.devicePixelRatio * zoom -
      offsetY -
      padding * zoom;
    tempCanvasContext.translate(-shiftX, -shiftY);

    // Clear the bound text area
    tempCanvasContext.clearRect(
      -(boundTextLayer.width / 2 + BOUND_TEXT_PADDING) *
        window.devicePixelRatio *
        zoom,
      -(boundTextLayer.height / 2 + BOUND_TEXT_PADDING) *
        window.devicePixelRatio *
        zoom,
      (boundTextLayer.width + BOUND_TEXT_PADDING * 2) *
        window.devicePixelRatio *
        zoom,
      (boundTextLayer.height + BOUND_TEXT_PADDING * 2) *
        window.devicePixelRatio *
        zoom
    );

    context.translate(cx, cy);
    context.drawImage(
      tempCanvas,
      (-(x2 - x1) / 2) * window.devicePixelRatio - offsetX / zoom - padding,
      (-(y2 - y1) / 2) * window.devicePixelRatio - offsetY / zoom - padding,
      tempCanvas.width / zoom,
      tempCanvas.height / zoom
    );
  } else {
    // we translate context to layer center so that rotation and scale
    // originates from the layer center
    context.translate(cx, cy);

    context.rotate(layer.angle);

    if (
      "scale" in layerWithCanvas.layer &&
      !isPendingImageLayer(layer, renderConfig)
    ) {
      context.scale(
        layerWithCanvas.layer.scale[0],
        layerWithCanvas.layer.scale[1]
      );
    }

    // revert afterwards we don't have account for it during drawing
    context.translate(-cx, -cy);

    context.drawImage(
      layerWithCanvas.canvas!,
      (x1 + renderConfig.scrollX) * window.devicePixelRatio -
        (padding * layerWithCanvas.scale) / layerWithCanvas.scale,
      (y1 + renderConfig.scrollY) * window.devicePixelRatio -
        (padding * layerWithCanvas.scale) / layerWithCanvas.scale,
      layerWithCanvas.canvas!.width / layerWithCanvas.scale,
      layerWithCanvas.canvas!.height / layerWithCanvas.scale
    );

    if (
      process.env.REACT_APP_DEBUG_ENABLE_TEXT_CONTAINER_BOUNDING_BOX ===
        "true" &&
      hasBoundTextLayer(layer)
    ) {
      const textLayer = getBoundTextLayer(
        layer
      ) as ExcalidrawTextLayerWithContainer;
      const coords = getContainerCoords(layer);
      context.strokeStyle = "#c92a2a";
      context.lineWidth = 3;
      context.strokeRect(
        (coords.x + renderConfig.scrollX) * window.devicePixelRatio,
        (coords.y + renderConfig.scrollY) * window.devicePixelRatio,
        getBoundTextMaxWidth(layer) * window.devicePixelRatio,
        getBoundTextMaxHeight(layer, textLayer) * window.devicePixelRatio
      );
    }
  }
  context.restore();

  // Clear the nested layer we appended to the DOM
};

export const renderLayer = (
  layer: NonDeletedExcalidrawLayer,
  rc: RoughCanvas,
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  appState: AppState
) => {
  const generator = rc.generator;
  switch (layer.type) {
    case "selection": {
      // do not render selection when exporting
      if (!renderConfig.isExporting) {
        context.save();
        context.translate(
          layer.x + renderConfig.scrollX,
          layer.y + renderConfig.scrollY
        );
        context.fillStyle = "rgba(0, 0, 200, 0.04)";

        // render from 0.5px offset  to get 1px wide line
        // https://stackoverflow.com/questions/7530593/html5-canvas-and-line-width/7531540#7531540
        // TODO can be be improved by offseting to the negative when user selects
        // from right to left
        const offset = 0.5 / renderConfig.zoom.value;

        context.fillRect(offset, offset, layer.width, layer.height);
        context.lineWidth = 1 / renderConfig.zoom.value;
        context.strokeStyle = " rgb(105, 101, 219)";
        context.strokeRect(offset, offset, layer.width, layer.height);

        context.restore();
      }
      break;
    }
    case "frame": {
      if (
        !renderConfig.isExporting &&
        appState.frameRendering.enabled &&
        appState.frameRendering.outline
      ) {
        context.save();
        context.translate(
          layer.x + renderConfig.scrollX,
          layer.y + renderConfig.scrollY
        );
        context.fillStyle = "rgba(0, 0, 200, 0.04)";

        context.lineWidth = 2 / renderConfig.zoom.value;
        context.strokeStyle = FRAME_STYLE.strokeColor;

        if (FRAME_STYLE.radius && context.roundRect) {
          context.beginPath();
          context.roundRect(
            0,
            0,
            layer.width,
            layer.height,
            FRAME_STYLE.radius / renderConfig.zoom.value
          );
          context.stroke();
          context.closePath();
        } else {
          context.strokeRect(0, 0, layer.width, layer.height);
        }

        context.restore();
      }
      break;
    }
    case "freedraw": {
      generateLayerShape(layer, generator);

      if (renderConfig.isExporting) {
        const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
        const cx = (x1 + x2) / 2 + renderConfig.scrollX;
        const cy = (y1 + y2) / 2 + renderConfig.scrollY;
        const shiftX = (x2 - x1) / 2 - (layer.x - x1);
        const shiftY = (y2 - y1) / 2 - (layer.y - y1);
        context.save();
        context.translate(cx, cy);
        context.rotate(layer.angle);
        context.translate(-shiftX, -shiftY);
        drawLayerOnCanvas(layer, rc, context, renderConfig);
        context.restore();
      } else {
        const layerWithCanvas = generateLayerWithCanvas(layer, renderConfig);
        drawLayerFromCanvas(layerWithCanvas, rc, context, renderConfig);
      }

      break;
    }
    case "rectangle":
    case "diamond":
    case "ellipse":
    case "line":
    case "arrow":
    case "image":
    case "text": {
      generateLayerShape(layer, generator);
      if (renderConfig.isExporting) {
        const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
        const cx = (x1 + x2) / 2 + renderConfig.scrollX;
        const cy = (y1 + y2) / 2 + renderConfig.scrollY;
        let shiftX = (x2 - x1) / 2 - (layer.x - x1);
        let shiftY = (y2 - y1) / 2 - (layer.y - y1);
        if (isTextLayer(layer)) {
          const container = getContainerLayer(layer);
          if (isArrowLayer(container)) {
            const boundTextCoords = LinearLayerEditor.getBoundTextLayerPosition(
              container,
              layer as ExcalidrawTextLayerWithContainer
            );
            shiftX = (x2 - x1) / 2 - (boundTextCoords.x - x1);
            shiftY = (y2 - y1) / 2 - (boundTextCoords.y - y1);
          }
        }
        context.save();
        context.translate(cx, cy);

        if (shouldResetImageFilter(layer, renderConfig)) {
          context.filter = "none";
        }
        const boundTextLayer = getBoundTextLayer(layer);

        if (isArrowLayer(layer) && boundTextLayer) {
          const tempCanvas = document.createLayer("canvas");

          const tempCanvasContext = tempCanvas.getContext("2d")!;

          // Take max dimensions of arrow canvas so that when canvas is rotated
          // the arrow doesn't get clipped
          const maxDim = Math.max(distance(x1, x2), distance(y1, y2));
          const padding = getCanvasPadding(layer);
          tempCanvas.width =
            maxDim * appState.exportScale + padding * 10 * appState.exportScale;
          tempCanvas.height =
            maxDim * appState.exportScale + padding * 10 * appState.exportScale;

          tempCanvasContext.translate(
            tempCanvas.width / 2,
            tempCanvas.height / 2
          );
          tempCanvasContext.scale(appState.exportScale, appState.exportScale);

          // Shift the canvas to left most point of the arrow
          shiftX = layer.width / 2 - (layer.x - x1);
          shiftY = layer.height / 2 - (layer.y - y1);

          tempCanvasContext.rotate(layer.angle);
          const tempRc = rough.canvas(tempCanvas);

          tempCanvasContext.translate(-shiftX, -shiftY);

          drawLayerOnCanvas(layer, tempRc, tempCanvasContext, renderConfig);

          tempCanvasContext.translate(shiftX, shiftY);

          tempCanvasContext.rotate(-layer.angle);

          // Shift the canvas to center of bound text
          const [, , , , boundTextCx, boundTextCy] =
            getLayerAbsoluteCoords(boundTextLayer);
          const boundTextShiftX = (x1 + x2) / 2 - boundTextCx;
          const boundTextShiftY = (y1 + y2) / 2 - boundTextCy;
          tempCanvasContext.translate(-boundTextShiftX, -boundTextShiftY);

          // Clear the bound text area
          tempCanvasContext.clearRect(
            -boundTextLayer.width / 2,
            -boundTextLayer.height / 2,
            boundTextLayer.width,
            boundTextLayer.height
          );
          context.scale(1 / appState.exportScale, 1 / appState.exportScale);
          context.drawImage(
            tempCanvas,
            -tempCanvas.width / 2,
            -tempCanvas.height / 2,
            tempCanvas.width,
            tempCanvas.height
          );
        } else {
          context.rotate(layer.angle);

          if (layer.type === "image") {
            // note: scale must be applied *after* rotating
            context.scale(layer.scale[0], layer.scale[1]);
          }

          context.translate(-shiftX, -shiftY);
          drawLayerOnCanvas(layer, rc, context, renderConfig);
        }

        context.restore();
        // not exporting → optimized rendering (cache & render from layer
        // canvases)
      } else {
        const layerWithCanvas = generateLayerWithCanvas(layer, renderConfig);

        const currentImageSmoothingStatus = context.imageSmoothingEnabled;

        if (
          // do not disable smoothing during zoom as blurry shapes look better
          // on low resolution (while still zooming in) than sharp ones
          !renderConfig?.shouldCacheIgnoreZoom &&
          // angle is 0 -> always disable smoothing
          (!layer.angle ||
            // or check if angle is a right angle in which case we can still
            // disable smoothing without adversely affecting the result
            isRightAngle(layer.angle))
        ) {
          // Disabling smoothing makes output much sharper, especially for
          // text. Unless for non-right angles, where the aliasing is really
          // terrible on Chromium.
          //
          // Note that `context.imageSmoothingQuality="high"` has almost
          // zero effect.
          //
          context.imageSmoothingEnabled = false;
        }

        drawLayerFromCanvas(layerWithCanvas, rc, context, renderConfig);

        // reset
        context.imageSmoothingEnabled = currentImageSmoothingStatus;
      }
      break;
    }
    default: {
      // @ts-ignore
      throw new Error(`Unimplemented type ${layer.type}`);
    }
  }
};

const roughSVGDrawWithPrecision = (
  rsvg: RoughSVG,
  drawable: Drawable,
  precision?: number
) => {
  if (typeof precision === "undefined") {
    return rsvg.draw(drawable);
  }
  const pshape: Drawable = {
    sets: drawable.sets,
    shape: drawable.shape,
    options: { ...drawable.options, fixedDecimalPlaceDigits: precision }
  };
  return rsvg.draw(pshape);
};

const maybeWrapNodesInFrameClipPath = (
  layer: NonDeletedExcalidrawLayer,
  root: SVGLayer,
  nodes: SVGLayer[],
  exportedFrameId?: string | null
) => {
  const frame = getContainingFrame(layer);
  if (frame && frame.id === exportedFrameId) {
    const g = root.ownerDocument!.createLayerNS(SVG_NS, "g");
    g.setAttributeNS(SVG_NS, "clip-path", `url(#${frame.id})`);
    nodes.forEach((node) => g.appendChild(node));
    return g;
  }

  return null;
};

export const renderLayerToSvg = (
  layer: NonDeletedExcalidrawLayer,
  rsvg: RoughSVG,
  svgRoot: SVGLayer,
  files: BinaryFiles,
  offsetX: number,
  offsetY: number,
  exportWithDarkMode?: boolean,
  exportingFrameId?: string | null
) => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  let cx = (x2 - x1) / 2 - (layer.x - x1);
  let cy = (y2 - y1) / 2 - (layer.y - y1);
  if (isTextLayer(layer)) {
    const container = getContainerLayer(layer);
    if (isArrowLayer(container)) {
      const [x1, y1, x2, y2] = getLayerAbsoluteCoords(container);

      const boundTextCoords = LinearLayerEditor.getBoundTextLayerPosition(
        container,
        layer as ExcalidrawTextLayerWithContainer
      );
      cx = (x2 - x1) / 2 - (boundTextCoords.x - x1);
      cy = (y2 - y1) / 2 - (boundTextCoords.y - y1);
      offsetX = offsetX + boundTextCoords.x - layer.x;
      offsetY = offsetY + boundTextCoords.y - layer.y;
    }
  }
  const degree = (180 * layer.angle) / Math.PI;
  const generator = rsvg.generator;

  // layer to append node to, most of the time svgRoot
  let root = svgRoot;

  // if the layer has a link, create an anchor tag and make that the new root
  if (layer.link) {
    const anchorTag = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "a");
    anchorTag.setAttribute("href", normalizeLink(layer.link));
    root.appendChild(anchorTag);
    root = anchorTag;
  }

  const opacity =
    ((getContainingFrame(layer)?.opacity ?? 100) * layer.opacity) / 10000;

  switch (layer.type) {
    case "selection": {
      // Since this is used only during editing experience, which is canvas based,
      // this should not happen
      throw new Error("Selection rendering is not supported for SVG");
    }
    case "rectangle":
    case "diamond":
    case "ellipse": {
      generateLayerShape(layer, generator);
      const node = roughSVGDrawWithPrecision(
        rsvg,
        getShapeForLayer(layer)!,
        MAX_DECIMALS_FOR_SVG_EXPORT
      );
      if (opacity !== 1) {
        node.setAttribute("stroke-opacity", `${opacity}`);
        node.setAttribute("fill-opacity", `${opacity}`);
      }
      node.setAttribute("stroke-linecap", "round");
      node.setAttribute(
        "transform",
        `translate(${offsetX || 0} ${
          offsetY || 0
        }) rotate(${degree} ${cx} ${cy})`
      );

      const g = maybeWrapNodesInFrameClipPath(
        layer,
        root,
        [node],
        exportingFrameId
      );

      g ? root.appendChild(g) : root.appendChild(node);
      break;
    }
    case "line":
    case "arrow": {
      const boundText = getBoundTextLayer(layer);
      const maskPath = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "mask");
      if (boundText) {
        maskPath.setAttribute("id", `mask-${layer.id}`);
        const maskRectVisible = svgRoot.ownerDocument!.createLayerNS(
          SVG_NS,
          "rect"
        );
        offsetX = offsetX || 0;
        offsetY = offsetY || 0;
        maskRectVisible.setAttribute("x", "0");
        maskRectVisible.setAttribute("y", "0");
        maskRectVisible.setAttribute("fill", "#fff");
        maskRectVisible.setAttribute("width", `${layer.width + 100 + offsetX}`);
        maskRectVisible.setAttribute(
          "height",
          `${layer.height + 100 + offsetY}`
        );

        maskPath.appendChild(maskRectVisible);
        const maskRectInvisible = svgRoot.ownerDocument!.createLayerNS(
          SVG_NS,
          "rect"
        );
        const boundTextCoords = LinearLayerEditor.getBoundTextLayerPosition(
          layer,
          boundText
        );

        const maskX = offsetX + boundTextCoords.x - layer.x;
        const maskY = offsetY + boundTextCoords.y - layer.y;

        maskRectInvisible.setAttribute("x", maskX.toString());
        maskRectInvisible.setAttribute("y", maskY.toString());
        maskRectInvisible.setAttribute("fill", "#000");
        maskRectInvisible.setAttribute("width", `${boundText.width}`);
        maskRectInvisible.setAttribute("height", `${boundText.height}`);
        maskRectInvisible.setAttribute("opacity", "1");
        maskPath.appendChild(maskRectInvisible);
      }
      generateLayerShape(layer, generator);
      const group = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "g");
      if (boundText) {
        group.setAttribute("mask", `url(#mask-${layer.id})`);
      }
      group.setAttribute("stroke-linecap", "round");

      getShapeForLayer(layer)!.forEach((shape) => {
        const node = roughSVGDrawWithPrecision(
          rsvg,
          shape,
          MAX_DECIMALS_FOR_SVG_EXPORT
        );
        if (opacity !== 1) {
          node.setAttribute("stroke-opacity", `${opacity}`);
          node.setAttribute("fill-opacity", `${opacity}`);
        }
        node.setAttribute(
          "transform",
          `translate(${offsetX || 0} ${
            offsetY || 0
          }) rotate(${degree} ${cx} ${cy})`
        );
        if (
          layer.type === "line" &&
          isPathALoop(layer.points) &&
          layer.backgroundColor !== "transparent"
        ) {
          node.setAttribute("fill-rule", "evenodd");
        }
        group.appendChild(node);
      });

      const g = maybeWrapNodesInFrameClipPath(
        layer,
        root,
        [group, maskPath],
        exportingFrameId
      );
      if (g) {
        root.appendChild(g);
      } else {
        root.appendChild(group);
        root.append(maskPath);
      }
      break;
    }
    case "freedraw": {
      generateLayerShape(layer, generator);
      generateFreeDrawShape(layer);
      const shape = getShapeForLayer(layer);
      const node = shape
        ? roughSVGDrawWithPrecision(rsvg, shape, MAX_DECIMALS_FOR_SVG_EXPORT)
        : svgRoot.ownerDocument!.createLayerNS(SVG_NS, "g");
      if (opacity !== 1) {
        node.setAttribute("stroke-opacity", `${opacity}`);
        node.setAttribute("fill-opacity", `${opacity}`);
      }
      node.setAttribute(
        "transform",
        `translate(${offsetX || 0} ${
          offsetY || 0
        }) rotate(${degree} ${cx} ${cy})`
      );
      node.setAttribute("stroke", "none");
      const path = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "path");
      path.setAttribute("fill", layer.strokeColor);
      path.setAttribute("d", getFreeDrawSvgPath(layer));
      node.appendChild(path);

      const g = maybeWrapNodesInFrameClipPath(
        layer,
        root,
        [node],
        exportingFrameId
      );

      g ? root.appendChild(g) : root.appendChild(node);
      break;
    }
    case "image": {
      const width = Math.round(layer.width);
      const height = Math.round(layer.height);
      const fileData = isInitializedImageLayer(layer) && files[layer.fileId];
      if (fileData) {
        const symbolId = `image-${fileData.id}`;
        let symbol = svgRoot.querySelector(`#${symbolId}`);
        if (!symbol) {
          symbol = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "symbol");
          symbol.id = symbolId;

          const image = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "image");

          image.setAttribute("width", "100%");
          image.setAttribute("height", "100%");
          image.setAttribute("href", fileData.dataURL);

          symbol.appendChild(image);

          root.prepend(symbol);
        }

        const use = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "use");
        use.setAttribute("href", `#${symbolId}`);

        // in dark theme, revert the image color filter
        if (exportWithDarkMode && fileData.mimeType !== MIME_TYPES.svg) {
          use.setAttribute("filter", IMAGE_INVERT_FILTER);
        }

        use.setAttribute("width", `${width}`);
        use.setAttribute("height", `${height}`);
        use.setAttribute("opacity", `${opacity}`);

        // We first apply `scale` transforms (horizontal/vertical mirroring)
        // on the <use> layer, then apply translation and rotation
        // on the <g> layer which wraps the <use>.
        // Doing this separately is a quick hack to to work around compositing
        // the transformations correctly (the transform-origin was not being
        // applied correctly).
        if (layer.scale[0] !== 1 || layer.scale[1] !== 1) {
          const translateX = layer.scale[0] !== 1 ? -width : 0;
          const translateY = layer.scale[1] !== 1 ? -height : 0;
          use.setAttribute(
            "transform",
            `scale(${layer.scale[0]}, ${layer.scale[1]}) translate(${translateX} ${translateY})`
          );
        }

        const g = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "g");
        g.appendChild(use);
        g.setAttribute(
          "transform",
          `translate(${offsetX || 0} ${
            offsetY || 0
          }) rotate(${degree} ${cx} ${cy})`
        );

        const clipG = maybeWrapNodesInFrameClipPath(
          layer,
          root,
          [g],
          exportingFrameId
        );
        clipG ? root.appendChild(clipG) : root.appendChild(g);
      }
      break;
    }
    // frames are not rendered and only acts as a container
    case "frame": {
      break;
    }
    default: {
      if (isTextLayer(layer)) {
        const node = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "g");
        if (opacity !== 1) {
          node.setAttribute("stroke-opacity", `${opacity}`);
          node.setAttribute("fill-opacity", `${opacity}`);
        }

        node.setAttribute(
          "transform",
          `translate(${offsetX || 0} ${
            offsetY || 0
          }) rotate(${degree} ${cx} ${cy})`
        );
        const lines = layer.text.replace(/\r\n?/g, "\n").split("\n");
        const lineHeightPx = getLineHeightInPx(
          layer.fontSize,
          layer.lineHeight
        );
        const horizontalOffset =
          layer.textAlign === "center"
            ? layer.width / 2
            : layer.textAlign === "right"
            ? layer.width
            : 0;
        const direction = isRTL(layer.text) ? "rtl" : "ltr";
        const textAnchor =
          layer.textAlign === "center"
            ? "middle"
            : layer.textAlign === "right" || direction === "rtl"
            ? "end"
            : "start";
        for (let i = 0; i < lines.length; i++) {
          const text = svgRoot.ownerDocument!.createLayerNS(SVG_NS, "text");
          text.textContent = lines[i];
          text.setAttribute("x", `${horizontalOffset}`);
          text.setAttribute("y", `${i * lineHeightPx}`);
          text.setAttribute("font-family", getFontFamilyString(layer));
          text.setAttribute("font-size", `${layer.fontSize}px`);
          text.setAttribute("fill", layer.strokeColor);
          text.setAttribute("text-anchor", textAnchor);
          text.setAttribute("style", "white-space: pre;");
          text.setAttribute("direction", direction);
          text.setAttribute("dominant-baseline", "text-before-edge");
          node.appendChild(text);
        }

        const g = maybeWrapNodesInFrameClipPath(
          layer,
          root,
          [node],
          exportingFrameId
        );

        g ? root.appendChild(g) : root.appendChild(node);
      } else {
        // @ts-ignore
        throw new Error(`Unimplemented type ${layer.type}`);
      }
    }
  }
};

export const pathsCache = new WeakMap<ExcalidrawFreeDrawLayer, Path2D>([]);

export const generateFreeDrawShape = (layer: ExcalidrawFreeDrawLayer) => {
  const svgPathData = getFreeDrawSvgPath(layer);
  const path = new Path2D(svgPathData);
  pathsCache.set(layer, path);
  return path;
};

export const getFreeDrawPath2D = (layer: ExcalidrawFreeDrawLayer) =>
  pathsCache.get(layer);

export const getFreeDrawSvgPath = (layer: ExcalidrawFreeDrawLayer) => {
  // If input points are empty (should they ever be?) return a dot
  const inputPoints = layer.simulatePressure
    ? layer.points
    : layer.points.length
    ? layer.points.map(([x, y], i) => [x, y, layer.pressures[i]])
    : [[0, 0, 0.5]];

  // Consider changing the options for simulated pressure vs real pressure
  const options: StrokeOptions = {
    simulatePressure: layer.simulatePressure,
    size: layer.strokeWidth * 4.25,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => Math.sin((t * Math.PI) / 2), // https://easings.net/#easeOutSine
    last: !!layer.lastCommittedPoint // LastCommittedPoint is added on pointerup
  };

  return getSvgPathFromStroke(getStroke(inputPoints as number[][], options));
};

const med = (A: number[], B: number[]) => [
  (A[0] + B[0]) / 2,
  (A[1] + B[1]) / 2
];

// Trim SVG path data so number are each two decimal points. This
// improves SVG exports, and prevents rendering errors on points
// with long decimals.
const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;

const getSvgPathFromStroke = (points: number[][]): string => {
  if (!points.length) {
    return "";
  }

  const max = points.length - 1;

  return points
    .reduce(
      (acc, point, i, arr) => {
        if (i === max) {
          acc.push(point, med(point, arr[0]), "L", arr[0], "Z");
        } else {
          acc.push(point, med(point, arr[i + 1]));
        }
        return acc;
      },
      ["M", points[0], "Q"]
    )
    .join(" ")
    .replace(TO_FIXED_PRECISION, "$1");
};
