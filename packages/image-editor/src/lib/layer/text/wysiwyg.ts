import { isSafari } from "@storiny/shared/src/browsers";
import { isTestEnv } from "@storiny/shared/src/utils/isTestEnv";

import { KeyCode, KEYS, LayerType } from "../../../constants";
import {
  EditorState,
  Layer,
  LinearLayer,
  TextContainerLayer,
  TextLayer,
  TextLayerWithContainer
} from "../../../types";
import { Scene } from "../../scene";
import {
  getFontFamilyString,
  getFontString,
  isWritableElement
} from "../../utils";
import { actionZoomIn, actionZoomOut } from "../actions/actionCanvas";
import {
  actionDecreaseFontSize,
  actionIncreaseFontSize
} from "../actions/actionProperties";
import { parseClipboard } from "../clipboard";
import App from "../components/App";
import { LinearLayerEditor } from "../linearLayerEditor";
import { mutateLayer } from "../mutate";
import { isArrowLayer, isBoundToContainer, isTextLayer } from "../predicates";
import {
  computeBoundTextPosition,
  computeContainerDimensionForBoundText,
  detectLineHeight,
  getBoundTextLayerId,
  getBoundTextMaxHeight,
  getBoundTextMaxWidth,
  getContainerDims,
  getContainerLayer,
  getTextLayerAngle,
  getTextWidth,
  normalizeText,
  redrawTextBoundingBox,
  wrapText
} from "./text";

const TAB_SIZE = 4;
const TAB = " ".repeat(TAB_SIZE);
const RE_LEADING_TAB = new RegExp(`^ {1,${TAB_SIZE}}`);

/**
 * Returns transform value
 * @param width Width
 * @param height Height
 * @param angle Angle
 * @param editorState Editor state
 * @param maxWidth Max width
 * @param maxHeight Max height
 */
const getTransform = (
  width: number,
  height: number,
  angle: number,
  editorState: EditorState,
  maxWidth: number,
  maxHeight: number
): string => {
  const { zoom } = editorState;
  const degree = (180 * angle) / Math.PI;
  let translateX = (width * (zoom.value - 1)) / 2;
  let translateY = (height * (zoom.value - 1)) / 2;

  if (width > maxWidth && zoom.value !== 1) {
    translateX = (maxWidth * (zoom.value - 1)) / 2;
  }

  if (height > maxHeight && zoom.value !== 1) {
    translateY = (maxHeight * (zoom.value - 1)) / 2;
  }

  return `translate(${translateX}px, ${translateY}px) scale(${zoom.value}) rotate(${degree}deg)`;
};

const originalContainerCache: {
  [id: TextContainerLayer["id"]]:
    | {
        height: TextContainerLayer["height"];
      }
    | undefined;
} = {};

/**
 * Updates container cache
 * @param id Container layer ID
 * @param height Container height
 */
export const updateOriginalContainerCache = (
  id: TextContainerLayer["id"],
  height: TextContainerLayer["height"]
): { height: TextContainerLayer["height"] } => {
  const data =
    originalContainerCache[id] || (originalContainerCache[id] = { height });
  data.height = height;

  return data;
};

/**
 * Resets container cache
 * @param id Container layer ID to reset
 */
export const resetOriginalContainerCache = (
  id: TextContainerLayer["id"]
): void => {
  if (originalContainerCache[id]) {
    delete originalContainerCache[id];
  }
};

/**
 * Returns container height from cache if it exists, null otherwise
 * @param id Container layer ID
 */
export const getOriginalContainerHeightFromCache = (
  id: TextContainerLayer["id"]
): number | null => originalContainerCache[id]?.height ?? null;

export const wysiwyg = ({
  id,
  onChange,
  onSubmit,
  getViewportCoords,
  layer,
  canvas,
  editorContainer,
  app
}: {
  app: App;
  canvas: HTMLCanvasElement | null;
  editorContainer: HTMLDivElement | null;
  getViewportCoords: (x: number, y: number) => [number, number];
  id: Layer["id"];
  layer: TextLayer;
  onChange?: (text: string) => void;
  onSubmit: (data: {
    originalText: string;
    text: string;
    viaKeyboard: boolean;
  }) => void;
}): void => {
  /**
   * Predicate function for determining text properties updates
   * @param updatedTextLayer Updated text layer
   * @param editable Editable element
   */
  const textPropertiesUpdated = (
    updatedTextLayer: TextLayer,
    editable: HTMLTextAreaElement
  ): boolean => {
    if (!editable.style.fontFamily || !editable.style.fontSize) {
      return false;
    }

    const currentFont = editable.style.fontFamily.replace(/"/g, "");

    if (getFontFamilyString(updatedTextLayer.fontFamily) !== currentFont) {
      return true;
    }

    return `${updatedTextLayer.fontSize}px` !== editable.style.fontSize;
  };

  const updateWysiwygStyle = (): void => {
    const editorState = app.state;
    const updatedTextLayer = Scene.getScene(layer)?.getLayer<TextLayer>(id);

    if (!updatedTextLayer) {
      return;
    }

    const { textAlign, verticalAlign } = updatedTextLayer;

    if (updatedTextLayer && isTextLayer(updatedTextLayer)) {
      let coordX = updatedTextLayer.x;
      let coordY = updatedTextLayer.y;
      const container = getContainerLayer(updatedTextLayer);
      let maxWidth = updatedTextLayer.width;
      let maxHeight = updatedTextLayer.height;
      let textLayerWidth = updatedTextLayer.width;
      // Set to layer height by default since that's
      // what is going to be used for unbounded text
      const textLayerHeight = updatedTextLayer.height;

      if (container && updatedTextLayer.containerId) {
        if (isArrowLayer(container)) {
          const boundTextCoords = LinearLayerEditor.getBoundTextLayerPosition(
            container,
            updatedTextLayer as TextLayerWithContainer
          );

          coordX = boundTextCoords.x;
          coordY = boundTextCoords.y;
        }

        const propertiesUpdated = textPropertiesUpdated(
          updatedTextLayer,
          editable
        );
        const containerDims = getContainerDims(container);
        let originalContainerData;

        if (propertiesUpdated) {
          originalContainerData = updateOriginalContainerCache(
            container.id,
            containerDims.height
          );
        } else {
          originalContainerData = originalContainerCache[container.id];
          if (!originalContainerData) {
            originalContainerData = updateOriginalContainerCache(
              container.id,
              containerDims.height
            );
          }
        }

        maxWidth = getBoundTextMaxWidth(container);
        maxHeight = getBoundTextMaxHeight(
          container,
          updatedTextLayer as TextLayerWithContainer
        );

        // Outgrow container height if text size exceeds
        if (!isArrowLayer(container) && textLayerHeight > maxHeight) {
          const targetContainerHeight = computeContainerDimensionForBoundText(
            textLayerHeight,
            container.type
          );

          mutateLayer(container, { height: targetContainerHeight });
          return;
        } else if (
          // Outoshrink container height until the original container height
          // is reached when the text is removed
          !isArrowLayer(container) &&
          containerDims.height > originalContainerData.height &&
          textLayerHeight < maxHeight
        ) {
          const targetContainerHeight = computeContainerDimensionForBoundText(
            textLayerHeight,
            container.type
          );

          mutateLayer(container, { height: targetContainerHeight });
        } else {
          const { y } = computeBoundTextPosition(
            container,
            updatedTextLayer as TextLayerWithContainer
          );

          coordY = y;
        }
      }

      const [viewportX, viewportY] = getViewportCoords(coordX, coordY);
      const initialSelectionStart = editable.selectionStart;
      const initialSelectionEnd = editable.selectionEnd;
      const initialLength = editable.value.length;

      // Restore cursor position after the value is updated, so it doesn't
      // jump to the end of text when the container has expanded
      if (
        initialSelectionStart === initialSelectionEnd &&
        initialSelectionEnd !== initialLength
      ) {
        // Get diff between length and selection end and shift
        // the cursor by "diff" times to position correctly
        const diff = initialLength - initialSelectionEnd;
        editable.selectionStart = editable.value.length - diff;
        editable.selectionEnd = editable.value.length - diff;
      }

      if (!container) {
        maxWidth = (editorState.width - 8 - viewportX) / editorState.zoom.value;
        textLayerWidth = Math.min(textLayerWidth, maxWidth);
      } else {
        textLayerWidth += 0.5;
      }

      let lineHeight = updatedTextLayer.lineHeight;

      // In Safari, the font size gets rounded off when rendering hence
      // calculating the line height by rounding off the font size
      if (isSafari) {
        lineHeight = detectLineHeight({
          ...updatedTextLayer,
          fontSize: Math.round(updatedTextLayer.fontSize)
        });
      }

      // Make sure text editor height doesn't go beyond viewport
      const editorMaxHeight =
        (editorState.height - viewportY) / editorState.zoom.value;

      Object.assign(editable.style, {
        font: getFontString(updatedTextLayer),
        // Must be defined after font to avoid overriding
        lineHeight,
        width: `${textLayerWidth}px`,
        height: `${textLayerHeight}px`,
        left: `${viewportX}px`,
        top: `${viewportY}px`,
        transform: getTransform(
          textLayerWidth,
          textLayerHeight,
          getTextLayerAngle(updatedTextLayer),
          editorState,
          maxWidth,
          editorMaxHeight
        ),
        textAlign,
        verticalAlign,
        color: updatedTextLayer.strokeColor,
        opacity: updatedTextLayer.opacity / 100,
        filter: "var(--theme-filter)",
        maxHeight: `${editorMaxHeight}px`
      });

      editable.scrollTop = 0;

      // For some reason, updating font attribute doesn't set the font family,
      // hence updating the font family explicitly for testing environment
      if (isTestEnv()) {
        editable.style.fontFamily = getFontFamilyString(
          updatedTextLayer.fontFamily
        );
      }

      mutateLayer(updatedTextLayer, { x: coordX, y: coordY });
    }
  };

  const editable = document.createElement("textarea");

  editable.dir = "auto";
  editable.tabIndex = 0;
  editable.dataset.type = "wysiwyg";
  // Prevent line wrapping on Safari
  editable.wrap = "off";
  editable.classList.add("excalidraw-wysiwyg");

  let whiteSpace = "pre";
  let wordBreak = "normal";

  if (isBoundToContainer(layer)) {
    whiteSpace = "pre-wrap";
    wordBreak = "break-word";
  }

  Object.assign(editable.style, {
    position: "absolute",
    display: "inline-block",
    minHeight: "1em",
    backfaceVisibility: "hidden",
    margin: 0,
    padding: 0,
    border: 0,
    outline: 0,
    resize: "none",
    background: "transparent",
    overflow: "hidden",
    // Override canvas stacking context
    zIndex: "var(--zIndex-wysiwyg)",
    wordBreak,
    // Prevent line wrapping (`whitespace: nowrap` doesn't work on Firefox)
    whiteSpace,
    overflowWrap: "break-word",
    boxSizing: "content-box"
  });

  editable.value = layer.originalText;

  updateWysiwygStyle();

  if (onChange) {
    editable.onpaste = async (event): Promise<void> => {
      const clipboardData = await parseClipboard(event, true);

      if (!clipboardData.text) {
        return;
      }

      const data = normalizeText(clipboardData.text);

      if (!data) {
        return;
      }

      const container = getContainerLayer(layer);

      const font = getFontString({
        fontSize: app.state.currentItemFontSize,
        fontFamily: app.state.currentItemFontFamily
      });

      if (container) {
        const wrappedText = wrapText(
          `${editable.value}${data}`,
          font,
          getBoundTextMaxWidth(container)
        );

        const width = getTextWidth(wrappedText, font);
        editable.style.width = `${width}px`;
      }
    };

    editable.oninput = (): void => {
      onChange(normalizeText(editable.value));
    };
  }

  editable.onkeydown = (event): void => {
    if (!event.shiftKey && actionZoomIn.keyTest(event)) {
      event.preventDefault();
      app.actionManager.executeAction(actionZoomIn);

      updateWysiwygStyle();
    } else if (!event.shiftKey && actionZoomOut.keyTest(event)) {
      event.preventDefault();
      app.actionManager.executeAction(actionZoomOut);

      updateWysiwygStyle();
    } else if (actionDecreaseFontSize.keyTest(event)) {
      app.actionManager.executeAction(actionDecreaseFontSize);
    } else if (actionIncreaseFontSize.keyTest(event)) {
      app.actionManager.executeAction(actionIncreaseFontSize);
    } else if (event.key === KEYS.ESCAPE) {
      event.preventDefault();
      submittedViaKeyboard = true;

      handleSubmit();
    } else if (event.key === KEYS.ENTER && event[KEYS.CTRL_OR_CMD]) {
      event.preventDefault();

      if (event.isComposing || event.keyCode === 229) {
        return;
      }

      submittedViaKeyboard = true;

      handleSubmit();
    } else if (
      event.key === KEYS.TAB ||
      (event[KEYS.CTRL_OR_CMD] &&
        (event.code === KeyCode.BRACKET_LEFT ||
          event.code === KeyCode.BRACKET_RIGHT))
    ) {
      event.preventDefault();

      if (event.isComposing) {
        return;
      } else if (event.shiftKey || event.code === KeyCode.BRACKET_LEFT) {
        outdent();
      } else {
        indent();
      }

      // We must send an input event to resize the layer
      editable.dispatchEvent(new Event("input"));
    }
  };

  /**
   * Indets
   */
  const indent = (): void => {
    const { selectionStart, selectionEnd } = editable;
    const linesStartIndices = getSelectedLinesStartIndices();
    let value = editable.value;

    linesStartIndices.forEach((startIndex: number) => {
      const startValue = value.slice(0, startIndex);
      const endValue = value.slice(startIndex);

      value = `${startValue}${TAB}${endValue}`;
    });

    editable.value = value;
    editable.selectionStart = selectionStart + TAB_SIZE;
    editable.selectionEnd = selectionEnd + TAB_SIZE * linesStartIndices.length;
  };

  /**
   * Outdents
   */
  const outdent = (): void => {
    const { selectionStart, selectionEnd } = editable;
    const linesStartIndices = getSelectedLinesStartIndices();
    const removedTabs: number[] = [];
    let value = editable.value;

    linesStartIndices.forEach((startIndex) => {
      const tabMatch = value
        .slice(startIndex, startIndex + TAB_SIZE)
        .match(RE_LEADING_TAB);

      if (tabMatch) {
        const startValue = value.slice(0, startIndex);
        const endValue = value.slice(startIndex + tabMatch[0].length);

        // Delete a tab from the line
        value = `${startValue}${endValue}`;
        removedTabs.push(startIndex);
      }
    });

    editable.value = value;

    if (removedTabs.length) {
      if (selectionStart > removedTabs[removedTabs.length - 1]) {
        editable.selectionStart = Math.max(
          selectionStart - TAB_SIZE,
          removedTabs[removedTabs.length - 1]
        );
      } else {
        // If the cursor is before the first tab removed, ex:
        // Line #1
        //     Line #2
        // Line #3
        // We should reset the `selectionStart` to his initial value
        editable.selectionStart = selectionStart;
      }

      editable.selectionEnd = Math.max(
        editable.selectionStart,
        selectionEnd - TAB_SIZE * removedTabs.length
      );
    }
  };

  /**
   * Returns the indices of start positions of selected lines, in reverse order
   */
  const getSelectedLinesStartIndices = (): number[] => {
    let { selectionStart, selectionEnd, value } = editable;
    // Chars before `selectionStart` on the same line
    const startOffset = value.slice(0, selectionStart).match(/[^\n]*$/)![0]
      .length;
    // Put caret at the start of the line
    selectionStart = selectionStart - startOffset;
    const selected = value.slice(selectionStart, selectionEnd);

    return selected
      .split("\n")
      .reduce(
        (startIndices, line, idx, lines) =>
          startIndices.concat(
            idx
              ? // Current line index is previous line's start + previous line's length + \n
                startIndices[idx - 1] + lines[idx - 1].length + 1
              : // First selected line
                selectionStart
          ),
        [] as number[]
      )
      .reverse();
  };

  /**
   * Stop the event
   * @param event Event
   */
  const stopEvent = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Using a state variable instead of passing it to the `handleSubmit` callback
  // so that we don't need to create a separate callback for event handlers
  let submittedViaKeyboard = false;

  /**
   * Submit handler
   */
  const handleSubmit = (): void => {
    // Cleanup must be run before onSubmit otherwise when the editor blurs the wysiwyg
    // it'd get stuck in an infinite loop of blur -> onSubmit after we re-focus the
    // wysiwyg on update
    cleanup();

    const updateLayer = Scene.getScene(layer)?.getLayer(layer.id) as TextLayer;

    if (!updateLayer) {
      return;
    }

    let text = editable.value;
    const container = getContainerLayer(updateLayer);

    if (container) {
      text = updateLayer.text;

      if (editable.value.trim()) {
        const boundTextLayerId = getBoundTextLayerId(container);

        if (!boundTextLayerId || boundTextLayerId !== layer.id) {
          mutateLayer(container, {
            boundLayers: (container.boundLayers || []).concat({
              type: LayerType.TEXT,
              id: layer.id
            })
          });
        }
      } else {
        mutateLayer(container, {
          boundLayers: container.boundLayers?.filter(
            (layer) => !isTextLayer(layer as TextLayer | LinearLayer)
          )
        });
      }

      redrawTextBoundingBox(updateLayer, container);
    }

    onSubmit({
      text,
      viaKeyboard: submittedViaKeyboard,
      originalText: editable.value
    });
  };

  /**
   * Cleans up all the attached variables and event handlers
   */
  const cleanup = (): void => {
    if (isDestroyed) {
      return;
    }

    isDestroyed = true;
    // Remove events to ensure they don't late-fire
    editable.onblur = null;
    editable.oninput = null;
    editable.onkeydown = null;

    if (observer) {
      observer.disconnect();
    }

    window.removeEventListener("resize", updateWysiwygStyle);
    window.removeEventListener("wheel", stopEvent, true);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", bindBlurEvent);
    window.removeEventListener("blur", handleSubmit);

    unbindUpdate();

    editable.remove();
  };

  /**
   * Binds the blur event
   * @param event Mouse event
   */
  const bindBlurEvent = (event?: MouseEvent): void => {
    window.removeEventListener("pointerup", bindBlurEvent);
    // Deferred so that the `pointerdown` that initiates the wysiwyg doesn't
    // trigger the blur on ensuing pointerup.
    // Also, to handle cases such as picking a color which would trigger a blur
    // in that same tick.
    const target = event?.target;
    const isTargetPickerTrigger =
      target instanceof HTMLElement &&
      // TODO: Check color picker class
      target.classList.contains("active-color");

    setTimeout(() => {
      editable.onblur = handleSubmit;

      if (isTargetPickerTrigger) {
        const callback = (
          mutationList: MutationRecord[],
          observer: MutationObserver
        ): void => {
          const radixIsRemoved = mutationList.find(
            (mutation) =>
              mutation.removedNodes.length > 0 &&
              (mutation.removedNodes[0] as HTMLElement).dataset
                ?.radixPopperContentWrapper !== undefined
          );

          if (radixIsRemoved) {
            // Should work without this in theory, but Radix probably
            // sets the focus elsewhere
            setTimeout(() => {
              editable.focus();
            });

            observer.disconnect();
          }
        };

        const observer = new MutationObserver(callback);

        observer.observe(document.querySelector(".excalidraw-container")!, {
          childList: true
        });
      }

      // Case: clicking on the same property -> no change -> no update -> no focus
      if (!isTargetPickerTrigger) {
        editable.focus();
      }
    });
  };

  /**
   * Prevents blur when changing properties from the menu
   * @param event Mouse event
   */
  const onPointerDown = (event: MouseEvent): void => {
    const isTargetPickerTrigger =
      event.target instanceof HTMLElement &&
      event.target.classList.contains("active-color");

    if (
      ((event.target instanceof HTMLElement ||
        event.target instanceof SVGElement) &&
        // TODO: Add class below
        event.target.closest(`SHAPE_ACTIONS_MENU`) &&
        !isWritableElement(event.target)) ||
      isTargetPickerTrigger
    ) {
      editable.onblur = null;
      window.addEventListener("pointerup", bindBlurEvent);
      // Handle edge-case where pointerup doesn't fire, e.g., due to user
      // alt-tabbing away
      window.addEventListener("blur", handleSubmit);
    }
  };

  /**
   * Handles updates of textLayer properties of editing layer
   */
  const unbindUpdate = Scene.getScene(layer)!.addCallback(() => {
    updateWysiwygStyle();
    const isColorPickerActive = !!document.activeElement?.closest(
      ".color-picker-content"
    );

    if (!isColorPickerActive) {
      editable.focus();
    }
  });

  let isDestroyed = false;

  // Select on init (focusing is done separately inside the bindBlurEvent()
  // because we need it to happen after the blur event from `pointerdown`)
  editable.select();
  bindBlurEvent();

  // Reposition wysiwyg in case the canvas is resized. Using ResizeObserver
  // is preferred, so that we catch changes from the host
  let observer: ResizeObserver | null = null;

  if (canvas && "ResizeObserver" in window) {
    observer = new window.ResizeObserver(() => {
      updateWysiwygStyle();
    });

    observer.observe(canvas);
  } else {
    window.addEventListener("resize", updateWysiwygStyle);
  }

  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("wheel", stopEvent, {
    passive: false,
    capture: true
  });

  editorContainer
    ?.querySelector(".excalidraw-textEditorContainer")!
    .appendChild(editable);
};
