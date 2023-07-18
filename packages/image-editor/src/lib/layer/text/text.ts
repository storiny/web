import { isSafari } from "@storiny/shared/src/browsers";
import { isTestEnv } from "@storiny/shared/src/utils/isTestEnv";
import { ExtractSetType } from "@storiny/types";

import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  LayerType,
  TextAlign,
  VerticalAlign
} from "../../../constants";
import { BOUND_TEXT_PADDING } from "../../../constants/new";
import {
  EditorState,
  Layer,
  NonDeletedLayer,
  TextLayer,
  TextLayerWithContainer
} from "../../../types";
import { getSelectedLayers, Scene } from "../../scene";
import { arrayToMap, getFontString } from "../../utils";
import { isHittingLayerNotConsideringBoundingBox } from "../collision";
import {
  getLayerAbsoluteCoords,
  resetOriginalContainerCache,
  updateOriginalContainerCache
} from "../index";
import { LinearLayerEditor } from "../linearLayerEditor";
import { mutateLayer } from "../mutate";
import {
  isArrowLayer,
  isBoundToContainer,
  isTextBindableContainer,
  isTextLayer
} from "../predicates";
import { MaybeTransformHandleType } from "../transformHandles";

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

/**
 * Returns the total height occupied by the text
 * @param text Text string
 * @param fontSize Font family
 * @param lineHeight Line height
 */
export const getTextHeight = (
  text: string,
  fontSize: number,
  lineHeight: TextLayer["lineHeight"]
): number =>
  getLineHeightInPx(fontSize, lineHeight) * splitIntoLines(text).length;

/**
 * Parses tokens in text
 * @param text Text string
 */
export const parseTokens = (text: string): string[] => {
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

/**
 * Wraps text string under the specified maximum width
 * @param text Text string
 * @param font Font family
 * @param maxWidth Maximum text width
 */
export const wrapText = (
  text: string,
  font: string,
  maxWidth: number
): string => {
  // If `maxWidth` is not finite or NaN which can happen in case of bugs in
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

  const push = (str: string): void => {
    if (str.trim()) {
      lines.push(str);
    }
  };

  const resetParams = (): void => {
    currentLine = "";
    currentLineWidthTillNow = 0;
  };

  originalLines.forEach((originalLine) => {
    const currentLineWidth = getTextWidth(originalLine, font);

    // Push the line if its <= maxWidth
    if (currentLineWidth <= maxWidth) {
      lines.push(originalLine);
      return;
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
        // Push the current line since the current word exceeds the max width
        // so will be appended in the next line

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

        // Push current line if appending space exceeds max width
        if (currentLineWidthTillNow + spaceWidth >= maxWidth) {
          push(currentLine);
          resetParams();
          // Space needs to be appended before the next word
          // as `currentLine` contains chars which couldn't be appended
          // to the previous line unless the line ends with hyphen to sync
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

          // If word ends with "-" then we don't need to add space
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
      // Only remove last trailing space which we have added when joining words
      currentLine = currentLine.slice(0, -1);
      push(currentLine);
    }
  });

  return lines.join("\n");
};

/**
 * Cached char width util
 */
export const charWidth = ((): {
  calculate: (char: string, font: string) => number;
  getCache: (font: string) => number[];
} => {
  const cachedCharWidth: { [key: string]: Array<number> } = {};

  const calculate = (char: string, font: string): number => {
    const ascii = char.charCodeAt(0);

    if (!cachedCharWidth[font]) {
      cachedCharWidth[font] = [];
    }

    if (!cachedCharWidth[font][ascii]) {
      cachedCharWidth[font][ascii] = getLineWidth(char, font);
    }

    return cachedCharWidth[font][ascii];
  };

  const getCache = (font: string): number[] => cachedCharWidth[font];

  return {
    calculate,
    getCache
  };
})();

const DUMMY_TEXT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".toLocaleUpperCase();

/**
 * Returns the approximate minimum container width for text
 * @param font Font family
 * @param lineHeight Line height
 */
export const getApproxMinContainerWidth = (
  font: string,
  lineHeight: TextLayer["lineHeight"]
): number => {
  const maxCharWidth = getMaxCharWidth(font);

  if (maxCharWidth === 0) {
    return (
      measureText(DUMMY_TEXT.split("").join("\n"), font, lineHeight).width +
      BOUND_TEXT_PADDING * 2
    );
  }

  return maxCharWidth + BOUND_TEXT_PADDING * 2;
};

/**
 * Returns the minimum width occupied by a single character
 * @param font Font family
 */
export const getMinCharWidth = (font: string): number => {
  const cache = charWidth.getCache(font);

  if (!cache) {
    return 0;
  }

  const cacheWithOutEmpty = cache.filter((val) => val !== undefined);

  return Math.min(...cacheWithOutEmpty);
};

/**
 * Reeturns the maximum width occupied by a single character
 * @param font Font family
 */
export const getMaxCharWidth = (font: string): number => {
  const cache = charWidth.getCache(font);

  if (!cache) {
    return 0;
  }

  const cacheWithOutEmpty = cache.filter((val) => val !== undefined);

  return Math.max(...cacheWithOutEmpty);
};

/**
 * Returns the approximate number of characters that could fit in the
 * specified width
 * @param font Font family
 * @param width Maximum width
 */
export const getApproxCharsToFitInWidth = (
  font: string,
  width: number
): number => {
  // Lower case is generally used
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

/**
 * Returns the bound text layer ID
 * @param container Container layer
 */
export const getBoundTextLayerId = (container: Layer | null): string | null =>
  container?.boundLayers?.length
    ? container?.boundLayers?.filter(({ type }) => type === LayerType.TEXT)[0]
        ?.id || null
    : null;

/**
 * Returns the bounded text layer
 * @param layer Layer
 */
export const getBoundTextLayer = (
  layer: Layer | null
): TextLayerWithContainer | null => {
  if (!layer) {
    return null;
  }

  const boundTextLayerId = getBoundTextLayerId(layer);

  if (boundTextLayerId) {
    return (
      (Scene.getScene(layer)?.getLayer(
        boundTextLayerId
      ) as TextLayerWithContainer) || null
    );
  }

  return null;
};

/**
 * Returns the container layer
 * @param layer Layer
 */
export const getContainerLayer = (
  layer:
    | (Layer & {
        containerId: Layer["id"] | null;
      })
    | null
): Layer | null => {
  if (!layer) {
    return null;
  }

  if (layer.containerId) {
    return Scene.getScene(layer)?.getLayer(layer.containerId) || null;
  }

  return null;
};

/**
 * Returns the dimensions of the container layer
 * @param layer Layer
 */
export const getContainerDims = (
  layer: Layer
): { height: number; width: number } => {
  const MIN_WIDTH = 300;

  if (isArrowLayer(layer)) {
    const width = Math.max(layer.width, MIN_WIDTH);
    const height = layer.height;
    return { width, height };
  }

  return { width: layer.width, height: layer.height };
};

/**
 * Returns the center coordinates of a container layer
 * @param container Container layer
 * @param editorState Editor state
 */
export const getContainerCenter = (
  container: Layer,
  editorState: EditorState
): { x: number; y: number } => {
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
    editorState
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

/**
 * Returns the coordinates of the container layer
 * @param container Container layer
 */
export const getContainerCoords = (
  container: NonDeletedLayer
): { x: number; y: number } => {
  let offsetX = BOUND_TEXT_PADDING;
  let offsetY = BOUND_TEXT_PADDING;

  if (container.type === LayerType.ELLIPSE) {
    // See https://math.stackexchange.com/questions/240192/find-the-area-of-largest-rectangle-that-can-be-inscribed-in-an-ellipse/240201#240201
    offsetX += (container.width / 2) * (1 - Math.sqrt(2) / 2);
    offsetY += (container.height / 2) * (1 - Math.sqrt(2) / 2);
  }

  if (container.type === LayerType.DIAMOND) {
    offsetX += container.width / 4;
    offsetY += container.height / 4;
  }

  return {
    x: container.x + offsetX,
    y: container.y + offsetY
  };
};

/**
 * Returns the angle of a text layer
 * @param textLayer Text layer
 */
export const getTextLayerAngle = (textLayer: TextLayer): number => {
  const container = getContainerLayer(textLayer);

  if (!container || isArrowLayer(container)) {
    return textLayer.angle;
  }

  return container.angle;
};

/**
 * Returns text layer offset
 * @param boundTextLayer Text layer
 */
export const getBoundTextLayerOffset = (
  boundTextLayer: TextLayer | null
): number => {
  const container = getContainerLayer(boundTextLayer);

  if (!container || !boundTextLayer) {
    return 0;
  }

  if (isArrowLayer(container)) {
    return BOUND_TEXT_PADDING * 8;
  }

  return BOUND_TEXT_PADDING;
};

/**
 * Returns text layer position
 * @param container Layer
 * @param boundTextLayer Contained text layer
 */
export const getBoundTextLayerPosition = (
  container: Layer,
  boundTextLayer: TextLayerWithContainer
): { x: number; y: number } | undefined => {
  if (isArrowLayer(container)) {
    return LinearLayerEditor.getBoundTextLayerPosition(
      container,
      boundTextLayer
    );
  }
};

/**
 * Predicate function for determining whether to allow vertical align
 * @param selectedLayers Selected layers
 */
export const shouldAllowVerticalAlign = (
  selectedLayers: NonDeletedLayer[]
): boolean =>
  selectedLayers.some((layer) => {
    const hasBoundContainer = isBoundToContainer(layer);

    if (hasBoundContainer) {
      const container = getContainerLayer(layer);
      return !(isTextLayer(layer) && isArrowLayer(container));
    }

    return false;
  });

/**
 * Predicate function for checking horizontal align support
 * @param selectedLayers Selected layes
 */
export const suppportsHorizontalAlign = (
  selectedLayers: NonDeletedLayer[]
): boolean =>
  selectedLayers.some((layer) => {
    const hasBoundContainer = isBoundToContainer(layer);

    if (hasBoundContainer) {
      const container = getContainerLayer(layer);
      return !(isTextLayer(layer) && isArrowLayer(container));
    }

    return isTextLayer(layer);
  });

/**
 * Returns the text-bindable container at the specified position
 * @param layers Layers
 * @param editorState Editor state
 * @param x X position
 * @param y Y position
 */
export const getTextBindableContainerAtPosition = (
  layers: readonly Layer[],
  editorState: EditorState,
  x: number,
  y: number
): Layer | null => {
  const selectedLayers = getSelectedLayers(layers, editorState);

  if (selectedLayers.length === 1) {
    return isTextBindableContainer(selectedLayers[0], false)
      ? selectedLayers[0]
      : null;
  }

  let hitLayer = null;

  // We need to hit testing from front (end of the array) to back (beginning of the array)
  for (let index = layers.length - 1; index >= 0; --index) {
    if (layers[index].isDeleted) {
      continue;
    }

    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layers[index]);

    if (
      isArrowLayer(layers[index]) &&
      isHittingLayerNotConsideringBoundingBox(layers[index], editorState, [
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
  LayerType.RECTANGLE,
  LayerType.ELLIPSE,
  LayerType.DIAMOND,
  LayerType.ARROW
]);

/**
 * Predicate function for determining value text container layers
 * @param layer Layer
 */
export const isValidTextContainer = (layer: Layer): boolean =>
  VALID_CONTAINER_TYPES.has(layer.type);

/**
 * Computes container dimensions for bound text
 * @param dimension Dimension
 * @param containerType Container type
 */
export const computeContainerDimensionForBoundText = (
  dimension: number,
  containerType: ExtractSetType<typeof VALID_CONTAINER_TYPES>
): number => {
  dimension = Math.ceil(dimension);
  const padding = BOUND_TEXT_PADDING * 2;

  if (containerType === LayerType.ELLIPSE) {
    return Math.round(((dimension + padding) / Math.sqrt(2)) * 2);
  }

  if (containerType === LayerType.ARROW) {
    return dimension + padding * 8;
  }

  if (containerType === LayerType.DIAMOND) {
    return 2 * (dimension + padding);
  }

  return dimension + padding;
};

/**
 * Returns the max width for bound text inside the specified layer
 * @param container Container layer
 */
export const getBoundTextMaxWidth = (container: Layer): number => {
  const width = getContainerDims(container).width;

  if (isArrowLayer(container)) {
    return width - BOUND_TEXT_PADDING * 8 * 2;
  }

  if (container.type === LayerType.ELLIPSE) {
    // The width of the largest rectangle inscribed inside an ellipse is
    // Math.round((ellipse.width / 2) * Math.sqrt(2)) which is derived from
    // equation of an ellipse
    // See https://math.stackexchange.com/questions/240192/find-the-area-of-largest-rectangle-that-can-be-inscribed-in-an-ellipse/240201#240201
    return Math.round((width / 2) * Math.sqrt(2)) - BOUND_TEXT_PADDING * 2;
  }

  if (container.type === LayerType.DIAMOND) {
    // The width of the largest rectangle inscribed inside a rhombus is
    // Math.round(width / 2)
    return Math.round(width / 2) - BOUND_TEXT_PADDING * 2;
  }

  return width - BOUND_TEXT_PADDING * 2;
};

/**
 * Returns the max height for bound text inside the specified layer
 * @param container Container layer
 * @param boundTextLayer Bound text layer
 */
export const getBoundTextMaxHeight = (
  container: Layer,
  boundTextLayer: TextLayerWithContainer
): number => {
  const height = getContainerDims(container).height;

  if (isArrowLayer(container)) {
    const containerHeight = height - BOUND_TEXT_PADDING * 8 * 2;

    if (containerHeight <= 0) {
      return boundTextLayer.height;
    }

    return height;
  }

  if (container.type === LayerType.ELLIPSE) {
    // The height of the largest rectangle inscribed inside an ellipse is
    // Math.round((ellipse.height / 2) * Math.sqrt(2)) which is derived from
    // equation of an ellipse
    // See https://math.stackexchange.com/questions/240192/find-the-area-of-largest-rectangle-that-can-be-inscribed-in-an-ellipse/240201#240201
    return Math.round((height / 2) * Math.sqrt(2)) - BOUND_TEXT_PADDING * 2;
  }

  if (container.type === LayerType.DIAMOND) {
    // The height of the largest rectangle inscribed inside a rhombus is
    // Math.round(height / 2)
    return Math.round(height / 2) - BOUND_TEXT_PADDING * 2;
  }

  return height - BOUND_TEXT_PADDING * 2;
};

/**
 * Predicate function for determining whether text measurement is supported
 */
export const isMeasureTextSupported = (): boolean => {
  const width = getTextWidth(
    DUMMY_TEXT,
    getFontString({
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: DEFAULT_FONT_FAMILY
    })
  );

  return width > 0;
};
