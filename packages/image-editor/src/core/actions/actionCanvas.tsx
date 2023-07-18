import { getNormalizedZoom, getSelectedLayers } from "../../lib/scene";
import { centerScrollOn } from "../../lib/scene/scroll/scroll";
import { getStateForZoom } from "../../lib/scene/zoom/zoom";
import {
  getShortcutKey,
  setCursor,
  updateActiveTool
} from "../../lib/utils/utils";
import { DEFAULT_CANVAS_BACKGROUND_PICKS } from "../colors";
import { ColorPicker } from "../components/ColorPicker/ColorPicker";
import { ZoomInIcon, ZoomOutIcon } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { Tooltip } from "../components/Tooltip";
import { CURSOR_TYPE, MIN_ZOOM, THEME, ZOOM_STEP } from "../constants";
import {
  getDefaultAppState,
  isEraserActive,
  isHandToolActive
} from "../editorState";
import { t } from "../i18n";
import { CODES, KEYS } from "../keys";
import { getCommonBounds, getNonDeletedLayers } from "../layer";
import { Bounds } from "../layer/bounds";
import { newLayerWith } from "../layer/mutateLayer";
import { ExcalidrawLayer } from "../layer/types";
import { AppState, NormalizedZoomValue } from "../types";
import { register } from "./register";

export const actionChangeViewBackgroundColor = register({
  name: "changeViewBackgroundColor",
  trackEvent: false,
  predicate: (layers, editorState, props, app) =>
    !!app.props.UIOptions.canvasActions.changeViewBackgroundColor &&
    !editorState.viewModeEnabled,
  perform: (_, editorState, value) => ({
    editorState: { ...editorState, ...value },
    commitToHistory: !!value.viewBackgroundColor
  }),
  PanelComponent: ({ layers, editorState, updateData, appProps }) => (
    <ColorPicker
      color={editorState.viewBackgroundColor}
      data-testid="canvas-background-picker"
      editorState={editorState}
      label={t("labels.canvasBackground")}
      layers={layers}
      onChange={(color) => updateData({ viewBackgroundColor: color })}
      palette={null}
      topPicks={DEFAULT_CANVAS_BACKGROUND_PICKS}
      type="canvasBackground"
      updateData={updateData}
    />
  )
});

export const actionClearCanvas = register({
  name: "clearCanvas",
  trackEvent: { category: "canvas" },
  predicate: (layers, editorState, props, app) =>
    !!app.props.UIOptions.canvasActions.clearCanvas &&
    !editorState.viewModeEnabled,
  perform: (layers, editorState, _, app) => {
    app.imageCache.clear();
    return {
      layers: layers.map((layer) => newLayerWith(layer, { isDeleted: true })),
      editorState: {
        ...getDefaultAppState(),
        files: {},
        theme: editorState.theme,
        penMode: editorState.penMode,
        penDetected: editorState.penDetected,
        exportBackground: editorState.exportBackground,
        exportEmbedScene: editorState.exportEmbedScene,
        gridSize: editorState.gridSize,
        showStats: editorState.showStats,
        pasteDialog: editorState.pasteDialog,
        activeTool:
          editorState.activeTool.type === "image"
            ? { ...editorState.activeTool, type: "selection" }
            : editorState.activeTool
      },
      commitToHistory: true
    };
  }
});

export const actionZoomIn = register({
  name: "zoomIn",
  viewMode: true,
  trackEvent: { category: "canvas" },
  perform: (_layers, editorState, _, app) => ({
    editorState: {
      ...editorState,
      ...getStateForZoom(
        {
          viewportX: editorState.width / 2 + editorState.offsetLeft,
          viewportY: editorState.height / 2 + editorState.offsetTop,
          nextZoom: getNormalizedZoom(editorState.zoom.value + ZOOM_STEP)
        },
        editorState
      )
    },
    commitToHistory: false
  }),
  PanelComponent: ({ updateData }) => (
    <ToolButton
      aria-label={t("buttons.zoomIn")}
      className="zoom-in-button zoom-button"
      icon={ZoomInIcon}
      onClick={() => {
        updateData(null);
      }}
      title={`${t("buttons.zoomIn")} — ${getShortcutKey("CtrlOrCmd++")}`}
      type="button"
    />
  ),
  keyTest: (event) =>
    (event.code === CODES.EQUAL || event.code === CODES.NUM_ADD) &&
    (event[KEYS.CTRL_OR_CMD] || event.shiftKey)
});

export const actionZoomOut = register({
  name: "zoomOut",
  viewMode: true,
  trackEvent: { category: "canvas" },
  perform: (_layers, editorState, _, app) => ({
    editorState: {
      ...editorState,
      ...getStateForZoom(
        {
          viewportX: editorState.width / 2 + editorState.offsetLeft,
          viewportY: editorState.height / 2 + editorState.offsetTop,
          nextZoom: getNormalizedZoom(editorState.zoom.value - ZOOM_STEP)
        },
        editorState
      )
    },
    commitToHistory: false
  }),
  PanelComponent: ({ updateData }) => (
    <ToolButton
      aria-label={t("buttons.zoomOut")}
      className="zoom-out-button zoom-button"
      icon={ZoomOutIcon}
      onClick={() => {
        updateData(null);
      }}
      title={`${t("buttons.zoomOut")} — ${getShortcutKey("CtrlOrCmd+-")}`}
      type="button"
    />
  ),
  keyTest: (event) =>
    (event.code === CODES.MINUS || event.code === CODES.NUM_SUBTRACT) &&
    (event[KEYS.CTRL_OR_CMD] || event.shiftKey)
});

export const actionResetZoom = register({
  name: "resetZoom",
  viewMode: true,
  trackEvent: { category: "canvas" },
  perform: (_layers, editorState, _, app) => ({
    editorState: {
      ...editorState,
      ...getStateForZoom(
        {
          viewportX: editorState.width / 2 + editorState.offsetLeft,
          viewportY: editorState.height / 2 + editorState.offsetTop,
          nextZoom: getNormalizedZoom(1)
        },
        editorState
      )
    },
    commitToHistory: false
  }),
  PanelComponent: ({ updateData, editorState }) => (
    <Tooltip label={t("buttons.resetZoom")} style={{ height: "100%" }}>
      <ToolButton
        aria-label={t("buttons.resetZoom")}
        className="reset-zoom-button zoom-button"
        onClick={() => {
          updateData(null);
        }}
        title={t("buttons.resetZoom")}
        type="button"
      >
        {(editorState.zoom.value * 100).toFixed(0)}%
      </ToolButton>
    </Tooltip>
  ),
  keyTest: (event) =>
    (event.code === CODES.ZERO || event.code === CODES.NUM_ZERO) &&
    (event[KEYS.CTRL_OR_CMD] || event.shiftKey)
});

const zoomValueToFitBoundsOnViewport = (
  bounds: Bounds,
  viewportDimensions: { height: number; width: number }
) => {
  const [x1, y1, x2, y2] = bounds;
  const commonBoundsWidth = x2 - x1;
  const zoomValueForWidth = viewportDimensions.width / commonBoundsWidth;
  const commonBoundsHeight = y2 - y1;
  const zoomValueForHeight = viewportDimensions.height / commonBoundsHeight;
  const smallestZoomValue = Math.min(zoomValueForWidth, zoomValueForHeight);
  const zoomAdjustedToSteps =
    Math.floor(smallestZoomValue / ZOOM_STEP) * ZOOM_STEP;
  const clampedZoomValueToFitLayers = Math.min(
    Math.max(zoomAdjustedToSteps, MIN_ZOOM),
    1
  );
  return clampedZoomValueToFitLayers as NormalizedZoomValue;
};

export const zoomToFit = ({
  targetLayers,
  editorState,
  fitToViewport = false,
  viewportZoomFactor = 0.7
}: {
  editorState: Readonly<AppState>;
  /** whether to fit content to viewport (beyond >100%) */
  fitToViewport: boolean;
  targetLayers: readonly ExcalidrawLayer[];
  /** zoom content to cover X of the viewport, when fitToViewport=true */
  viewportZoomFactor?: number;
}) => {
  const commonBounds = getCommonBounds(getNonDeletedLayers(targetLayers));

  const [x1, y1, x2, y2] = commonBounds;
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;

  let newZoomValue;
  let scrollX;
  let scrollY;

  if (fitToViewport) {
    const commonBoundsWidth = x2 - x1;
    const commonBoundsHeight = y2 - y1;

    newZoomValue =
      Math.min(
        editorState.width / commonBoundsWidth,
        editorState.height / commonBoundsHeight
      ) * Math.min(1, Math.max(viewportZoomFactor, 0.1));

    // Apply clamping to newZoomValue to be between 10% and 3000%
    newZoomValue = Math.min(
      Math.max(newZoomValue, 0.1),
      30.0
    ) as NormalizedZoomValue;

    scrollX = (editorState.width / 2) * (1 / newZoomValue) - centerX;
    scrollY = (editorState.height / 2) * (1 / newZoomValue) - centerY;
  } else {
    newZoomValue = zoomValueToFitBoundsOnViewport(commonBounds, {
      width: editorState.width,
      height: editorState.height
    });

    const centerScroll = centerScrollOn({
      scenePoint: { x: centerX, y: centerY },
      viewportDimensions: {
        width: editorState.width,
        height: editorState.height
      },
      zoom: { value: newZoomValue }
    });

    scrollX = centerScroll.scrollX;
    scrollY = centerScroll.scrollY;
  }

  return {
    editorState: {
      ...editorState,
      scrollX,
      scrollY,
      zoom: { value: newZoomValue }
    },
    commitToHistory: false
  };
};

// Note, this action differs from actionZoomToFitSelection in that it doesn't
// zoom beyond 100%. In other words, if the content is smaller than viewport
// size, it won't be zoomed in.
export const actionZoomToFitSelectionInViewport = register({
  name: "zoomToFitSelectionInViewport",
  trackEvent: { category: "canvas" },
  perform: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState
    );
    return zoomToFit({
      targetLayers: selectedLayers.length ? selectedLayers : layers,
      editorState,
      fitToViewport: false
    });
  },
  // NOTE shift-2 should have been assigned actionZoomToFitSelection.
  // TBD on how proceed
  keyTest: (event) =>
    event.code === CODES.TWO &&
    event.shiftKey &&
    !event.altKey &&
    !event[KEYS.CTRL_OR_CMD]
});

export const actionZoomToFitSelection = register({
  name: "zoomToFitSelection",
  trackEvent: { category: "canvas" },
  perform: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState
    );
    return zoomToFit({
      targetLayers: selectedLayers.length ? selectedLayers : layers,
      editorState,
      fitToViewport: true
    });
  },
  // NOTE this action should use shift-2 per figma, alas
  keyTest: (event) =>
    event.code === CODES.THREE &&
    event.shiftKey &&
    !event.altKey &&
    !event[KEYS.CTRL_OR_CMD]
});

export const actionZoomToFit = register({
  name: "zoomToFit",
  viewMode: true,
  trackEvent: { category: "canvas" },
  perform: (layers, editorState) =>
    zoomToFit({ targetLayers: layers, editorState, fitToViewport: false }),
  keyTest: (event) =>
    event.code === CODES.ONE &&
    event.shiftKey &&
    !event.altKey &&
    !event[KEYS.CTRL_OR_CMD]
});

export const actionToggleTheme = register({
  name: "toggleTheme",
  viewMode: true,
  trackEvent: { category: "canvas" },
  perform: (_, editorState, value) => ({
    editorState: {
      ...editorState,
      theme:
        value || (editorState.theme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT)
    },
    commitToHistory: false
  }),
  keyTest: (event) => event.altKey && event.shiftKey && event.code === CODES.D,
  predicate: (layers, editorState, props, app) =>
    !!app.props.UIOptions.canvasActions.toggleTheme
});

export const actionToggleEraserTool = register({
  name: "toggleEraserTool",
  trackEvent: { category: "toolbar" },
  perform: (layers, editorState) => {
    let activeTool: AppState["activeTool"];

    if (isEraserActive(editorState)) {
      activeTool = updateActiveTool(editorState, {
        ...(editorState.activeTool.lastActiveTool || {
          type: "selection"
        }),
        lastActiveToolBeforeEraser: null
      });
    } else {
      activeTool = updateActiveTool(editorState, {
        type: "eraser",
        lastActiveToolBeforeEraser: editorState.activeTool
      });
    }

    return {
      editorState: {
        ...editorState,
        selectedLayerIds: {},
        selectedGroupIds: {},
        activeTool
      },
      commitToHistory: true
    };
  },
  keyTest: (event) => event.key === KEYS.E
});

export const actionToggleHandTool = register({
  name: "toggleHandTool",
  trackEvent: { category: "toolbar" },
  perform: (layers, editorState, _, app) => {
    let activeTool: AppState["activeTool"];

    if (isHandToolActive(editorState)) {
      activeTool = updateActiveTool(editorState, {
        ...(editorState.activeTool.lastActiveTool || {
          type: "selection"
        }),
        lastActiveToolBeforeEraser: null
      });
    } else {
      activeTool = updateActiveTool(editorState, {
        type: "hand",
        lastActiveToolBeforeEraser: editorState.activeTool
      });
      setCursor(app.canvas, CURSOR_TYPE.GRAB);
    }

    return {
      editorState: {
        ...editorState,
        selectedLayerIds: {},
        selectedGroupIds: {},
        activeTool
      },
      commitToHistory: true
    };
  },
  keyTest: (event) => event.key === KEYS.H
});
