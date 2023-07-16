import { isSafari } from "@storiny/shared/src/browsers";

import { LayerType, TextAlign, VerticalAlign } from "../../constants";
import { BOUND_TEXT_PADDING } from "../../constants/new";
import {
  Layer,
  NonDeletedLayer,
  TextLayer,
  TextLayerWithContainer
} from "../../types";
import { getLayerAbsoluteCoords } from "../layer";
import { getSelectedLayers } from "../scene";
import Scene from "../scene/Scene";
import { AppState } from "../types";
import { ExtractSetType } from "../utility-types";
import { arrayToMap, getFontString, isTestEnv } from "../utils";
import { LinearLayerEditor } from "./LinearLayerEditor";
import { mutateLayer } from "./mutate";
import { isArrowLayer, isTextLayer } from "./predicates";
import {
  resetOriginalContainerCache,
  updateOriginalContainerCache
} from "./textWysiwyg";
import { MaybeTransformHandleType } from "./transformHandles";

/**
 * Normalizes text string
 * @param text Text string
 */
export const normalizeText = (text: string): string =>
  text
    // Replace tabs with spaces so they render and measure correctly
    .replace(/\t/g, "        ")
    // Normalize newlines
    .replace(/\r?\n|\r/g, "\n");

/**
 * Splits text at line breaks
 * @param text Text string
 */
export const splitIntoLines = (text: string): string[] =>
  normalizeText(text).split("\n");

/**
 * Redraws text bound box
 * @param textLayer Text layer
 * @param container Container layer
 */
export const redrawTextBoundingBox = (
  textLayer: TextLayer,
  container: Layer | null
): void => {
  let maxWidth = undefined;

  const boundTextUpdates = {
    x: textLayer.x,
    y: textLayer.y,
    text: textLayer.text,
    width: textLayer.width,
    height: textLayer.height,
    baseline: textLayer.baseline
  };

  boundTextUpdates.text = textLayer.text;

  if (container) {
    maxWidth = getBoundTextMaxWidth(container);
    boundTextUpdates.text = wrapText(
      textLayer.originalText,
      getFontString(textLayer),
      maxWidth
    );
  }

  const metrics = measureText(
    boundTextUpdates.text,
    getFontString(textLayer),
    textLayer.lineHeight
  );

  boundTextUpdates.width = metrics.width;
  boundTextUpdates.height = metrics.height;
  boundTextUpdates.baseline = metrics.baseline;

  if (container) {
    const containerDims = getContainerDims(container);
    const maxContainerHeight = getBoundTextMaxHeight(
      container,
      textLayer as TextLayerWithContainer
    );
    let nextHeight = containerDims.height;

    if (metrics.height > maxContainerHeight) {
      nextHeight = computeContainerDimensionForBoundText(
        metrics.height,
        container.type
      );
      mutateLayer(container, { height: nextHeight });
      updateOriginalContainerCache(container.id, nextHeight);
    }

    const updatedTextLayer = {
      ...textLayer,
      ...boundTextUpdates
    } as TextLayerWithContainer;
    const { x, y } = computeBoundTextPosition(container, updatedTextLayer);

    boundTextUpdates.x = x;
    boundTextUpdates.y = y;
  }

  mutateLayer(textLayer, boundTextUpdates);
};

/**
 * Binds text to shape after layer duplication
 * @param sceneLayers Scene layers
 * @param oldLayers Old layers
 * @param oldIdToDuplicatedId Old layer id to duplicate id map
 */
export const bindTextToShapeAfterDuplication = (
  sceneLayers: Layer[],
  oldLayers: Layer[],
  oldIdToDuplicatedId: Map<Layer["id"], Layer["id"]>
): void => {
  const sceneLayerMap = arrayToMap(sceneLayers) as Map<Layer["id"], Layer>;

  oldLayers.forEach((layer) => {
    const newLayerId = oldIdToDuplicatedId.get(layer.id) as string;
    const boundTextLayerId = getBoundTextLayerId(layer);

    if (boundTextLayerId) {
      const newTextLayerId = oldIdToDuplicatedId.get(boundTextLayerId);
      if (newTextLayerId) {
        const newContainer = sceneLayerMap.get(newLayerId);

        if (newContainer) {
          mutateLayer(newContainer, {
            boundLayers: (layer.boundLayers || [])
              .filter(
                (boundLayer) =>
                  boundLayer.id !== newTextLayerId &&
                  boundLayer.id !== boundTextLayerId
              )
              .concat({
                type: LayerType.TEXT,
                id: newTextLayerId
              })
          });
        }

        const newTextLayer = sceneLayerMap.get(newTextLayerId);

        if (newTextLayer && isTextLayer(newTextLayer)) {
          mutateLayer(newTextLayer, {
            containerId: newContainer ? newLayerId : null
          });
        }
      }
    }
  });
};

/**
 * Text resize binding handler
 * @param container Container layer
 * @param transformHandleType Transform handle type
 */
export const handleBindTextResize = (
  container: NonDeletedLayer,
  transformHandleType: MaybeTransformHandleType
): void => {
  const boundTextLayerId = getBoundTextLayerId(container);

  if (!boundTextLayerId) {
    return;
  }

  resetOriginalContainerCache(container.id);

  let textLayer = Scene.getScene(container)!.getLayer(
    boundTextLayerId
  ) as TextLayer;

  if (textLayer && textLayer.text) {
    if (!container) {
      return;
    }

    textLayer = Scene.getScene(container)!.getLayer(
      boundTextLayerId
    ) as TextLayer;
    let text = textLayer.text;
    let nextHeight = textLayer.height;
    let nextWidth = textLayer.width;
    const containerDims = getContainerDims(container);
    const maxWidth = getBoundTextMaxWidth(container);
    const maxHeight = getBoundTextMaxHeight(
      container,
      textLayer as TextLayerWithContainer
    );
    let containerHeight = containerDims.height;
    let nextBaseLine = textLayer.baseline;

    if (transformHandleType !== "n" && transformHandleType !== "s") {
      if (text) {
        text = wrapText(
          textLayer.originalText,
          getFontString(textLayer),
          maxWidth
        );
      }

      const metrics = measureText(
        text,
        getFontString(textLayer),
        textLayer.lineHeight
      );
      nextHeight = metrics.height;
      nextWidth = metrics.width;
      nextBaseLine = metrics.baseline;
    }

    // Increase height in case text layer height exceeds
    if (nextHeight > maxHeight) {
      containerHeight = computeContainerDimensionForBoundText(
        nextHeight,
        container.type
      );

      const diff = containerHeight - containerDims.height;
      // Fix the y coord when resizing from ne / nw / n
      const updatedY =
        !isArrowLayer(container) &&
        (transformHandleType === "ne" ||
          transformHandleType === "nw" ||
          transformHandleType === "n")
          ? container.y - diff
          : container.y;

      mutateLayer(container, {
        height: containerHeight,
        y: updatedY
      });
    }

    mutateLayer(textLayer, {
      text,
      width: nextWidth,
      height: nextHeight,
      baseline: nextBaseLine
    });

    if (!isArrowLayer(container)) {
      mutateLayer(
        textLayer,
        computeBoundTextPosition(container, textLayer as TextLayerWithContainer)
      );
    }
  }
};

/**
 * Computes bound text position
 * @param container Container layer
 * @param boundTextLayer Contained text layer
 */
export const computeBoundTextPosition = (
  container: Layer,
  boundTextLayer: TextLayerWithContainer
): { x: number; y: number } => {
  if (isArrowLayer(container)) {
    return LinearLayerEditor.getBoundTextLayerPosition(
      container,
      boundTextLayer
    );
  }

  const containerCoords = getContainerCoords(container);
  const maxContainerHeight = getBoundTextMaxHeight(container, boundTextLayer);
  const maxContainerWidth = getBoundTextMaxWidth(container);
  let x: number;
  let y: number;

  if (boundTextLayer.verticalAlign === VerticalAlign.TOP) {
    y = containerCoords.y;
  } else if (boundTextLayer.verticalAlign === VerticalAlign.BOTTOM) {
    y = containerCoords.y + (maxContainerHeight - boundTextLayer.height);
  } else {
    y =
      containerCoords.y + (maxContainerHeight / 2 - boundTextLayer.height / 2);
  }

  if (boundTextLayer.textAlign === TextAlign.LEFT) {
    x = containerCoords.x;
  } else if (boundTextLayer.textAlign === TextAlign.RIGHT) {
    x = containerCoords.x + (maxContainerWidth - boundTextLayer.width);
  } else {
    x = containerCoords.x + (maxContainerWidth / 2 - boundTextLayer.width / 2);
  }

  return { x, y };
};

/**
 * Measures text dimensions
 * @see https://github.com/grassator/canvas-text-editor/blob/master/lib/FontMetrics.js
 * @param text Text
 * @param font Font family
 * @param lineHeight Line height
 */
export const measureText = (
  text: string,
  font: string,
  lineHeight: TextLayer["lineHeight"]
): { baseline: number; height: number; width: number } => {
  text = text
    .split("\n")
    // Replace empty lines with single space because leading / trailing empty
    // lines would be stripped from computation
    .map((x) => x || " ")
    .join("\n");

  const fontSize = parseFloat(font);
  const height = getTextHeight(text, fontSize, lineHeight);
  const width = getTextWidth(text, font);
  const baseline = measureBaseline(text, font, lineHeight);

  return { width, height, baseline };
};

/**
 * Measures text baseline
 * @param text Text
 * @param font Font family
 * @param lineHeight Line height
 * @param wrapInContainer Whether to wrap text inside a container
 */
export const measureBaseline = (
  text: string,
  font: string,
  lineHeight: TextLayer["lineHeight"],
  wrapInContainer?: boolean
): number => {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.whiteSpace = "pre";
  container.style.font = font;
  container.style.minHeight = "1em";

  if (wrapInContainer) {
    container.style.overflow = "hidden";
    container.style.wordBreak = "break-word";
    container.style.whiteSpace = "pre-wrap";
  }

  container.style.lineHeight = String(lineHeight);
  container.innerText = text;

  // Baseline is important for positioning text on canvas
  document.body.appendChild(container);

  const span = document.createElement("span");

  span.style.display = "inline-block";
  span.style.overflow = "hidden";
  span.style.width = "1px";
  span.style.height = "1px";

  container.appendChild(span);

  let baseline = span.offsetTop + span.offsetHeight;
  const height = container.offsetHeight;

  if (isSafari) {
    const canvasHeight = getTextHeight(text, parseFloat(font), lineHeight);
    const fontSize = parseFloat(font);
    // In Safari, the font size gets rounded off when rendering, hence calculating the safari height and shifting the baseline if it differs
    // from the actual canvas height
    const domHeight = getTextHeight(text, Math.round(fontSize), lineHeight);

    if (canvasHeight > height) {
      baseline += canvasHeight - domHeight;
    }

    if (height > canvasHeight) {
      baseline -= domHeight - canvasHeight;
    }
  }

  document.body.removeChild(container);

  return baseline;
};

/**
 * Returns the unitless line-height (if unknown) by dividing height-per-line
 * by fontSize
 * @param textLayer Text layer
 */
export const detectLineHeight = (textLayer: TextLayer): number =>
  (textLayer.height /
    splitIntoLines(textLayer.text).length /
    textLayer.fontSize) as TextLayer["lineHeight"];

/**
 * We calculate the line height from the font size and the unitless line height,
 * aligning with the W3C spec.
 */

/**
 * Returns the line height from the font size and the unitless line height,
 * aligning with the W3C spec
 * @param fontSize Font size
 * @param lineHeight Line height
 */
export const getLineHeightInPx = (
  fontSize: TextLayer["fontSize"],
  lineHeight: TextLayer["lineHeight"]
): number => fontSize * lineHeight;

/**
 * Returns the approximate minimum container height for text
 * @param fontSize Font size
 * @param lineHeight Line height
 */
export const getApproxMinContainerHeight = (
  fontSize: TextLayer["fontSize"],
  lineHeight: TextLayer["lineHeight"]
): number => getLineHeightInPx(fontSize, lineHeight) + BOUND_TEXT_PADDING * 2;

let canvas: HTMLCanvasElement | undefined;

/**
 * Returns the width occupied by a single line of the specified text
 * @param text Text string
 * @param font Font family
 */
const getLineWidth = (text: string, font: string): number => {
  if (!canvas) {
    canvas = document.createElement("canvas");
  }

  const canvas2dContext = canvas.getContext("2d")!;
  canvas2dContext.font = font;
  const width = canvas2dContext.measureText(text).width;

  // Since in testing environment, the canvas measureText algorithm
  // doesn't measure text and instead just returns number of
  // characters hence we assume that each letter is 10px wide
  if (isTestEnv()) {
    return width * 10;
  }

  return width;
};

/**
 * Returns the total width occupied by the text
 * @param text Text string
 * @param font Font family
 */
export const getTextWidth = (text: string, font: string): number => {
  const lines = splitIntoLines(text);
  let width = 0;

  lines.forEach((line) => {
    width = Math.max(width, getLineWidth(line, font));
  });

  return width;
};

export const getTextHeight = (
  text: string,
  fontSize: number,
  lineHeight: TextLayer["lineHeight"]
) => {
  const lineCount = splitIntoLines(text).length;
  return getLineHeightInPx(fontSize, lineHeight) * lineCount;
};

export const parseTokens = (text: string) => {
  // Splitting words containing "-" as those are treated as separate words
  // by css wrapping algorithm eg non-profit => non-, profit
  const words = text.split("-");
  if (words.length > 1) {
    // non-proft org => ['non-', 'profit org']
    words.forEach((word, index) => {
      if (index !== words.length - 1) {
        words[index] = word += "-";
      }
    });
  }
  // Joining the words with space and splitting them again with space to get the
  // final list of tokens
  // ['non-', 'profit org'] =>,'non- proft org' => ['non-','profit','org']
  return words.join(" ").split(" ");
};

export const wrapText = (text: string, font: FontString, maxWidth: number) => {
  // if maxWidth is not finite or NaN which can happen in case of bugs in
  // computation, we need to make sure we don't continue as we'll end up
  // in an infinite loop
  if (!Number.isFinite(maxWidth) || maxWidth < 0) {
    return text;
  }

  const lines: Array<string> = [];
  const originalLines = text.split("\n");
  const spaceWidth = getLineWidth(" ", font);

  let currentLine = "";
  let currentLineWidthTillNow = 0;

  const push = (str: string) => {
    if (str.trim()) {
      lines.push(str);
    }
  };

  const resetParams = () => {
    currentLine = "";
    currentLineWidthTillNow = 0;
  };
  originalLines.forEach((originalLine) => {
    const currentLineWidth = getTextWidth(originalLine, font);

    // Push the line if its <= maxWidth
    if (currentLineWidth <= maxWidth) {
      lines.push(originalLine);
      return; // continue
    }

    const words = parseTokens(originalLine);
    resetParams();

    let index = 0;

    while (index < words.length) {
      const currentWordWidth = getLineWidth(words[index], font);

      // This will only happen when single word takes entire width
      if (currentWordWidth === maxWidth) {
        push(words[index]);
        index++;
      }

      // Start breaking longer words exceeding max width
      else if (currentWordWidth > maxWidth) {
        // push current line since the current word exceeds the max width
        // so will be appended in next line

        push(currentLine);

        resetParams();

        while (words[index].length > 0) {
          const currentChar = String.fromCodePoint(
            words[index].codePointAt(0)!
          );
          const width = charWidth.calculate(currentChar, font);
          currentLineWidthTillNow += width;
          words[index] = words[index].slice(currentChar.length);

          if (currentLineWidthTillNow >= maxWidth) {
            push(currentLine);
            currentLine = currentChar;
            currentLineWidthTillNow = width;
          } else {
            currentLine += currentChar;
          }
        }
        // push current line if appending space exceeds max width
        if (currentLineWidthTillNow + spaceWidth >= maxWidth) {
          push(currentLine);
          resetParams();
          // space needs to be appended before next word
          // as currentLine contains chars which couldn't be appended
          // to previous line unless the line ends with hyphen to sync
          // with css word-wrap
        } else if (!currentLine.endsWith("-")) {
          currentLine += " ";
          currentLineWidthTillNow += spaceWidth;
        }
        index++;
      } else {
        // Start appending words in a line till max width reached
        while (currentLineWidthTillNow < maxWidth && index < words.length) {
          const word = words[index];
          currentLineWidthTillNow = getLineWidth(currentLine + word, font);

          if (currentLineWidthTillNow > maxWidth) {
            push(currentLine);
            resetParams();

            break;
          }
          index++;

          // if word ends with "-" then we don't need to add space
          // to sync with css word-wrap
          const shouldAppendSpace = !word.endsWith("-");
          currentLine += word;

          if (shouldAppendSpace) {
            currentLine += " ";
          }

          // Push the word if appending space exceeds max width
          if (currentLineWidthTillNow + spaceWidth >= maxWidth) {
            if (shouldAppendSpace) {
              lines.push(currentLine.slice(0, -1));
            } else {
              lines.push(currentLine);
            }
            resetParams();
            break;
          }
        }
      }
    }
    if (currentLine.slice(-1) === " ") {
      // only remove last trailing space which we have added when joining words
      currentLine = currentLine.slice(0, -1);
      push(currentLine);
    }
  });
  return lines.join("\n");
};

export const charWidth = (() => {
  const cachedCharWidth: { [key: FontString]: Array<number> } = {};

  const calculate = (char: string, font: FontString) => {
    const ascii = char.charCodeAt(0);
    if (!cachedCharWidth[font]) {
      cachedCharWidth[font] = [];
    }
    if (!cachedCharWidth[font][ascii]) {
      const width = getLineWidth(char, font);
      cachedCharWidth[font][ascii] = width;
    }

    return cachedCharWidth[font][ascii];
  };

  const getCache = (font: FontString) => cachedCharWidth[font];
  return {
    calculate,
    getCache
  };
})();

const DUMMY_TEXT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".toLocaleUpperCase();

// FIXME rename to getApproxMinContainerWidth
export const getApproxMinLineWidth = (
  font: FontString,
  lineHeight: ExcalidrawTextLayer["lineHeight"]
) => {
  const maxCharWidth = getMaxCharWidth(font);
  if (maxCharWidth === 0) {
    return (
      measureText(DUMMY_TEXT.split("").join("\n"), font, lineHeight).width +
      BOUND_TEXT_PADDING * 2
    );
  }
  return maxCharWidth + BOUND_TEXT_PADDING * 2;
};

export const getMinCharWidth = (font: FontString) => {
  const cache = charWidth.getCache(font);
  if (!cache) {
    return 0;
  }
  const cacheWithOutEmpty = cache.filter((val) => val !== undefined);

  return Math.min(...cacheWithOutEmpty);
};

export const getMaxCharWidth = (font: FontString) => {
  const cache = charWidth.getCache(font);
  if (!cache) {
    return 0;
  }
  const cacheWithOutEmpty = cache.filter((val) => val !== undefined);
  return Math.max(...cacheWithOutEmpty);
};

export const getApproxCharsToFitInWidth = (font: FontString, width: number) => {
  // Generally lower case is used so converting to lower case
  const dummyText = DUMMY_TEXT.toLocaleLowerCase();
  const batchLength = 6;
  let index = 0;
  let widthTillNow = 0;
  let str = "";
  while (widthTillNow <= width) {
    const batch = dummyText.substr(index, index + batchLength);
    str += batch;
    widthTillNow += getLineWidth(str, font);
    if (index === dummyText.length - 1) {
      index = 0;
    }
    index = index + batchLength;
  }

  while (widthTillNow > width) {
    str = str.substr(0, str.length - 1);
    widthTillNow = getLineWidth(str, font);
  }
  return str.length;
};

export const getBoundTextLayerId = (container: ExcalidrawLayer | null) =>
  container?.boundLayers?.length
    ? container?.boundLayers?.filter((ele) => ele.type === "text")[0]?.id ||
      null
    : null;

export const getBoundTextLayer = (layer: ExcalidrawLayer | null) => {
  if (!layer) {
    return null;
  }
  const boundTextLayerId = getBoundTextLayerId(layer);
  if (boundTextLayerId) {
    return (
      (Scene.getScene(layer)?.getLayer(
        boundTextLayerId
      ) as ExcalidrawTextLayerWithContainer) || null
    );
  }
  return null;
};

export const getContainerLayer = (
  layer:
    | (ExcalidrawLayer & {
        containerId: ExcalidrawLayer["id"] | null;
      })
    | null
) => {
  if (!layer) {
    return null;
  }
  if (layer.containerId) {
    return Scene.getScene(layer)?.getLayer(layer.containerId) || null;
  }
  return null;
};

export const getContainerDims = (layer: ExcalidrawLayer) => {
  const MIN_WIDTH = 300;
  if (isArrowLayer(layer)) {
    const width = Math.max(layer.width, MIN_WIDTH);
    const height = layer.height;
    return { width, height };
  }
  return { width: layer.width, height: layer.height };
};

export const getContainerCenter = (
  container: ExcalidrawLayer,
  appState: AppState
) => {
  if (!isArrowLayer(container)) {
    return {
      x: container.x + container.width / 2,
      y: container.y + container.height / 2
    };
  }
  const points = LinearLayerEditor.getPointsGlobalCoordinates(container);
  if (points.length % 2 === 1) {
    const index = Math.floor(container.points.length / 2);
    const midPoint = LinearLayerEditor.getPointGlobalCoordinates(
      container,
      container.points[index]
    );
    return { x: midPoint[0], y: midPoint[1] };
  }
  const index = container.points.length / 2 - 1;
  let midSegmentMidpoint = LinearLayerEditor.getEditorMidPoints(
    container,
    appState
  )[index];
  if (!midSegmentMidpoint) {
    midSegmentMidpoint = LinearLayerEditor.getSegmentMidPoint(
      container,
      points[index],
      points[index + 1],
      index + 1
    );
  }
  return { x: midSegmentMidpoint[0], y: midSegmentMidpoint[1] };
};

export const getContainerCoords = (container: NonDeletedExcalidrawLayer) => {
  let offsetX = BOUND_TEXT_PADDING;
  let offsetY = BOUND_TEXT_PADDING;

  if (container.type === "ellipse") {
    // The derivation of coordinates is explained in https://github.com/excalidraw/excalidraw/pull/6172
    offsetX += (container.width / 2) * (1 - Math.sqrt(2) / 2);
    offsetY += (container.height / 2) * (1 - Math.sqrt(2) / 2);
  }
  // The derivation of coordinates is explained in https://github.com/excalidraw/excalidraw/pull/6265
  if (container.type === "diamond") {
    offsetX += container.width / 4;
    offsetY += container.height / 4;
  }
  return {
    x: container.x + offsetX,
    y: container.y + offsetY
  };
};

export const getTextLayerAngle = (textLayer: ExcalidrawTextLayer) => {
  const container = getContainerLayer(textLayer);
  if (!container || isArrowLayer(container)) {
    return textLayer.angle;
  }
  return container.angle;
};

export const getBoundTextLayerOffset = (
  boundTextLayer: ExcalidrawTextLayer | null
) => {
  const container = getContainerLayer(boundTextLayer);
  if (!container || !boundTextLayer) {
    return 0;
  }
  if (isArrowLayer(container)) {
    return BOUND_TEXT_PADDING * 8;
  }

  return BOUND_TEXT_PADDING;
};

export const getBoundTextLayerPosition = (
  container: ExcalidrawLayer,
  boundTextLayer: ExcalidrawTextLayerWithContainer
) => {
  if (isArrowLayer(container)) {
    return LinearLayerEditor.getBoundTextLayerPosition(
      container,
      boundTextLayer
    );
  }
};

export const shouldAllowVerticalAlign = (
  selectedLayers: NonDeletedExcalidrawLayer[]
) =>
  selectedLayers.some((layer) => {
    const hasBoundContainer = isBoundToContainer(layer);
    if (hasBoundContainer) {
      const container = getContainerLayer(layer);
      if (isTextLayer(layer) && isArrowLayer(container)) {
        return false;
      }
      return true;
    }
    return false;
  });

export const suppportsHorizontalAlign = (
  selectedLayers: NonDeletedExcalidrawLayer[]
) =>
  selectedLayers.some((layer) => {
    const hasBoundContainer = isBoundToContainer(layer);
    if (hasBoundContainer) {
      const container = getContainerLayer(layer);
      if (isTextLayer(layer) && isArrowLayer(container)) {
        return false;
      }
      return true;
    }

    return isTextLayer(layer);
  });

export const getTextBindableContainerAtPosition = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState,
  x: number,
  y: number
): ExcalidrawTextContainer | null => {
  const selectedLayers = getSelectedLayers(layers, appState);
  if (selectedLayers.length === 1) {
    return isTextBindableContainer(selectedLayers[0], false)
      ? selectedLayers[0]
      : null;
  }
  let hitLayer = null;
  // We need to to hit testing from front (end of the array) to back (beginning of the array)
  for (let index = layers.length - 1; index >= 0; --index) {
    if (layers[index].isDeleted) {
      continue;
    }
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layers[index]);
    if (
      isArrowLayer(layers[index]) &&
      isHittingLayerNotConsideringBoundingBox(layers[index], appState, null, [
        x,
        y
      ])
    ) {
      hitLayer = layers[index];
      break;
    } else if (x1 < x && x < x2 && y1 < y && y < y2) {
      hitLayer = layers[index];
      break;
    }
  }

  return isTextBindableContainer(hitLayer, false) ? hitLayer : null;
};

const VALID_CONTAINER_TYPES = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "arrow"
]);

export const isValidTextContainer = (layer: ExcalidrawLayer) =>
  VALID_CONTAINER_TYPES.has(layer.type);

export const computeContainerDimensionForBoundText = (
  dimension: number,
  containerType: ExtractSetType<typeof VALID_CONTAINER_TYPES>
) => {
  dimension = Math.ceil(dimension);
  const padding = BOUND_TEXT_PADDING * 2;

  if (containerType === "ellipse") {
    return Math.round(((dimension + padding) / Math.sqrt(2)) * 2);
  }
  if (containerType === "arrow") {
    return dimension + padding * 8;
  }
  if (containerType === "diamond") {
    return 2 * (dimension + padding);
  }
  return dimension + padding;
};

export const getBoundTextMaxWidth = (container: ExcalidrawLayer) => {
  const width = getContainerDims(container).width;
  if (isArrowLayer(container)) {
    return width - BOUND_TEXT_PADDING * 8 * 2;
  }

  if (container.type === "ellipse") {
    // The width of the largest rectangle inscribed inside an ellipse is
    // Math.round((ellipse.width / 2) * Math.sqrt(2)) which is derived from
    // equation of an ellipse -https://github.com/excalidraw/excalidraw/pull/6172
    return Math.round((width / 2) * Math.sqrt(2)) - BOUND_TEXT_PADDING * 2;
  }
  if (container.type === "diamond") {
    // The width of the largest rectangle inscribed inside a rhombus is
    // Math.round(width / 2) - https://github.com/excalidraw/excalidraw/pull/6265
    return Math.round(width / 2) - BOUND_TEXT_PADDING * 2;
  }
  return width - BOUND_TEXT_PADDING * 2;
};

export const getBoundTextMaxHeight = (
  container: ExcalidrawLayer,
  boundTextLayer: ExcalidrawTextLayerWithContainer
) => {
  const height = getContainerDims(container).height;
  if (isArrowLayer(container)) {
    const containerHeight = height - BOUND_TEXT_PADDING * 8 * 2;
    if (containerHeight <= 0) {
      return boundTextLayer.height;
    }
    return height;
  }
  if (container.type === "ellipse") {
    // The height of the largest rectangle inscribed inside an ellipse is
    // Math.round((ellipse.height / 2) * Math.sqrt(2)) which is derived from
    // equation of an ellipse - https://github.com/excalidraw/excalidraw/pull/6172
    return Math.round((height / 2) * Math.sqrt(2)) - BOUND_TEXT_PADDING * 2;
  }
  if (container.type === "diamond") {
    // The height of the largest rectangle inscribed inside a rhombus is
    // Math.round(height / 2) - https://github.com/excalidraw/excalidraw/pull/6265
    return Math.round(height / 2) - BOUND_TEXT_PADDING * 2;
  }
  return height - BOUND_TEXT_PADDING * 2;
};

export const isMeasureTextSupported = () => {
  const width = getTextWidth(
    DUMMY_TEXT,
    getFontString({
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: DEFAULT_FONT_FAMILY
    })
  );
  return width > 0;
};

/**
 * Unitless line height
 *
 * In previous versions we used `normal` line height, which browsers interpret
 * differently, and based on font-family and font-size.
 *
 * To make line heights consistent across browsers we hardcode the values for
 * each of our fonts based on most common average line-heights.
 * See https://github.com/excalidraw/excalidraw/pull/6360#issuecomment-1477635971
 * where the values come from.
 */
const DEFAULT_LINE_HEIGHT = {
  // ~1.25 is the average for Virgil in WebKit and Blink.
  // Gecko (FF) uses ~1.28.
  [FONT_FAMILY.Virgil]: 1.25 as ExcalidrawTextLayer["lineHeight"],
  // ~1.15 is the average for Virgil in WebKit and Blink.
  // Gecko if all over the place.
  [FONT_FAMILY.Helvetica]: 1.15 as ExcalidrawTextLayer["lineHeight"],
  // ~1.2 is the average for Virgil in WebKit and Blink, and kinda Gecko too
  [FONT_FAMILY.Cascadia]: 1.2 as ExcalidrawTextLayer["lineHeight"]
};

export const getDefaultLineHeight = (fontFamily: FontFamilyValues) => {
  if (fontFamily in DEFAULT_LINE_HEIGHT) {
    return DEFAULT_LINE_HEIGHT[fontFamily];
  }
  return DEFAULT_LINE_HEIGHT[DEFAULT_FONT_FAMILY];
};
