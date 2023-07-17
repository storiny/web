import clsx from "clsx";
import throttle from "lodash.throttle";
import { nanoid } from "nanoid";
import React, { useContext } from "react";
import { flushSync } from "react-dom";
import { RoughCanvas } from "roughjs/bin/canvas";
import rough from "roughjs/bin/rough";

import {
  dataURLToFile,
  generateIdFromFile,
  getDataURL,
  getFileFromEvent,
  isImageFileHandle,
  isSupportedImageFile,
  loadSceneOrLibraryFromBlob,
  normalizeFile,
  parseLibraryJSON,
  resizeImageFile,
  SVGStringToFile
} from "../../lib/data/blob/blob";
import { exportCanvas, loadFromBlob } from "../../lib/data/export";
import { fileOpen, FileSystemHandle } from "../../lib/data/fs/filesystem";
import Library, {
  distributeLibraryItemsOnSquareGrid
} from "../../lib/data/library";
import { restore, restoreLayers } from "../../lib/data/restore/restore";
import { isLocalLink, normalizeLink } from "../../lib/data/url/url";
import { distance2d, getGridPoint, isPathALoop } from "../../lib/math/math";
import {
  calculateScrollCenter,
  getLayersAtPosition,
  getLayersWithinSelection,
  getNormalizedZoom,
  getSelectedLayers,
  hasBackground,
  isOverScrollBars,
  isSomeLayerSelected
} from "../../lib/scene";
import { Fonts } from "../../lib/scene/Fonts";
import Scene from "../../lib/scene/scene/Scene";
import {
  excludeLayersInFramesFromSelection,
  makeNextSelectedLayerIds
} from "../../lib/scene/selection/selection";
import { RenderConfig, ScrollBars } from "../../lib/scene/types";
import { getStateForZoom } from "../../lib/scene/zoom/zoom";
import {
  actionAddToLibrary,
  actionBindText,
  actionBringForward,
  actionBringToFront,
  actionCopy,
  actionCopyAsPng,
  actionCopyAsSvg,
  actionCopyStyles,
  actionCut,
  actionDeleteSelected,
  actionDuplicateSelection,
  actionFinalize,
  actionFlipHorizontal,
  actionFlipVertical,
  actionGroup,
  actionLink,
  actionPasteStyles,
  actionSelectAll,
  actionSendBackward,
  actionSendToBack,
  actionToggleGridMode,
  actionToggleLayerLock,
  actionToggleLinearEditor,
  actionToggleStats,
  actionToggleZenMode,
  actionUnbindText,
  actionUngroup,
  copyText
} from "../actions";
import { actionWrapTextInContainer } from "../actions/actionBoundText";
import { actionToggleHandTool, zoomToFit } from "../actions/actionCanvas";
import { actionPaste } from "../actions/actionClipboard";
import {
  actionRemoveAllLayersFromFrame,
  actionSelectAllLayersInFrame
} from "../actions/actionFrame";
import { createRedoAction, createUndoAction } from "../actions/actionHistory";
import { actionUnlockAllLayers } from "../actions/actionLayerLock";
import { actionToggleViewMode } from "../actions/actionToggleViewMode";
import { ActionManager } from "../actions/manager";
import { actions } from "../actions/register";
import { ActionResult } from "../actions/types";
import { trackEvent } from "../analytics";
import {
  getDefaultAppState,
  isEraserActive,
  isHandToolActive
} from "../appState";
import { parseClipboard } from "../clipboard";
import {
  APP_NAME,
  CURSOR_TYPE,
  DEFAULT_MAX_IMAGE_WIDTH_OR_HEIGHT,
  DEFAULT_UI_OPTIONS,
  DEFAULT_VERTICAL_ALIGN,
  DRAGGING_THRESHOLD,
  ELEMENT_READY_TO_ERASE_OPACITY,
  ELEMENT_SHIFT_TRANSLATE_AMOUNT,
  ELEMENT_TRANSLATE_AMOUNT,
  ENV,
  EVENT,
  EXPORT_IMAGE_TYPES,
  FRAME_STYLE,
  GRID_SIZE,
  IMAGE_MIME_TYPES,
  IMAGE_RENDER_TIMEOUT,
  isAndroid,
  isBrave,
  LINE_CONFIRM_THRESHOLD,
  MAX_ALLOWED_FILE_BYTES,
  MIME_TYPES,
  MQ_MAX_HEIGHT_LANDSCAPE,
  MQ_MAX_WIDTH_LANDSCAPE,
  MQ_MAX_WIDTH_PORTRAIT,
  MQ_RIGHT_SIDEBAR_MIN_WIDTH,
  MQ_SM_MAX_WIDTH,
  POINTER_BUTTON,
  ROUNDNESS,
  SCROLL_TIMEOUT,
  TAP_TWICE_TIMEOUT,
  TEXT_TO_CENTER_SNAP_THRESHOLD,
  THEME,
  THEME_FILTER,
  TOUCH_CTX_MENU_TIMEOUT,
  VERTICAL_ALIGN,
  ZOOM_STEP
} from "../constants";
import {
  addLayersToFrame,
  bindLayersToFramesAfterDuplication,
  getContainingFrame,
  getFrameLayers,
  getLayersInNewFrame,
  getLayersInResizingFrame,
  isCursorInFrame,
  isLayerInFrame,
  layerOverlapsWithFrame,
  removeLayersFromFrame,
  replaceAllLayersInFrame,
  updateFrameMembershipOfSelectedLayers
} from "../frame";
import { getCenter, getDistance } from "../gesture";
import {
  editGroupForSelectedLayer,
  getLayersInGroup,
  getSelectedGroupIdForLayer,
  getSelectedGroupIds,
  isLayerInGroup,
  isSelectedViaGroup,
  selectGroupsForSelectedLayers
} from "../groups";
import History from "../history";
import { defaultLang, getLanguage, languages, setLanguage, t } from "../i18n";
import { jotaiStore } from "../jotai";
import {
  CODES,
  isArrowKey,
  KEYS,
  shouldMaintainAspectRatio,
  shouldResizeFromCenter,
  shouldRotateWithDiscreteAngle
} from "../keys";
import {
  dragNewLayer,
  dragSelectedLayers,
  duplicateLayer,
  getCommonBounds,
  getCursorForResizingLayer,
  getDragOffsetXY,
  getLayerWithTransformHandleType,
  getLockedLinearCursorAlignSize,
  getNormalizedDimensions,
  getResizeArrowDirection,
  getResizeOffsetXY,
  getTransformHandleTypeFromCoords,
  hitTest,
  isHittingLayerBoundingBoxWithoutHittingLayer,
  isInvisiblySmallLayer,
  isNonDeletedLayer,
  isTextLayer,
  newImageLayer,
  newLayer,
  newLinearLayer,
  newTextLayer,
  redrawTextBoundingBox,
  textWysiwyg,
  transformLayers,
  updateTextLayer
} from "../layer";
import {
  bindOrUnbindLinearLayer,
  bindOrUnbindSelectedLayers,
  fixBindingsAfterDeletion,
  fixBindingsAfterDuplication,
  getEligibleLayersForBinding,
  getHoveredLayerForBinding,
  isBindingEnabled,
  isLinearLayerSimpleAndAlreadyBound,
  maybeBindLinearLayer,
  shouldEnableBindingForPointerEvent,
  unbindLinearLayers,
  updateBoundLayers
} from "../layer/binding";
import { isHittingLayerNotConsideringBoundingBox } from "../layer/collision";
import {
  hideHyperlinkToolip,
  Hyperlink,
  isPointHittingLinkIcon,
  showHyperlinkTooltip
} from "../layer/Hyperlink";
import {
  getInitializedImageLayers,
  loadHTMLImageElement,
  normalizeSVG,
  updateImageCache as _updateImageCache
} from "../layer/image";
import { LinearLayerEditor } from "../layer/linearLayerEditor";
import { mutateLayer, newLayerWith } from "../layer/mutateLayer";
import {
  deepCopyLayer,
  duplicateLayers,
  newFrameLayer,
  newFreeDrawLayer
} from "../layer/newLayer";
import {
  bindTextToShapeAfterDuplication,
  getApproxMinContainerHeight,
  getApproxMinContainerWidth,
  getBoundTextLayer,
  getContainerCenter,
  getContainerDims,
  getContainerLayer,
  getDefaultLineHeight,
  getLineHeightInPx,
  getTextBindableContainerAtPosition,
  isMeasureTextSupported,
  isValidTextContainer
} from "../layer/textLayer";
import { shouldShowBoundingBox } from "../layer/transformHandles";
import {
  hasBoundTextLayer,
  isArrowLayer,
  isBindingLayer,
  isBindingLayerType,
  isBoundToContainer,
  isFrameLayer,
  isImageLayer,
  isInitializedImageLayer,
  isLinearLayer,
  isLinearLayerType,
  isUsingAdaptiveRadius
} from "../layer/typeChecks";
import {
  ExcalidrawBindableLayer,
  ExcalidrawFrameLayer,
  ExcalidrawFreeDrawLayer,
  ExcalidrawGenericLayer,
  ExcalidrawImageLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextContainer,
  ExcalidrawTextLayer,
  FileId,
  InitializedExcalidrawImageLayer,
  NonDeleted,
  NonDeletedExcalidrawLayer
} from "../layer/types";
import { invalidateShapeForLayer } from "../renderer/renderLayer";
import { isVisibleLayer, renderScene } from "../renderer/renderScene";
import { findShapeByKey, SHAPES } from "../shapes";
import {
  AppClassProperties,
  AppProps,
  AppState,
  BinaryFileData,
  BinaryFiles,
  DataURL,
  Device,
  ExcalidrawImperativeAPI,
  FrameNameBoundsCache,
  Gesture,
  GestureEvent,
  LibraryItems,
  PointerDownState,
  SceneData,
  SidebarName,
  SidebarTabName
} from "../types";
import {
  debounce,
  distance,
  easeOut,
  easeToValuesRAF,
  getFontString,
  getNearestScrollableContainer,
  getShortcutKey,
  isInputLike,
  isToolIcon,
  isTransparent,
  isWritableLayer,
  muteFSAbortError,
  resetCursor,
  resolvablePromise,
  sceneCoordsToViewportCoords,
  setCursor,
  setCursorForShape,
  setEraserCursor,
  tupleToCoors,
  updateActiveTool,
  updateObject,
  viewportCoordsToSceneCoords,
  withBatchedUpdates,
  withBatchedUpdatesThrottled,
  wrapEvent
} from "../utils";
import { activeConfirmDialogAtom } from "./ActiveConfirmDialog";
import BraveMeasureTextError from "./BraveMeasureTextError";
import {
  CONTEXT_MENU_SEPARATOR,
  ContextMenu,
  ContextMenuItems
} from "./ContextMenu";
import { activeEyeDropperAtom } from "./EyeDropper";
import LayerUI from "./LayerUI";
import { Toast } from "./Toast";

const AppContext = React.createContext<AppClassProperties>(null!);
const AppPropsContext = React.createContext<AppProps>(null!);

const deviceContextInitialValue = {
  isSmScreen: false,
  isMobile: false,
  isTouchScreen: false,
  canDeviceFitSidebar: false,
  isLandscape: false
};
const DeviceContext = React.createContext<Device>(deviceContextInitialValue);
DeviceContext.displayName = "DeviceContext";

export const ExcalidrawContainerContext = React.createContext<{
  container: HTMLDivLayer | null;
  id: string | null;
}>({ container: null, id: null });
ExcalidrawContainerContext.displayName = "ExcalidrawContainerContext";

const ExcalidrawLayersContext = React.createContext<
  readonly NonDeletedExcalidrawLayer[]
>([]);
ExcalidrawLayersContext.displayName = "ExcalidrawLayersContext";

const ExcalidrawAppStateContext = React.createContext<AppState>({
  ...getDefaultAppState(),
  width: 0,
  height: 0,
  offsetLeft: 0,
  offsetTop: 0
});
ExcalidrawAppStateContext.displayName = "ExcalidrawAppStateContext";

const ExcalidrawSetAppStateContext = React.createContext<
  React.Component<any, AppState>["setState"]
>(() => {
  console.warn("unitialized ExcalidrawSetAppStateContext context!");
});
ExcalidrawSetAppStateContext.displayName = "ExcalidrawSetAppStateContext";

const ExcalidrawActionManagerContext = React.createContext<ActionManager>(
  null!
);
ExcalidrawActionManagerContext.displayName = "ExcalidrawActionManagerContext";

export const useApp = () => useContext(AppContext);
export const useAppProps = () => useContext(AppPropsContext);
export const useDevice = () => useContext<Device>(DeviceContext);
export const useExcalidrawContainer = () =>
  useContext(ExcalidrawContainerContext);
export const useExcalidrawLayers = () => useContext(ExcalidrawLayersContext);
export const useExcalidrawAppState = () =>
  useContext(ExcalidrawAppStateContext);
export const useExcalidrawSetAppState = () =>
  useContext(ExcalidrawSetAppStateContext);
export const useExcalidrawActionManager = () =>
  useContext(ExcalidrawActionManagerContext);

let didTapTwice: boolean = false;
let tappedTwiceTimer = 0;
let isHoldingSpace: boolean = false;
let isPanning: boolean = false;
let isDraggingScrollBar: boolean = false;
let currentScrollBars: ScrollBars = { horizontal: null, vertical: null };
let touchTimeout = 0;
let invalidateContextMenu = false;

// remove this hack when we can sync render & resizeObserver (state update)
// to rAF. See #5439
let THROTTLE_NEXT_RENDER = true;

let IS_PLAIN_PASTE = false;
let IS_PLAIN_PASTE_TIMER = 0;
let PLAIN_PASTE_TOAST_SHOWN = false;

let lastPointerUp: ((event: any) => void) | null = null;
const gesture: Gesture = {
  pointers: new Map(),
  lastCenter: null,
  initialDistance: null,
  initialScale: null
};

class App extends React.Component<AppProps, AppState> {
  canvas: AppClassProperties["canvas"] = null;
  rc: RoughCanvas | null = null;
  unmounted: boolean = false;
  actionManager: ActionManager;
  device: Device = deviceContextInitialValue;
  detachIsMobileMqHandler?: () => void;

  private excalidrawContainerRef = React.createRef<HTMLDivLayer>();

  public static defaultProps: Partial<AppProps> = {
    // needed for tests to pass since we directly render App in many tests
    UIOptions: DEFAULT_UI_OPTIONS
  };

  public scene: Scene;
  private fonts: Fonts;
  private resizeObserver: ResizeObserver | undefined;
  private nearestScrollableContainer: HTMLLayer | Document | undefined;
  public library: AppClassProperties["library"];
  public libraryItemsFromStorage: LibraryItems | undefined;
  public id: string;
  private history: History;
  private excalidrawContainerValue: {
    container: HTMLDivLayer | null;
    id: string;
  };

  public files: BinaryFiles = {};
  public imageCache: AppClassProperties["imageCache"] = new Map();

  hitLinkLayer?: NonDeletedExcalidrawLayer;
  lastPointerDown: React.PointerEvent<HTMLLayer> | null = null;
  lastPointerUp: React.PointerEvent<HTMLLayer> | PointerEvent | null = null;
  lastViewportPosition = { x: 0, y: 0 };

  constructor(props: AppProps) {
    super(props);
    const defaultAppState = getDefaultAppState();
    const {
      excalidrawRef,
      viewModeEnabled = false,
      zenModeEnabled = false,
      gridModeEnabled = false,
      theme = defaultAppState.theme,
      name = defaultAppState.name
    } = props;
    this.state = {
      ...defaultAppState,
      theme,
      isLoading: true,
      ...this.getCanvasOffsets(),
      viewModeEnabled,
      zenModeEnabled,
      gridSize: gridModeEnabled ? GRID_SIZE : null,
      name,
      width: window.innerWidth,
      height: window.innerHeight,
      showHyperlinkPopup: false,
      defaultSidebarDockedPreference: false
    };

    this.id = nanoid();
    this.library = new Library(this);
    if (excalidrawRef) {
      const readyPromise =
        ("current" in excalidrawRef && excalidrawRef.current?.readyPromise) ||
        resolvablePromise<ExcalidrawImperativeAPI>();

      const api: ExcalidrawImperativeAPI = {
        ready: true,
        readyPromise,
        updateScene: this.updateScene,
        updateLibrary: this.library.updateLibrary,
        addFiles: this.addFiles,
        resetScene: this.resetScene,
        getSceneLayersIncludingDeleted: this.getSceneLayersIncludingDeleted,
        history: {
          clear: this.resetHistory
        },
        scrollToContent: this.scrollToContent,
        getSceneLayers: this.getSceneLayers,
        getAppState: () => this.state,
        getFiles: () => this.files,
        refresh: this.refresh,
        setToast: this.setToast,
        id: this.id,
        setActiveTool: this.setActiveTool,
        setCursor: this.setCursor,
        resetCursor: this.resetCursor,
        updateFrameRendering: this.updateFrameRendering,
        toggleSidebar: this.toggleSidebar
      } as const;
      if (typeof excalidrawRef === "function") {
        excalidrawRef(api);
      } else {
        excalidrawRef.current = api;
      }
      readyPromise.resolve(api);
    }

    this.excalidrawContainerValue = {
      container: this.excalidrawContainerRef.current,
      id: this.id
    };

    this.scene = new Scene();
    this.fonts = new Fonts({
      scene: this.scene,
      onSceneUpdated: this.onSceneUpdated
    });
    this.history = new History();
    this.actionManager = new ActionManager(
      this.syncActionResult,
      () => this.state,
      () => this.scene.getLayersIncludingDeleted(),
      this
    );
    this.actionManager.registerAll(actions);

    this.actionManager.registerAction(createUndoAction(this.history));
    this.actionManager.registerAction(createRedoAction(this.history));
  }

  private renderCanvas() {
    const canvasScale = window.devicePixelRatio;
    const {
      width: canvasDOMWidth,
      height: canvasDOMHeight,
      viewModeEnabled
    } = this.state;
    const canvasWidth = canvasDOMWidth * canvasScale;
    const canvasHeight = canvasDOMHeight * canvasScale;
    if (viewModeEnabled) {
      return (
        <canvas
          className="excalidraw__canvas"
          height={canvasHeight}
          onContextMenu={(event: React.PointerEvent<HTMLCanvasLayer>) =>
            this.handleCanvasContextMenu(event)
          }
          onPointerCancel={this.removePointer}
          onPointerDown={this.handleCanvasPointerDown}
          onPointerMove={this.handleCanvasPointerMove}
          onPointerUp={this.handleCanvasPointerUp}
          onTouchMove={this.handleTouchMove}
          ref={this.handleCanvasRef}
          style={{
            width: canvasDOMWidth,
            height: canvasDOMHeight,
            cursor: CURSOR_TYPE.GRAB
          }}
          width={canvasWidth}
        >
          {t("labels.drawingCanvas")}
        </canvas>
      );
    }
    return (
      <canvas
        className="excalidraw__canvas"
        height={canvasHeight}
        onContextMenu={(event: React.PointerEvent<HTMLCanvasLayer>) =>
          this.handleCanvasContextMenu(event)
        }
        onDoubleClick={this.handleCanvasDoubleClick}
        onPointerCancel={this.removePointer}
        onPointerDown={this.handleCanvasPointerDown}
        onPointerMove={this.handleCanvasPointerMove}
        onPointerUp={this.handleCanvasPointerUp}
        onTouchMove={this.handleTouchMove}
        ref={this.handleCanvasRef}
        style={{
          width: canvasDOMWidth,
          height: canvasDOMHeight
        }}
        width={canvasWidth}
      >
        {t("labels.drawingCanvas")}
      </canvas>
    );
  }

  private getFrameNameDOMId = (frameLayer: ExcalidrawLayer) => {
    return `${this.id}-frame-name-${frameLayer.id}`;
  };

  frameNameBoundsCache: FrameNameBoundsCache = {
    get: (frameLayer) => {
      let bounds = this.frameNameBoundsCache._cache.get(frameLayer.id);
      if (
        !bounds ||
        bounds.zoom !== this.state.zoom.value ||
        bounds.versionNonce !== frameLayer.versionNonce
      ) {
        const frameNameDiv = document.getLayerById(
          this.getFrameNameDOMId(frameLayer)
        );

        if (frameNameDiv) {
          const box = frameNameDiv.getBoundingClientRect();
          const boxSceneTopLeft = viewportCoordsToSceneCoords(
            { clientX: box.x, clientY: box.y },
            this.state
          );
          const boxSceneBottomRight = viewportCoordsToSceneCoords(
            { clientX: box.right, clientY: box.bottom },
            this.state
          );

          bounds = {
            x: boxSceneTopLeft.x,
            y: boxSceneTopLeft.y,
            width: boxSceneBottomRight.x - boxSceneTopLeft.x,
            height: boxSceneBottomRight.y - boxSceneTopLeft.y,
            angle: 0,
            zoom: this.state.zoom.value,
            versionNonce: frameLayer.versionNonce
          };

          this.frameNameBoundsCache._cache.set(frameLayer.id, bounds);

          return bounds;
        }
        return null;
      }

      return bounds;
    },
    /**
     * @private
     */
    _cache: new Map()
  };

  private renderFrameNames = () => {
    if (!this.state.frameRendering.enabled || !this.state.frameRendering.name) {
      return null;
    }

    const isDarkTheme = this.state.theme === "dark";

    return this.scene.getNonDeletedFrames().map((f, index) => {
      if (
        !this.canvas ||
        !isVisibleLayer(
          f,
          this.canvas.width / window.devicePixelRatio,
          this.canvas.height / window.devicePixelRatio,
          {
            offsetLeft: this.state.offsetLeft,
            offsetTop: this.state.offsetTop,
            scrollX: this.state.scrollX,
            scrollY: this.state.scrollY,
            zoom: this.state.zoom
          }
        )
      ) {
        // if frame not visible, don't render its name
        return null;
      }

      const { x: x1, y: y1 } = sceneCoordsToViewportCoords(
        { sceneX: f.x, sceneY: f.y },
        this.state
      );

      const { x: x2 } = sceneCoordsToViewportCoords(
        { sceneX: f.x + f.width, sceneY: f.y + f.height },
        this.state
      );

      const FRAME_NAME_GAP = 20;
      const FRAME_NAME_EDIT_PADDING = 6;

      const reset = () => {
        if (f.name?.trim() === "") {
          mutateLayer(f, { name: null });
        }

        this.setState({ editingFrame: null });
      };

      let frameNameJSX;

      if (f.id === this.state.editingFrame) {
        const frameNameInEdit = f.name == null ? `Frame ${index + 1}` : f.name;

        frameNameJSX = (
          <input
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            autoFocus
            dir="auto"
            onBlur={() => reset()}
            onChange={(e) => {
              mutateLayer(f, {
                name: e.target.value
              });
            }}
            onKeyDown={(event) => {
              // for some inexplicable reason, `onBlur` triggered on ESC
              // does not reset `state.editingFrame` despite being called,
              // and we need to reset it here as well
              if (event.key === KEYS.ESCAPE || event.key === KEYS.ENTER) {
                reset();
              }
            }}
            size={frameNameInEdit.length + 1 || 1}
            style={{
              background: this.state.viewBackgroundColor,
              filter: isDarkTheme ? THEME_FILTER : "none",
              zIndex: 2,
              border: "none",
              display: "block",
              padding: `${FRAME_NAME_EDIT_PADDING}px`,
              borderRadius: 4,
              boxShadow: "inset 0 0 0 1px var(--color-primary)",
              fontFamily: "Assistant",
              fontSize: "14px",
              transform: `translateY(-${FRAME_NAME_EDIT_PADDING}px)`,
              color: "var(--color-gray-80)",
              overflow: "hidden",
              maxWidth: `${Math.min(
                x2 - x1 - FRAME_NAME_EDIT_PADDING,
                document.body.clientWidth - x1 - FRAME_NAME_EDIT_PADDING
              )}px`
            }}
            value={frameNameInEdit}
          />
        );
      } else {
        frameNameJSX =
          f.name == null || f.name.trim() === ""
            ? `Frame ${index + 1}`
            : f.name.trim();
      }

      return (
        <div
          id={this.getFrameNameDOMId(f)}
          key={f.id}
          onContextMenu={(event: React.PointerEvent<HTMLDivLayer>) => {
            this.handleCanvasContextMenu(event);
          }}
          onDoubleClick={() => {
            this.setState({
              editingFrame: f.id
            });
          }}
          onPointerDown={(event) => this.handleCanvasPointerDown(event)}
          onWheel={(event) => this.handleWheel(event)}
          style={{
            position: "absolute",
            top: `${y1 - FRAME_NAME_GAP - this.state.offsetTop}px`,
            left: `${
              x1 -
              this.state.offsetLeft -
              (this.state.editingFrame === f.id ? FRAME_NAME_EDIT_PADDING : 0)
            }px`,
            zIndex: 2,
            fontSize: "14px",
            color: isDarkTheme
              ? "var(--color-gray-60)"
              : "var(--color-gray-50)",
            width: "max-content",
            maxWidth: `${x2 - x1 + FRAME_NAME_EDIT_PADDING * 2}px`,
            overflow: f.id === this.state.editingFrame ? "visible" : "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            cursor: CURSOR_TYPE.MOVE,
            // disable all interaction (e.g. cursor change) when in view
            // mode
            pointerEvents: this.state.viewModeEnabled ? "none" : "all"
          }}
        >
          {frameNameJSX}
        </div>
      );
    });
  };

  public render() {
    const selectedLayer = getSelectedLayers(
      this.scene.getNonDeletedLayers(),
      this.state
    );
    const { renderTopRightUI, renderCustomStats } = this.props;

    return (
      <div
        className={clsx("excalidraw excalidraw-container", {
          "excalidraw--view-mode": this.state.viewModeEnabled,
          "excalidraw--mobile": this.device.isMobile
        })}
        onDrop={this.handleAppOnDrop}
        onKeyDown={
          this.props.handleKeyboardGlobally ? undefined : this.onKeyDown
        }
        ref={this.excalidrawContainerRef}
        tabIndex={0}
      >
        <AppContext.Provider value={this}>
          <AppPropsContext.Provider value={this.props}>
            <ExcalidrawContainerContext.Provider
              value={this.excalidrawContainerValue}
            >
              <DeviceContext.Provider value={this.device}>
                <ExcalidrawSetAppStateContext.Provider value={this.setAppState}>
                  <ExcalidrawAppStateContext.Provider value={this.state}>
                    <ExcalidrawLayersContext.Provider
                      value={this.scene.getNonDeletedLayers()}
                    >
                      <ExcalidrawActionManagerContext.Provider
                        value={this.actionManager}
                      >
                        <LayerUI
                          UIOptions={this.props.UIOptions}
                          actionManager={this.actionManager}
                          appState={this.state}
                          canvas={this.canvas}
                          files={this.files}
                          langCode={getLanguage().code}
                          layers={this.scene.getNonDeletedLayers()}
                          onExportImage={this.onExportImage}
                          onHandToolToggle={this.onHandToolToggle}
                          onImageAction={this.onImageAction}
                          onLockToggle={this.toggleLock}
                          onPenModeToggle={this.togglePenMode}
                          renderCustomStats={renderCustomStats}
                          renderTopRightUI={renderTopRightUI}
                          renderWelcomeScreen={
                            !this.state.isLoading &&
                            this.state.showWelcomeScreen &&
                            this.state.activeTool.type === "selection" &&
                            !this.state.zenModeEnabled &&
                            !this.scene.getLayersIncludingDeleted().length
                          }
                          setAppState={this.setAppState}
                          showExitZenModeBtn={
                            typeof this.props?.zenModeEnabled === "undefined" &&
                            this.state.zenModeEnabled
                          }
                        >
                          {this.props.children}
                        </LayerUI>
                        <div className="excalidraw-textEditorContainer" />
                        <div className="excalidraw-contextMenuContainer" />
                        <div className="excalidraw-eye-dropper-container" />
                        {selectedLayer.length === 1 &&
                          !this.state.contextMenu &&
                          this.state.showHyperlinkPopup && (
                            <Hyperlink
                              key={selectedLayer[0].id}
                              layer={selectedLayer[0]}
                              onLinkOpen={this.props.onLinkOpen}
                              setAppState={this.setAppState}
                            />
                          )}
                        {this.state.toast !== null && (
                          <Toast
                            closable={this.state.toast.closable}
                            duration={this.state.toast.duration}
                            message={this.state.toast.message}
                            onClose={() => this.setToast(null)}
                          />
                        )}
                        {this.state.contextMenu && (
                          <ContextMenu
                            actionManager={this.actionManager}
                            items={this.state.contextMenu.items}
                            left={this.state.contextMenu.left}
                            top={this.state.contextMenu.top}
                          />
                        )}
                        <main>{this.renderCanvas()}</main>
                        {this.renderFrameNames()}
                      </ExcalidrawActionManagerContext.Provider>
                    </ExcalidrawLayersContext.Provider>
                  </ExcalidrawAppStateContext.Provider>
                </ExcalidrawSetAppStateContext.Provider>
              </DeviceContext.Provider>
            </ExcalidrawContainerContext.Provider>
          </AppPropsContext.Provider>
        </AppContext.Provider>
      </div>
    );
  }

  public focusContainer: AppClassProperties["focusContainer"] = () => {
    this.excalidrawContainerRef.current?.focus();
  };

  public getSceneLayersIncludingDeleted = () => {
    return this.scene.getLayersIncludingDeleted();
  };

  public getSceneLayers = () => {
    return this.scene.getNonDeletedLayers();
  };

  public onInsertLayers = (layers: readonly ExcalidrawLayer[]) => {
    this.addLayersFromPasteOrLibrary({
      layers,
      position: "center",
      files: null
    });
  };

  public onExportImage = async (
    type: keyof typeof EXPORT_IMAGE_TYPES,
    layers: readonly NonDeletedExcalidrawLayer[]
  ) => {
    trackEvent("export", type, "ui");
    const fileHandle = await exportCanvas(
      type,
      layers,
      this.state,
      this.files,
      {
        exportBackground: this.state.exportBackground,
        name: this.state.name,
        viewBackgroundColor: this.state.viewBackgroundColor
      }
    )
      .catch(muteFSAbortError)
      .catch((error) => {
        console.error(error);
        this.setState({ errorMessage: error.message });
      });

    if (
      this.state.exportEmbedScene &&
      fileHandle &&
      isImageFileHandle(fileHandle)
    ) {
      this.setState({ fileHandle });
    }
  };

  private openEyeDropper = ({ type }: { type: "stroke" | "background" }) => {
    jotaiStore.set(activeEyeDropperAtom, {
      swapPreviewOnAlt: true,
      previewType: type === "stroke" ? "strokeColor" : "backgroundColor",
      onSelect: (color, event) => {
        const shouldUpdateStrokeColor =
          (type === "background" && event.altKey) ||
          (type === "stroke" && !event.altKey);
        const selectedLayers = getSelectedLayers(
          this.scene.getLayersIncludingDeleted(),
          this.state
        );
        if (
          !selectedLayers.length ||
          this.state.activeTool.type !== "selection"
        ) {
          if (shouldUpdateStrokeColor) {
            this.setState({
              currentItemStrokeColor: color
            });
          } else {
            this.setState({
              currentItemBackgroundColor: color
            });
          }
        } else {
          this.updateScene({
            layers: this.scene.getLayersIncludingDeleted().map((el) => {
              if (this.state.selectedLayerIds[el.id]) {
                return newLayerWith(el, {
                  [shouldUpdateStrokeColor ? "strokeColor" : "backgroundColor"]:
                    color
                });
              }
              return el;
            })
          });
        }
      },
      keepOpenOnAlt: false
    });
  };

  private syncActionResult = withBatchedUpdates(
    (actionResult: ActionResult) => {
      if (this.unmounted || actionResult === false) {
        return;
      }

      let editingLayer: AppState["editingLayer"] | null = null;
      if (actionResult.layers) {
        actionResult.layers.forEach((layer) => {
          if (
            this.state.editingLayer?.id === layer.id &&
            this.state.editingLayer !== layer &&
            isNonDeletedLayer(layer)
          ) {
            editingLayer = layer;
          }
        });
        this.scene.replaceAllLayers(actionResult.layers);
        if (actionResult.commitToHistory) {
          this.history.resumeRecording();
        }
      }

      if (actionResult.files) {
        this.files = actionResult.replaceFiles
          ? actionResult.files
          : { ...this.files, ...actionResult.files };
        this.addNewImagesToImageCache();
      }

      if (actionResult.appState || editingLayer || this.state.contextMenu) {
        if (actionResult.commitToHistory) {
          this.history.resumeRecording();
        }

        let viewModeEnabled = actionResult?.appState?.viewModeEnabled || false;
        let zenModeEnabled = actionResult?.appState?.zenModeEnabled || false;
        let gridSize = actionResult?.appState?.gridSize || null;
        const theme =
          actionResult?.appState?.theme || this.props.theme || THEME.LIGHT;
        let name = actionResult?.appState?.name ?? this.state.name;
        const errorMessage =
          actionResult?.appState?.errorMessage ?? this.state.errorMessage;
        if (typeof this.props.viewModeEnabled !== "undefined") {
          viewModeEnabled = this.props.viewModeEnabled;
        }

        if (typeof this.props.zenModeEnabled !== "undefined") {
          zenModeEnabled = this.props.zenModeEnabled;
        }

        if (typeof this.props.gridModeEnabled !== "undefined") {
          gridSize = this.props.gridModeEnabled ? GRID_SIZE : null;
        }

        if (typeof this.props.name !== "undefined") {
          name = this.props.name;
        }

        editingLayer =
          editingLayer || actionResult.appState?.editingLayer || null;

        if (editingLayer?.isDeleted) {
          editingLayer = null;
        }

        this.setState(
          (state) =>
            Object.assign(actionResult.appState || {}, {
              // NOTE this will prevent opening context menu using an action
              // or programmatically from the host, so it will need to be
              // rewritten later
              contextMenu: null,
              editingLayer,
              viewModeEnabled,
              zenModeEnabled,
              gridSize,
              theme,
              name,
              errorMessage
            }),
          () => {
            if (actionResult.syncHistory) {
              this.history.setCurrentState(
                this.state,
                this.scene.getLayersIncludingDeleted()
              );
            }
          }
        );
      }
    }
  );

  // Lifecycle

  private onBlur = withBatchedUpdates(() => {
    isHoldingSpace = false;
    this.setState({ isBindingEnabled: true });
  });

  private onUnload = () => {
    this.onBlur();
  };

  private disableEvent: EventListener = (event) => {
    event.preventDefault();
  };

  private resetHistory = () => {
    this.history.clear();
  };

  /**
   * Resets scene & history.
   * ! Do not use to clear scene user action !
   */
  private resetScene = withBatchedUpdates(
    (opts?: { resetLoadingState: boolean }) => {
      this.scene.replaceAllLayers([]);
      this.setState((state) => ({
        ...getDefaultAppState(),
        isLoading: opts?.resetLoadingState ? false : state.isLoading,
        theme: this.state.theme
      }));
      this.resetHistory();
    }
  );

  private initializeScene = async () => {
    if ("launchQueue" in window && "LaunchParams" in window) {
      (window as any).launchQueue.setConsumer(
        async (launchParams: { files: any[] }) => {
          if (!launchParams.files.length) {
            return;
          }
          const fileHandle = launchParams.files[0];
          const blob: Blob = await fileHandle.getFile();
          this.loadFileToCanvas(
            new File([blob], blob.name || "", { type: blob.type }),
            fileHandle
          );
        }
      );
    }

    if (this.props.theme) {
      this.setState({ theme: this.props.theme });
    }
    if (!this.state.isLoading) {
      this.setState({ isLoading: true });
    }
    let initialData = null;
    try {
      initialData = (await this.props.initialData) || null;
      if (initialData?.libraryItems) {
        this.library
          .updateLibrary({
            libraryItems: initialData.libraryItems,
            merge: true
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } catch (error: any) {
      console.error(error);
      initialData = {
        appState: {
          errorMessage:
            error.message ||
            "Encountered an error during importing or restoring scene data"
        }
      };
    }
    const scene = restore(initialData, null, null, { repairBindings: true });
    scene.appState = {
      ...scene.appState,
      theme: this.props.theme || scene.appState.theme,
      // we're falling back to current (pre-init) state when deciding
      // whether to open the library, to handle a case where we
      // update the state outside of initialData (e.g. when loading the app
      // with a library install link, which should auto-open the library)
      openSidebar: scene.appState?.openSidebar || this.state.openSidebar,
      activeTool:
        scene.appState.activeTool.type === "image"
          ? { ...scene.appState.activeTool, type: "selection" }
          : scene.appState.activeTool,
      isLoading: false,
      toast: this.state.toast
    };
    if (initialData?.scrollToContent) {
      scene.appState = {
        ...scene.appState,
        ...calculateScrollCenter(
          scene.layers,
          {
            ...scene.appState,
            width: this.state.width,
            height: this.state.height,
            offsetTop: this.state.offsetTop,
            offsetLeft: this.state.offsetLeft
          },
          null
        )
      };
    }
    // FontFaceSet loadingdone event we listen on may not always fire
    // (looking at you Safari), so on init we manually load fonts for current
    // text layers on canvas, and rerender them once done. This also
    // seems faster even in browsers that do fire the loadingdone event.
    this.fonts.loadFontsForLayers(scene.layers);

    this.resetHistory();
    this.syncActionResult({
      ...scene,
      commitToHistory: true
    });
  };

  private refreshDeviceState = (container: HTMLDivLayer) => {
    const { width, height } = container.getBoundingClientRect();
    const sidebarBreakpoint =
      this.props.UIOptions.dockedSidebarBreakpoint != null
        ? this.props.UIOptions.dockedSidebarBreakpoint
        : MQ_RIGHT_SIDEBAR_MIN_WIDTH;
    this.device = updateObject(this.device, {
      isLandscape: width > height,
      isSmScreen: width < MQ_SM_MAX_WIDTH,
      isMobile:
        width < MQ_MAX_WIDTH_PORTRAIT ||
        (height < MQ_MAX_HEIGHT_LANDSCAPE && width < MQ_MAX_WIDTH_LANDSCAPE),
      canDeviceFitSidebar: width > sidebarBreakpoint
    });
  };

  public async componentDidMount() {
    this.unmounted = false;
    this.excalidrawContainerValue.container =
      this.excalidrawContainerRef.current;

    if (
      process.env.NODE_ENV === ENV.TEST ||
      process.env.NODE_ENV === ENV.DEVELOPMENT
    ) {
      const setState = this.setState.bind(this);
      Object.defineProperties(window.h, {
        state: {
          configurable: true,
          get: () => {
            return this.state;
          }
        },
        setState: {
          configurable: true,
          value: (...args: Parameters<typeof setState>) => {
            return this.setState(...args);
          }
        },
        app: {
          configurable: true,
          value: this
        },
        history: {
          configurable: true,
          value: this.history
        }
      });
    }

    this.scene.addCallback(this.onSceneUpdated);
    this.addEventListeners();

    if (this.props.autoFocus && this.excalidrawContainerRef.current) {
      this.focusContainer();
    }

    if (
      this.excalidrawContainerRef.current &&
      // bounding rects don't work in tests so updating
      // the state on init would result in making the test enviro run
      // in mobile breakpoint (0 width/height), making everything fail
      process.env.NODE_ENV !== "test"
    ) {
      this.refreshDeviceState(this.excalidrawContainerRef.current);
    }

    if ("ResizeObserver" in window && this.excalidrawContainerRef?.current) {
      this.resizeObserver = new ResizeObserver(() => {
        THROTTLE_NEXT_RENDER = false;
        // recompute device dimensions state
        // ---------------------------------------------------------------------
        this.refreshDeviceState(this.excalidrawContainerRef.current!);
        // refresh offsets
        // ---------------------------------------------------------------------
        this.updateDOMRect();
      });
      this.resizeObserver?.observe(this.excalidrawContainerRef.current);
    } else if (window.matchMedia) {
      const mdScreenQuery = window.matchMedia(
        `(max-width: ${MQ_MAX_WIDTH_PORTRAIT}px), (max-height: ${MQ_MAX_HEIGHT_LANDSCAPE}px) and (max-width: ${MQ_MAX_WIDTH_LANDSCAPE}px)`
      );
      const smScreenQuery = window.matchMedia(
        `(max-width: ${MQ_SM_MAX_WIDTH}px)`
      );
      const canDeviceFitSidebarMediaQuery = window.matchMedia(
        `(min-width: ${
          // NOTE this won't update if a different breakpoint is supplied
          // after mount
          this.props.UIOptions.dockedSidebarBreakpoint != null
            ? this.props.UIOptions.dockedSidebarBreakpoint
            : MQ_RIGHT_SIDEBAR_MIN_WIDTH
        }px)`
      );
      const handler = () => {
        this.excalidrawContainerRef.current!.getBoundingClientRect();
        this.device = updateObject(this.device, {
          isSmScreen: smScreenQuery.matches,
          isMobile: mdScreenQuery.matches,
          canDeviceFitSidebar: canDeviceFitSidebarMediaQuery.matches
        });
      };
      mdScreenQuery.addListener(handler);
      this.detachIsMobileMqHandler = () =>
        mdScreenQuery.removeListener(handler);
    }

    const searchParams = new URLSearchParams(window.location.search.slice(1));

    if (searchParams.has("web-share-target")) {
      // Obtain a file that was shared via the Web Share Target API.
      this.restoreFileFromShare();
    } else {
      this.updateDOMRect(this.initializeScene);
    }

    // note that this check seems to always pass in localhost
    if (isBrave() && !isMeasureTextSupported()) {
      this.setState({
        errorMessage: <BraveMeasureTextError />
      });
    }
  }

  public componentWillUnmount() {
    this.files = {};
    this.imageCache.clear();
    this.resizeObserver?.disconnect();
    this.unmounted = true;
    this.removeEventListeners();
    this.scene.destroy();
    this.library.destroy();
    clearTimeout(touchTimeout);
    isSomeLayerSelected.clearCache();
    touchTimeout = 0;
  }

  private onResize = withBatchedUpdates(() => {
    this.scene
      .getLayersIncludingDeleted()
      .forEach((layer) => invalidateShapeForLayer(layer));
    this.setState({});
  });

  private removeEventListeners() {
    document.removeEventListener(EVENT.POINTER_UP, this.removePointer);
    document.removeEventListener(EVENT.COPY, this.onCopy);
    document.removeEventListener(EVENT.PASTE, this.pasteFromClipboard);
    document.removeEventListener(EVENT.CUT, this.onCut);
    this.excalidrawContainerRef.current?.removeEventListener(
      EVENT.WHEEL,
      this.onWheel
    );
    this.nearestScrollableContainer?.removeEventListener(
      EVENT.SCROLL,
      this.onScroll
    );
    document.removeEventListener(EVENT.KEYDOWN, this.onKeyDown, false);
    document.removeEventListener(
      EVENT.MOUSE_MOVE,
      this.updateCurrentCursorPosition,
      false
    );
    document.removeEventListener(EVENT.KEYUP, this.onKeyUp);
    window.removeEventListener(EVENT.RESIZE, this.onResize, false);
    window.removeEventListener(EVENT.UNLOAD, this.onUnload, false);
    window.removeEventListener(EVENT.BLUR, this.onBlur, false);
    this.excalidrawContainerRef.current?.removeEventListener(
      EVENT.DRAG_OVER,
      this.disableEvent,
      false
    );
    this.excalidrawContainerRef.current?.removeEventListener(
      EVENT.DROP,
      this.disableEvent,
      false
    );

    document.removeEventListener(
      EVENT.GESTURE_START,
      this.onGestureStart as any,
      false
    );
    document.removeEventListener(
      EVENT.GESTURE_CHANGE,
      this.onGestureChange as any,
      false
    );
    document.removeEventListener(
      EVENT.GESTURE_END,
      this.onGestureEnd as any,
      false
    );

    this.detachIsMobileMqHandler?.();
  }

  private addEventListeners() {
    this.removeEventListeners();
    document.addEventListener(EVENT.POINTER_UP, this.removePointer); // #3553
    document.addEventListener(EVENT.COPY, this.onCopy);
    this.excalidrawContainerRef.current?.addEventListener(
      EVENT.WHEEL,
      this.onWheel,
      { passive: false }
    );

    if (this.props.handleKeyboardGlobally) {
      document.addEventListener(EVENT.KEYDOWN, this.onKeyDown, false);
    }
    document.addEventListener(EVENT.KEYUP, this.onKeyUp, { passive: true });
    document.addEventListener(
      EVENT.MOUSE_MOVE,
      this.updateCurrentCursorPosition
    );
    // rerender text layers on font load to fix #637 && #1553
    document.fonts?.addEventListener?.("loadingdone", (event) => {
      const loadedFontFaces = (event as FontFaceSetLoadEvent).fontfaces;
      this.fonts.onFontsLoaded(loadedFontFaces);
    });

    // Safari-only desktop pinch zoom
    document.addEventListener(
      EVENT.GESTURE_START,
      this.onGestureStart as any,
      false
    );
    document.addEventListener(
      EVENT.GESTURE_CHANGE,
      this.onGestureChange as any,
      false
    );
    document.addEventListener(
      EVENT.GESTURE_END,
      this.onGestureEnd as any,
      false
    );
    if (this.state.viewModeEnabled) {
      return;
    }

    document.addEventListener(EVENT.PASTE, this.pasteFromClipboard);
    document.addEventListener(EVENT.CUT, this.onCut);
    if (this.props.detectScroll) {
      this.nearestScrollableContainer = getNearestScrollableContainer(
        this.excalidrawContainerRef.current!
      );
      this.nearestScrollableContainer.addEventListener(
        EVENT.SCROLL,
        this.onScroll
      );
    }
    window.addEventListener(EVENT.RESIZE, this.onResize, false);
    window.addEventListener(EVENT.UNLOAD, this.onUnload, false);
    window.addEventListener(EVENT.BLUR, this.onBlur, false);
    this.excalidrawContainerRef.current?.addEventListener(
      EVENT.DRAG_OVER,
      this.disableEvent,
      false
    );
    this.excalidrawContainerRef.current?.addEventListener(
      EVENT.DROP,
      this.disableEvent,
      false
    );
  }

  componentDidUpdate(prevProps: AppProps, prevState: AppState) {
    if (
      !this.state.showWelcomeScreen &&
      !this.scene.getLayersIncludingDeleted().length
    ) {
      this.setState({ showWelcomeScreen: true });
    }

    if (
      this.excalidrawContainerRef.current &&
      prevProps.UIOptions.dockedSidebarBreakpoint !==
        this.props.UIOptions.dockedSidebarBreakpoint
    ) {
      this.refreshDeviceState(this.excalidrawContainerRef.current);
    }

    if (
      prevState.scrollX !== this.state.scrollX ||
      prevState.scrollY !== this.state.scrollY
    ) {
      this.props?.onScrollChange?.(this.state.scrollX, this.state.scrollY);
    }

    if (
      Object.keys(this.state.selectedLayerIds).length &&
      isEraserActive(this.state)
    ) {
      this.setState({
        activeTool: updateActiveTool(this.state, { type: "selection" })
      });
    }
    if (
      this.state.activeTool.type === "eraser" &&
      prevState.theme !== this.state.theme
    ) {
      setEraserCursor(this.canvas, this.state.theme);
    }
    // Hide hyperlink popup if shown when layer type is not selection
    if (
      prevState.activeTool.type === "selection" &&
      this.state.activeTool.type !== "selection" &&
      this.state.showHyperlinkPopup
    ) {
      this.setState({ showHyperlinkPopup: false });
    }
    if (prevProps.langCode !== this.props.langCode) {
      this.updateLanguage();
    }

    if (prevProps.viewModeEnabled !== this.props.viewModeEnabled) {
      this.setState({ viewModeEnabled: !!this.props.viewModeEnabled });
    }

    if (prevState.viewModeEnabled !== this.state.viewModeEnabled) {
      this.addEventListeners();
      this.deselectLayers();
    }

    if (prevProps.zenModeEnabled !== this.props.zenModeEnabled) {
      this.setState({ zenModeEnabled: !!this.props.zenModeEnabled });
    }

    if (prevProps.theme !== this.props.theme && this.props.theme) {
      this.setState({ theme: this.props.theme });
    }

    if (prevProps.gridModeEnabled !== this.props.gridModeEnabled) {
      this.setState({
        gridSize: this.props.gridModeEnabled ? GRID_SIZE : null
      });
    }

    if (this.props.name && prevProps.name !== this.props.name) {
      this.setState({
        name: this.props.name
      });
    }

    this.excalidrawContainerRef.current?.classList.toggle(
      "theme--dark",
      this.state.theme === "dark"
    );

    if (
      this.state.editingLinearLayer &&
      !this.state.selectedLayerIds[this.state.editingLinearLayer.layerId]
    ) {
      // defer so that the commitToHistory flag isn't reset via current update
      setTimeout(() => {
        // execute only if the condition still holds when the deferred callback
        // executes (it can be scheduled multiple times depending on how
        // many times the component renders)
        this.state.editingLinearLayer &&
          this.actionManager.executeAction(actionFinalize);
      });
    }

    // failsafe in case the state is being updated in incorrect order resulting
    // in the editingLayer being now a deleted layer
    if (this.state.editingLayer?.isDeleted) {
      this.setState({ editingLayer: null });
    }

    if (
      this.state.selectedLinearLayer &&
      !this.state.selectedLayerIds[this.state.selectedLinearLayer.layerId]
    ) {
      // To make sure `selectedLinearLayer` is in sync with `selectedLayerIds`, however this shouldn't be needed once
      // we have a single API to update `selectedLayerIds`
      this.setState({ selectedLinearLayer: null });
    }

    const { multiLayer } = prevState;
    if (
      prevState.activeTool !== this.state.activeTool &&
      multiLayer != null &&
      isBindingEnabled(this.state) &&
      isBindingLayer(multiLayer, false)
    ) {
      maybeBindLinearLayer(
        multiLayer,
        this.state,
        this.scene,
        tupleToCoors(
          LinearLayerEditor.getPointAtIndexGlobalCoordinates(multiLayer, -1)
        )
      );
    }
    this.renderScene();
    this.history.record(this.state, this.scene.getLayersIncludingDeleted());

    // Do not notify consumers if we're still loading the scene. Among other
    // potential issues, this fixes a case where the tab isn't focused during
    // init, which would trigger onChange with empty layers, which would then
    // override whatever is in localStorage currently.
    if (!this.state.isLoading) {
      this.props.onChange?.(
        this.scene.getLayersIncludingDeleted(),
        this.state,
        this.files
      );
    }
  }

  private renderScene = () => {
    const cursorButton: {
      [id: string]: string | undefined;
    } = {};
    const pointerViewportCoords: RenderConfig["remotePointerViewportCoords"] =
      {};
    const remoteSelectedLayerIds: RenderConfig["remoteSelectedLayerIds"] = {};
    const pointerUsernames: { [id: string]: string } = {};
    const pointerUserStates: { [id: string]: string } = {};
    this.state.collaborators.forEach((user, socketId) => {
      if (user.selectedLayerIds) {
        for (const id of Object.keys(user.selectedLayerIds)) {
          if (!(id in remoteSelectedLayerIds)) {
            remoteSelectedLayerIds[id] = [];
          }
          remoteSelectedLayerIds[id].push(socketId);
        }
      }
      if (!user.pointer) {
        return;
      }
      if (user.username) {
        pointerUsernames[socketId] = user.username;
      }
      if (user.userState) {
        pointerUserStates[socketId] = user.userState;
      }
      pointerViewportCoords[socketId] = sceneCoordsToViewportCoords(
        {
          sceneX: user.pointer.x,
          sceneY: user.pointer.y
        },
        this.state
      );
      cursorButton[socketId] = user.button;
    });

    const renderingLayers = this.scene.getNonDeletedLayers().filter((layer) => {
      if (isImageLayer(layer)) {
        if (
          // not placed on canvas yet (but in layers array)
          this.state.pendingImageLayerId === layer.id
        ) {
          return false;
        }
      }
      // don't render text layer that's being currently edited (it's
      // rendered on remote only)
      return (
        !this.state.editingLayer ||
        this.state.editingLayer.type !== "text" ||
        layer.id !== this.state.editingLayer.id
      );
    });

    const selectionColor = getComputedStyle(
      document.querySelector(".excalidraw")!
    ).getPropertyValue("--color-selection");

    renderScene(
      {
        layers: renderingLayers,
        appState: this.state,
        scale: window.devicePixelRatio,
        rc: this.rc!,
        canvas: this.canvas!,
        renderConfig: {
          selectionColor,
          scrollX: this.state.scrollX,
          scrollY: this.state.scrollY,
          viewBackgroundColor: this.state.viewBackgroundColor,
          zoom: this.state.zoom,
          remotePointerViewportCoords: pointerViewportCoords,
          remotePointerButton: cursorButton,
          remoteSelectedLayerIds,
          remotePointerUsernames: pointerUsernames,
          remotePointerUserStates: pointerUserStates,
          shouldCacheIgnoreZoom: this.state.shouldCacheIgnoreZoom,
          theme: this.state.theme,
          imageCache: this.imageCache,
          isExporting: false,
          renderScrollbars: false
        },
        callback: ({ atLeastOneVisibleLayer, scrollBars }) => {
          if (scrollBars) {
            currentScrollBars = scrollBars;
          }
          const scrolledOutside =
            // hide when editing text
            isTextLayer(this.state.editingLayer)
              ? false
              : !atLeastOneVisibleLayer && renderingLayers.length > 0;
          if (this.state.scrolledOutside !== scrolledOutside) {
            this.setState({ scrolledOutside });
          }

          this.scheduleImageRefresh();
        }
      },
      THROTTLE_NEXT_RENDER && window.EXCALIDRAW_THROTTLE_RENDER === true
    );

    if (!THROTTLE_NEXT_RENDER) {
      THROTTLE_NEXT_RENDER = true;
    }
  };

  private onScroll = debounce(() => {
    const { offsetTop, offsetLeft } = this.getCanvasOffsets();
    this.setState((state) => {
      if (state.offsetLeft === offsetLeft && state.offsetTop === offsetTop) {
        return null;
      }
      return { offsetTop, offsetLeft };
    });
  }, SCROLL_TIMEOUT);

  // Copy/paste

  private onCut = withBatchedUpdates((event: ClipboardEvent) => {
    const isExcalidrawActive = this.excalidrawContainerRef.current?.contains(
      document.activeLayer
    );
    if (!isExcalidrawActive || isWritableLayer(event.target)) {
      return;
    }
    this.cutAll();
    event.preventDefault();
    event.stopPropagation();
  });

  private onCopy = withBatchedUpdates((event: ClipboardEvent) => {
    const isExcalidrawActive = this.excalidrawContainerRef.current?.contains(
      document.activeLayer
    );
    if (!isExcalidrawActive || isWritableLayer(event.target)) {
      return;
    }
    this.copyAll();
    event.preventDefault();
    event.stopPropagation();
  });

  private cutAll = () => {
    this.actionManager.executeAction(actionCut, "keyboard");
  };

  private copyAll = () => {
    this.actionManager.executeAction(actionCopy, "keyboard");
  };

  private static resetTapTwice() {
    didTapTwice = false;
  }

  private onTapStart = (event: TouchEvent) => {
    // fix for Apple Pencil Scribble
    // On Android, preventing the event would disable contextMenu on tap-hold
    if (!isAndroid) {
      event.preventDefault();
    }

    if (!didTapTwice) {
      didTapTwice = true;
      clearTimeout(tappedTwiceTimer);
      tappedTwiceTimer = window.setTimeout(
        App.resetTapTwice,
        TAP_TWICE_TIMEOUT
      );
      return;
    }
    // insert text only if we tapped twice with a single finger
    // event.touches.length === 1 will also prevent inserting text when user's zooming
    if (didTapTwice && event.touches.length === 1) {
      const [touch] = event.touches;
      // @ts-ignore
      this.handleCanvasDoubleClick({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      didTapTwice = false;
      clearTimeout(tappedTwiceTimer);
    }
    if (isAndroid) {
      event.preventDefault();
    }

    if (event.touches.length === 2) {
      this.setState({
        selectedLayerIds: makeNextSelectedLayerIds({}, this.state)
      });
    }
  };

  private onTapEnd = (event: TouchEvent) => {
    this.resetContextMenuTimer();
    if (event.touches.length > 0) {
      this.setState({
        previousSelectedLayerIds: {},
        selectedLayerIds: makeNextSelectedLayerIds(
          this.state.previousSelectedLayerIds,
          this.state
        )
      });
    } else {
      gesture.pointers.clear();
    }
  };

  public pasteFromClipboard = withBatchedUpdates(
    async (event: ClipboardEvent | null) => {
      const isPlainPaste = !!(IS_PLAIN_PASTE && event);

      // #686
      const target = document.activeLayer;
      const isExcalidrawActive =
        this.excalidrawContainerRef.current?.contains(target);
      if (event && !isExcalidrawActive) {
        return;
      }

      const layerUnderCursor = document.layerFromPoint(
        this.lastViewportPosition.x,
        this.lastViewportPosition.y
      );
      if (
        event &&
        (!(layerUnderCursor instanceof HTMLCanvasLayer) ||
          isWritableLayer(target))
      ) {
        return;
      }

      // must be called in the same frame (thus before any awaits) as the paste
      // event else some browsers (FF...) will clear the clipboardData
      // (something something security)
      let file = event?.clipboardData?.files[0];

      const data = await parseClipboard(event, isPlainPaste);

      if (!file && data.text && !isPlainPaste) {
        const string = data.text.trim();
        if (string.startsWith("<svg") && string.endsWith("</svg>")) {
          // ignore SVG validation/normalization which will be done during image
          // initialization
          file = SVGStringToFile(string);
        }
      }

      // prefer spreadsheet data over image file (MS Office/Libre Office)
      if (isSupportedImageFile(file) && !data.spreadsheet) {
        const { x: sceneX, y: sceneY } = viewportCoordsToSceneCoords(
          {
            clientX: this.lastViewportPosition.x,
            clientY: this.lastViewportPosition.y
          },
          this.state
        );

        const imageLayer = this.createImageLayer({ sceneX, sceneY });
        this.insertImageLayer(imageLayer, file);
        this.initializeImageDimensions(imageLayer);
        this.setState({
          selectedLayerIds: makeNextSelectedLayerIds(
            {
              [imageLayer.id]: true
            },
            this.state
          )
        });

        return;
      }

      if (this.props.onPaste) {
        try {
          if ((await this.props.onPaste(data, event)) === false) {
            return;
          }
        } catch (error: any) {
          console.error(error);
        }
      }

      if (data.errorMessage) {
        this.setState({ errorMessage: data.errorMessage });
      } else if (data.spreadsheet && !isPlainPaste) {
        this.setState({
          pasteDialog: {
            data: data.spreadsheet,
            shown: true
          }
        });
      } else if (data.layers) {
        // TODO remove formatting from layers if isPlainPaste
        this.addLayersFromPasteOrLibrary({
          layers: data.layers,
          files: data.files || null,
          position: "cursor",
          retainSeed: isPlainPaste
        });
      } else if (data.text) {
        this.addTextFromPaste(data.text, isPlainPaste);
      }
      this.setActiveTool({ type: "selection" });
      event?.preventDefault();
    }
  );

  private addLayersFromPasteOrLibrary = (opts: {
    files: BinaryFiles | null;
    layers: readonly ExcalidrawLayer[];
    position: { clientX: number; clientY: number } | "cursor" | "center";
    retainSeed?: boolean;
  }) => {
    const layers = restoreLayers(opts.layers, null);
    const [minX, minY, maxX, maxY] = getCommonBounds(layers);

    const layersCenterX = distance(minX, maxX) / 2;
    const layersCenterY = distance(minY, maxY) / 2;

    const clientX =
      typeof opts.position === "object"
        ? opts.position.clientX
        : opts.position === "cursor"
        ? this.lastViewportPosition.x
        : this.state.width / 2 + this.state.offsetLeft;
    const clientY =
      typeof opts.position === "object"
        ? opts.position.clientY
        : opts.position === "cursor"
        ? this.lastViewportPosition.y
        : this.state.height / 2 + this.state.offsetTop;

    const { x, y } = viewportCoordsToSceneCoords(
      { clientX, clientY },
      this.state
    );

    const dx = x - layersCenterX;
    const dy = y - layersCenterY;

    const [gridX, gridY] = getGridPoint(dx, dy, this.state.gridSize);

    const newLayers = duplicateLayers(
      layers.map((layer) =>
        newLayerWith(layer, {
          x: layer.x + gridX - minX,
          y: layer.y + gridY - minY
        })
      ),
      {
        randomizeSeed: !opts.retainSeed
      }
    );

    const nextLayers = [
      ...this.scene.getLayersIncludingDeleted(),
      ...newLayers
    ];

    this.scene.replaceAllLayers(nextLayers);

    newLayers.forEach((newLayer) => {
      if (isTextLayer(newLayer) && isBoundToContainer(newLayer)) {
        const container = getContainerLayer(newLayer);
        redrawTextBoundingBox(newLayer, container);
      }
    });

    if (opts.files) {
      this.files = { ...this.files, ...opts.files };
    }

    this.history.resumeRecording();

    const nextLayersToSelect = excludeLayersInFramesFromSelection(newLayers);

    this.setState(
      selectGroupsForSelectedLayers(
        {
          ...this.state,
          // keep sidebar (presumably the library) open if it's docked and
          // can fit.
          //
          // Note, we should close the sidebar only if we're dropping items
          // from library, not when pasting from clipboard. Alas.
          openSidebar:
            this.state.openSidebar &&
            this.device.canDeviceFitSidebar &&
            this.state.defaultSidebarDockedPreference
              ? this.state.openSidebar
              : null,
          selectedLayerIds: nextLayersToSelect.reduce(
            (acc: Record<ExcalidrawLayer["id"], true>, layer) => {
              if (!isBoundToContainer(layer)) {
                acc[layer.id] = true;
              }
              return acc;
            },
            {}
          ),
          selectedGroupIds: {}
        },
        this.scene.getNonDeletedLayers(),
        this.state
      ),
      () => {
        if (opts.files) {
          this.addNewImagesToImageCache();
        }
      }
    );
    this.setActiveTool({ type: "selection" });
  };

  private addTextFromPaste(text: string, isPlainPaste = false) {
    const { x, y } = viewportCoordsToSceneCoords(
      {
        clientX: this.lastViewportPosition.x,
        clientY: this.lastViewportPosition.y
      },
      this.state
    );

    const textLayerProps = {
      x,
      y,
      strokeColor: this.state.currentItemStrokeColor,
      backgroundColor: this.state.currentItemBackgroundColor,
      fillStyle: this.state.currentItemFillStyle,
      strokeWidth: this.state.currentItemStrokeWidth,
      strokeStyle: this.state.currentItemStrokeStyle,
      roundness: null,
      roughness: this.state.currentItemRoughness,
      opacity: this.state.currentItemOpacity,
      text,
      fontSize: this.state.currentItemFontSize,
      fontFamily: this.state.currentItemFontFamily,
      textAlign: this.state.currentItemTextAlign,
      verticalAlign: DEFAULT_VERTICAL_ALIGN,
      locked: false
    };

    const LINE_GAP = 10;
    let currentY = y;

    const lines = isPlainPaste ? [text] : text.split("\n");
    const textLayers = lines.reduce((acc: ExcalidrawTextLayer[], line, idx) => {
      const text = line.trim();

      const lineHeight = getDefaultLineHeight(textLayerProps.fontFamily);
      if (text.length) {
        const topLayerFrame = this.getTopLayerFrameAtSceneCoords({
          x,
          y: currentY
        });

        const layer = newTextLayer({
          ...textLayerProps,
          x,
          y: currentY,
          text,
          lineHeight,
          frameId: topLayerFrame ? topLayerFrame.id : null
        });
        acc.push(layer);
        currentY += layer.height + LINE_GAP;
      } else {
        const prevLine = lines[idx - 1]?.trim();
        // add paragraph only if previous line was not empty, IOW don't add
        // more than one empty line
        if (prevLine) {
          currentY +=
            getLineHeightInPx(textLayerProps.fontSize, lineHeight) + LINE_GAP;
        }
      }

      return acc;
    }, []);

    if (textLayers.length === 0) {
      return;
    }

    const frameId = textLayers[0].frameId;

    if (frameId) {
      this.scene.insertLayersAtIndex(
        textLayers,
        this.scene.getLayerIndex(frameId)
      );
    } else {
      this.scene.replaceAllLayers([
        ...this.scene.getLayersIncludingDeleted(),
        ...textLayers
      ]);
    }

    this.setState({
      selectedLayerIds: makeNextSelectedLayerIds(
        Object.fromEntries(textLayers.map((el) => [el.id, true])),
        this.state
      )
    });

    if (
      !isPlainPaste &&
      textLayers.length > 1 &&
      PLAIN_PASTE_TOAST_SHOWN === false &&
      !this.device.isMobile
    ) {
      this.setToast({
        message: t("toast.pasteAsSingleLayer", {
          shortcut: getShortcutKey("CtrlOrCmd+Shift+V")
        }),
        duration: 5000
      });
      PLAIN_PASTE_TOAST_SHOWN = true;
    }

    this.history.resumeRecording();
  }

  setAppState: React.Component<any, AppState>["setState"] = (
    state,
    callback
  ) => {
    this.setState(state, callback);
  };

  removePointer = (event: React.PointerEvent<HTMLLayer> | PointerEvent) => {
    if (touchTimeout) {
      this.resetContextMenuTimer();
    }

    gesture.pointers.delete(event.pointerId);
  };

  toggleLock = (source: "keyboard" | "ui" = "ui") => {
    if (!this.state.activeTool.locked) {
      trackEvent(
        "toolbar",
        "toggleLock",
        `${source} (${this.device.isMobile ? "mobile" : "desktop"})`
      );
    }
    this.setState((prevState) => {
      return {
        activeTool: {
          ...prevState.activeTool,
          ...updateActiveTool(
            this.state,
            prevState.activeTool.locked
              ? { type: "selection" }
              : prevState.activeTool
          ),
          locked: !prevState.activeTool.locked
        }
      };
    });
  };

  updateFrameRendering = (
    opts:
      | Partial<AppState["frameRendering"]>
      | ((
          prevState: AppState["frameRendering"]
        ) => Partial<AppState["frameRendering"]>)
  ) => {
    this.setState((prevState) => {
      const next =
        typeof opts === "function" ? opts(prevState.frameRendering) : opts;
      return {
        frameRendering: {
          enabled: next?.enabled ?? prevState.frameRendering.enabled,
          clip: next?.clip ?? prevState.frameRendering.clip,
          name: next?.name ?? prevState.frameRendering.name,
          outline: next?.outline ?? prevState.frameRendering.outline
        }
      };
    });
  };

  togglePenMode = () => {
    this.setState((prevState) => ({
      penMode: !prevState.penMode
    }));
  };

  onHandToolToggle = () => {
    this.actionManager.executeAction(actionToggleHandTool);
  };

  /**
   * Zooms on canvas viewport center
   */
  zoomCanvas = (
    /** decimal fraction between 0.1 (10% zoom) and 30 (3000% zoom) */
    value: number
  ) => {
    this.setState({
      ...getStateForZoom(
        {
          viewportX: this.state.width / 2 + this.state.offsetLeft,
          viewportY: this.state.height / 2 + this.state.offsetTop,
          nextZoom: getNormalizedZoom(value)
        },
        this.state
      )
    });
  };

  private cancelInProgresAnimation: (() => void) | null = null;

  scrollToContent = (
    target:
      | ExcalidrawLayer
      | readonly ExcalidrawLayer[] = this.scene.getNonDeletedLayers(),
    opts?:
      | {
          animate?: boolean;
          duration?: number;
          fitToContent?: boolean;
          fitToViewport?: never;
          viewportZoomFactor?: never;
        }
      | {
          animate?: boolean;
          duration?: number;
          fitToContent?: never;
          fitToViewport?: boolean;
          /** when fitToViewport=true, how much screen should the content cover,
           * between 0.1 (10%) and 1 (100%)
           */
          viewportZoomFactor?: number;
        }
  ) => {
    this.cancelInProgresAnimation?.();

    // convert provided target into ExcalidrawLayer[] if necessary
    const targetLayers = Array.isArray(target) ? target : [target];

    let zoom = this.state.zoom;
    let scrollX = this.state.scrollX;
    let scrollY = this.state.scrollY;

    if (opts?.fitToContent || opts?.fitToViewport) {
      const { appState } = zoomToFit({
        targetLayers,
        appState: this.state,
        fitToViewport: !!opts?.fitToViewport,
        viewportZoomFactor: opts?.viewportZoomFactor
      });
      zoom = appState.zoom;
      scrollX = appState.scrollX;
      scrollY = appState.scrollY;
    } else {
      // compute only the viewport location, without any zoom adjustment
      const scroll = calculateScrollCenter(
        targetLayers,
        this.state,
        this.canvas
      );
      scrollX = scroll.scrollX;
      scrollY = scroll.scrollY;
    }

    // when animating, we use RequestAnimationFrame to prevent the animation
    // from slowing down other processes
    if (opts?.animate) {
      const origScrollX = this.state.scrollX;
      const origScrollY = this.state.scrollY;
      const origZoom = this.state.zoom.value;

      const cancel = easeToValuesRAF({
        fromValues: {
          scrollX: origScrollX,
          scrollY: origScrollY,
          zoom: origZoom
        },
        toValues: { scrollX, scrollY, zoom: zoom.value },
        interpolateValue: (from, to, progress, key) => {
          // for zoom, use different easing
          if (key === "zoom") {
            return from * Math.pow(to / from, easeOut(progress));
          }
          // handle using default
          return undefined;
        },
        onStep: ({ scrollX, scrollY, zoom }) => {
          this.setState({
            scrollX,
            scrollY,
            zoom: { value: zoom }
          });
        },
        onStart: () => {
          this.setState({ shouldCacheIgnoreZoom: true });
        },
        onEnd: () => {
          this.setState({ shouldCacheIgnoreZoom: false });
        },
        onCancel: () => {
          this.setState({ shouldCacheIgnoreZoom: false });
        },
        duration: opts?.duration ?? 500
      });

      this.cancelInProgresAnimation = () => {
        cancel();
        this.cancelInProgresAnimation = null;
      };
    } else {
      this.setState({ scrollX, scrollY, zoom });
    }
  };

  /** use when changing scrollX/scrollY/zoom based on user interaction */
  private translateCanvas: React.Component<any, AppState>["setState"] = (
    state
  ) => {
    this.cancelInProgresAnimation?.();
    this.setState(state);
  };

  setToast = (
    toast: {
      closable?: boolean;
      duration?: number;
      message: string;
    } | null
  ) => {
    this.setState({ toast });
  };

  restoreFileFromShare = async () => {
    try {
      const webShareTargetCache = await caches.open("web-share-target");

      const response = await webShareTargetCache.match("shared-file");
      if (response) {
        const blob = await response.blob();
        const file = new File([blob], blob.name || "", { type: blob.type });
        this.loadFileToCanvas(file, null);
        await webShareTargetCache.delete("shared-file");
        window.history.replaceState(null, APP_NAME, window.location.pathname);
      }
    } catch (error: any) {
      this.setState({ errorMessage: error.message });
    }
  };

  /** adds supplied files to existing files in the appState */
  public addFiles: ExcalidrawImperativeAPI["addFiles"] = withBatchedUpdates(
    (files) => {
      const filesMap = files.reduce((acc, fileData) => {
        acc.set(fileData.id, fileData);
        return acc;
      }, new Map<FileId, BinaryFileData>());

      this.files = { ...this.files, ...Object.fromEntries(filesMap) };

      this.scene.getNonDeletedLayers().forEach((layer) => {
        if (isInitializedImageLayer(layer) && filesMap.has(layer.fileId)) {
          this.imageCache.delete(layer.fileId);
          invalidateShapeForLayer(layer);
        }
      });
      this.scene.informMutation();

      this.addNewImagesToImageCache();
    }
  );

  public updateScene = withBatchedUpdates(
    <K extends keyof AppState>(sceneData: {
      appState?: Pick<AppState, K> | null;
      collaborators?: SceneData["collaborators"];
      commitToHistory?: SceneData["commitToHistory"];
      layers?: SceneData["layers"];
    }) => {
      if (sceneData.commitToHistory) {
        this.history.resumeRecording();
      }

      if (sceneData.appState) {
        this.setState(sceneData.appState);
      }

      if (sceneData.layers) {
        this.scene.replaceAllLayers(sceneData.layers);
      }

      if (sceneData.collaborators) {
        this.setState({ collaborators: sceneData.collaborators });
      }
    }
  );

  private onSceneUpdated = () => {
    this.setState({});
  };

  /**
   * @returns whether the menu was toggled on or off
   */
  public toggleSidebar = ({
    name,
    tab,
    force
  }: {
    force?: boolean;
    name: SidebarName;
    tab?: SidebarTabName;
  }): boolean => {
    let nextName;
    if (force === undefined) {
      nextName = this.state.openSidebar?.name === name ? null : name;
    } else {
      nextName = force ? name : null;
    }
    this.setState({ openSidebar: nextName ? { name: nextName, tab } : null });

    return !!nextName;
  };

  private updateCurrentCursorPosition = withBatchedUpdates(
    (event: MouseEvent) => {
      this.lastViewportPosition.x = event.clientX;
      this.lastViewportPosition.y = event.clientY;
    }
  );

  // Input handling
  private onKeyDown = withBatchedUpdates(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      // normalize `event.key` when CapsLock is pressed #2372

      if (
        "Proxy" in window &&
        ((!event.shiftKey && /^[A-Z]$/.test(event.key)) ||
          (event.shiftKey && /^[a-z]$/.test(event.key)))
      ) {
        event = new Proxy(event, {
          get(ev: any, prop) {
            const value = ev[prop];
            if (typeof value === "function") {
              // fix for Proxies hijacking `this`
              return value.bind(ev);
            }
            return prop === "key"
              ? // CapsLock inverts capitalization based on ShiftKey, so invert
                // it back
                event.shiftKey
                ? ev.key.toUpperCase()
                : ev.key.toLowerCase()
              : value;
          }
        });
      }

      if (event[KEYS.CTRL_OR_CMD] && event.key.toLowerCase() === KEYS.V) {
        IS_PLAIN_PASTE = event.shiftKey;
        clearTimeout(IS_PLAIN_PASTE_TIMER);
        // reset (100ms to be safe that we it runs after the ensuing
        // paste event). Though, technically unnecessary to reset since we
        // (re)set the flag before each paste event.
        IS_PLAIN_PASTE_TIMER = window.setTimeout(() => {
          IS_PLAIN_PASTE = false;
        }, 100);
      }

      // prevent browser zoom in input fields
      if (event[KEYS.CTRL_OR_CMD] && isWritableLayer(event.target)) {
        if (event.code === CODES.MINUS || event.code === CODES.EQUAL) {
          event.preventDefault();
          return;
        }
      }

      // bail if
      if (
        // inside an input
        (isWritableLayer(event.target) &&
          // unless pressing escape (finalize action)
          event.key !== KEYS.ESCAPE) ||
        // or unless using arrows (to move between buttons)
        (isArrowKey(event.key) && isInputLike(event.target))
      ) {
        return;
      }

      if (event.key === KEYS.QUESTION_MARK) {
        this.setState({
          openDialog: "help"
        });
        return;
      } else if (
        event.key.toLowerCase() === KEYS.E &&
        event.shiftKey &&
        event[KEYS.CTRL_OR_CMD]
      ) {
        event.preventDefault();
        this.setState({ openDialog: "imageExport" });
        return;
      }

      if (event.key === KEYS.PAGE_UP || event.key === KEYS.PAGE_DOWN) {
        let offset =
          (event.shiftKey ? this.state.width : this.state.height) /
          this.state.zoom.value;
        if (event.key === KEYS.PAGE_DOWN) {
          offset = -offset;
        }
        if (event.shiftKey) {
          this.translateCanvas((state) => ({
            scrollX: state.scrollX + offset
          }));
        } else {
          this.translateCanvas((state) => ({
            scrollY: state.scrollY + offset
          }));
        }
      }

      if (this.actionManager.handleKeyDown(event)) {
        return;
      }

      if (this.state.viewModeEnabled) {
        return;
      }

      if (event[KEYS.CTRL_OR_CMD] && this.state.isBindingEnabled) {
        this.setState({ isBindingEnabled: false });
      }

      if (isArrowKey(event.key)) {
        const step =
          (this.state.gridSize &&
            (event.shiftKey
              ? ELEMENT_TRANSLATE_AMOUNT
              : this.state.gridSize)) ||
          (event.shiftKey
            ? ELEMENT_SHIFT_TRANSLATE_AMOUNT
            : ELEMENT_TRANSLATE_AMOUNT);

        let offsetX = 0;
        let offsetY = 0;

        if (event.key === KEYS.ARROW_LEFT) {
          offsetX = -step;
        } else if (event.key === KEYS.ARROW_RIGHT) {
          offsetX = step;
        } else if (event.key === KEYS.ARROW_UP) {
          offsetY = -step;
        } else if (event.key === KEYS.ARROW_DOWN) {
          offsetY = step;
        }

        const selectedLayers = getSelectedLayers(
          this.scene.getNonDeletedLayers(),
          this.state,
          {
            includeBoundTextLayer: true,
            includeLayersInFrames: true
          }
        );

        selectedLayers.forEach((layer) => {
          mutateLayer(layer, {
            x: layer.x + offsetX,
            y: layer.y + offsetY
          });

          updateBoundLayers(layer, {
            simultaneouslyUpdated: selectedLayers
          });
        });

        this.maybeSuggestBindingForAll(selectedLayers);

        event.preventDefault();
      } else if (event.key === KEYS.ENTER) {
        const selectedLayers = getSelectedLayers(
          this.scene.getNonDeletedLayers(),
          this.state
        );
        if (selectedLayers.length === 1) {
          const selectedLayer = selectedLayers[0];
          if (event[KEYS.CTRL_OR_CMD]) {
            if (isLinearLayer(selectedLayer)) {
              if (
                !this.state.editingLinearLayer ||
                this.state.editingLinearLayer.layerId !== selectedLayers[0].id
              ) {
                this.history.resumeRecording();
                this.setState({
                  editingLinearLayer: new LinearLayerEditor(
                    selectedLayer,
                    this.scene
                  )
                });
              }
            }
          } else if (
            isTextLayer(selectedLayer) ||
            isValidTextContainer(selectedLayer)
          ) {
            let container;
            if (!isTextLayer(selectedLayer)) {
              container = selectedLayer as ExcalidrawTextContainer;
            }
            const midPoint = getContainerCenter(selectedLayer, this.state);
            const sceneX = midPoint.x;
            const sceneY = midPoint.y;
            this.startTextEditing({
              sceneX,
              sceneY,
              container
            });
            event.preventDefault();
            return;
          } else if (isFrameLayer(selectedLayer)) {
            this.setState({
              editingFrame: selectedLayer.id
            });
          }
        }
      } else if (
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        this.state.draggingLayer === null
      ) {
        const shape = findShapeByKey(event.key);
        if (shape) {
          if (this.state.activeTool.type !== shape) {
            trackEvent(
              "toolbar",
              shape,
              `keyboard (${this.device.isMobile ? "mobile" : "desktop"})`
            );
          }
          this.setActiveTool({ type: shape });
          event.stopPropagation();
        } else if (event.key === KEYS.Q) {
          this.toggleLock("keyboard");
          event.stopPropagation();
        }
      }
      if (event.key === KEYS.SPACE && gesture.pointers.size === 0) {
        isHoldingSpace = true;
        setCursor(this.canvas, CURSOR_TYPE.GRAB);
        event.preventDefault();
      }

      if (
        (event.key === KEYS.G || event.key === KEYS.S) &&
        !event.altKey &&
        !event[KEYS.CTRL_OR_CMD]
      ) {
        const selectedLayers = getSelectedLayers(
          this.scene.getNonDeletedLayers(),
          this.state
        );
        if (
          this.state.activeTool.type === "selection" &&
          !selectedLayers.length
        ) {
          return;
        }

        if (
          event.key === KEYS.G &&
          (hasBackground(this.state.activeTool.type) ||
            selectedLayers.some((layer) => hasBackground(layer.type)))
        ) {
          this.setState({ openPopup: "layerBackground" });
          event.stopPropagation();
        }
        if (event.key === KEYS.S) {
          this.setState({ openPopup: "layerStroke" });
          event.stopPropagation();
        }
      }

      if (
        event[KEYS.CTRL_OR_CMD] &&
        (event.key === KEYS.BACKSPACE || event.key === KEYS.DELETE)
      ) {
        jotaiStore.set(activeConfirmDialogAtom, "clearCanvas");
      }

      // eye dropper
      // -----------------------------------------------------------------------
      const lowerCased = event.key.toLocaleLowerCase();
      const isPickingStroke = lowerCased === KEYS.S && event.shiftKey;
      const isPickingBackground =
        event.key === KEYS.I || (lowerCased === KEYS.G && event.shiftKey);

      if (isPickingStroke || isPickingBackground) {
        this.openEyeDropper({
          type: isPickingStroke ? "stroke" : "background"
        });
      }
      // -----------------------------------------------------------------------
    }
  );

  private onWheel = withBatchedUpdates((event: WheelEvent) => {
    // prevent browser pinch zoom on DOM layers
    if (!(event.target instanceof HTMLCanvasLayer) && event.ctrlKey) {
      event.preventDefault();
    }
  });

  private onKeyUp = withBatchedUpdates((event: KeyboardEvent) => {
    if (event.key === KEYS.SPACE) {
      if (this.state.viewModeEnabled) {
        setCursor(this.canvas, CURSOR_TYPE.GRAB);
      } else if (this.state.activeTool.type === "selection") {
        resetCursor(this.canvas);
      } else {
        setCursorForShape(this.canvas, this.state);
        this.setState({
          selectedLayerIds: makeNextSelectedLayerIds({}, this.state),
          selectedGroupIds: {},
          editingGroupId: null
        });
      }
      isHoldingSpace = false;
    }
    if (!event[KEYS.CTRL_OR_CMD] && !this.state.isBindingEnabled) {
      this.setState({ isBindingEnabled: true });
    }
    if (isArrowKey(event.key)) {
      const selectedLayers = getSelectedLayers(
        this.scene.getNonDeletedLayers(),
        this.state
      );
      isBindingEnabled(this.state)
        ? bindOrUnbindSelectedLayers(selectedLayers)
        : unbindLinearLayers(selectedLayers);
      this.setState({ suggestedBindings: [] });
    }
  });

  private setActiveTool = (
    tool:
      | { type: (typeof SHAPES)[number]["value"] | "eraser" | "hand" | "frame" }
      | { customType: string; type: "custom" }
  ) => {
    const nextActiveTool = updateActiveTool(this.state, tool);
    if (nextActiveTool.type === "hand") {
      setCursor(this.canvas, CURSOR_TYPE.GRAB);
    } else if (!isHoldingSpace) {
      setCursorForShape(this.canvas, this.state);
    }
    if (isToolIcon(document.activeLayer)) {
      this.focusContainer();
    }
    if (!isLinearLayerType(nextActiveTool.type)) {
      this.setState({ suggestedBindings: [] });
    }
    if (nextActiveTool.type === "image") {
      this.onImageAction();
    }
    if (nextActiveTool.type !== "selection") {
      this.setState({
        activeTool: nextActiveTool,
        selectedLayerIds: makeNextSelectedLayerIds({}, this.state),
        selectedGroupIds: {},
        editingGroupId: null
      });
    } else {
      this.setState({ activeTool: nextActiveTool });
    }
  };

  private setCursor = (cursor: string) => {
    setCursor(this.canvas, cursor);
  };

  private resetCursor = () => {
    resetCursor(this.canvas);
  };
  /**
   * returns whether user is making a gesture with >= 2 fingers (points)
   * on o touch screen (not on a trackpad). Currently only relates to Darwin
   * (iOS/iPadOS,MacOS), but may work on other devices in the future if
   * GestureEvent is standardized.
   */
  private isTouchScreenMultiTouchGesture = () => gesture.pointers.size >= 2;

  // fires only on Safari
  private onGestureStart = withBatchedUpdates((event: GestureEvent) => {
    event.preventDefault();

    // we only want to deselect on touch screens because user may have selected
    // layers by mistake while zooming
    if (this.isTouchScreenMultiTouchGesture()) {
      this.setState({
        selectedLayerIds: makeNextSelectedLayerIds({}, this.state)
      });
    }
    gesture.initialScale = this.state.zoom.value;
  });

  // fires only on Safari
  private onGestureChange = withBatchedUpdates((event: GestureEvent) => {
    event.preventDefault();

    // onGestureChange only has zoom factor but not the center.
    // If we're on iPad or iPhone, then we recognize multi-touch and will
    // zoom in at the right location in the touchmove handler
    // (handleCanvasPointerMove).
    //
    // On Macbook trackpad, we don't have those events so will zoom in at the
    // current location instead.
    //
    // As such, bail from this handler on touch devices.
    if (this.isTouchScreenMultiTouchGesture()) {
      return;
    }

    const initialScale = gesture.initialScale;
    if (initialScale) {
      this.setState((state) => ({
        ...getStateForZoom(
          {
            viewportX: this.lastViewportPosition.x,
            viewportY: this.lastViewportPosition.y,
            nextZoom: getNormalizedZoom(initialScale * event.scale)
          },
          state
        )
      }));
    }
  });

  // fires only on Safari
  private onGestureEnd = withBatchedUpdates((event: GestureEvent) => {
    event.preventDefault();
    // reselect layers only on touch screens (see onGestureStart)
    if (this.isTouchScreenMultiTouchGesture()) {
      this.setState({
        previousSelectedLayerIds: {},
        selectedLayerIds: makeNextSelectedLayerIds(
          this.state.previousSelectedLayerIds,
          this.state
        )
      });
    }
    gesture.initialScale = null;
  });

  private handleTextWysiwyg(
    layer: ExcalidrawTextLayer,
    {
      isExistingLayer = false
    }: {
      isExistingLayer?: boolean;
    }
  ) {
    const updateLayer = (
      text: string,
      originalText: string,
      isDeleted: boolean
    ) => {
      this.scene.replaceAllLayers([
        ...this.scene.getLayersIncludingDeleted().map((_layer) => {
          if (_layer.id === layer.id && isTextLayer(_layer)) {
            return updateTextLayer(_layer, {
              text,
              isDeleted,
              originalText
            });
          }
          return _layer;
        })
      ]);
    };

    textWysiwyg({
      id: layer.id,
      canvas: this.canvas,
      getViewportCoords: (x, y) => {
        const { x: viewportX, y: viewportY } = sceneCoordsToViewportCoords(
          {
            sceneX: x,
            sceneY: y
          },
          this.state
        );
        return [
          viewportX - this.state.offsetLeft,
          viewportY - this.state.offsetTop
        ];
      },
      onChange: withBatchedUpdates((text) => {
        updateLayer(text, text, false);
        if (isNonDeletedLayer(layer)) {
          updateBoundLayers(layer);
        }
      }),
      onSubmit: withBatchedUpdates(({ text, viaKeyboard, originalText }) => {
        const isDeleted = !text.trim();
        updateLayer(text, originalText, isDeleted);
        // select the created text layer only if submitting via keyboard
        // (when submitting via click it should act as signal to deselect)
        if (!isDeleted && viaKeyboard) {
          const layerIdToSelect = layer.containerId
            ? layer.containerId
            : layer.id;
          this.setState((prevState) => ({
            selectedLayerIds: makeNextSelectedLayerIds(
              {
                ...prevState.selectedLayerIds,
                [layerIdToSelect]: true
              },
              prevState
            )
          }));
        }
        if (isDeleted) {
          fixBindingsAfterDeletion(this.scene.getNonDeletedLayers(), [layer]);
        }
        if (!isDeleted || isExistingLayer) {
          this.history.resumeRecording();
        }

        this.setState({
          draggingLayer: null,
          editingLayer: null
        });
        if (this.state.activeTool.locked) {
          setCursorForShape(this.canvas, this.state);
        }

        this.focusContainer();
      }),
      layer,
      excalidrawContainer: this.excalidrawContainerRef.current,
      app: this
    });
    // deselect all other layers when inserting text
    this.deselectLayers();

    // do an initial update to re-initialize layer position since we were
    // modifying layer's x/y for sake of editor (case: syncing to remote)
    updateLayer(layer.text, layer.originalText, false);
  }

  private deselectLayers() {
    this.setState({
      selectedLayerIds: makeNextSelectedLayerIds({}, this.state),
      selectedGroupIds: {},
      editingGroupId: null
    });
  }

  private getTextLayerAtPosition(
    x: number,
    y: number
  ): NonDeleted<ExcalidrawTextLayer> | null {
    const layer = this.getLayerAtPosition(x, y, {
      includeBoundTextLayer: true
    });
    if (layer && isTextLayer(layer) && !layer.isDeleted) {
      return layer;
    }
    return null;
  }

  private getLayerAtPosition(
    x: number,
    y: number,
    opts?: {
      includeBoundTextLayer?: boolean;
      includeLockedLayers?: boolean;
      /** if true, returns the first selected layer (with highest z-index)
        of all hit layers */
      preferSelected?: boolean;
    }
  ): NonDeleted<ExcalidrawLayer> | null {
    const allHitLayers = this.getLayersAtPosition(
      x,
      y,
      opts?.includeBoundTextLayer,
      opts?.includeLockedLayers
    );
    if (allHitLayers.length > 1) {
      if (opts?.preferSelected) {
        for (let index = allHitLayers.length - 1; index > -1; index--) {
          if (this.state.selectedLayerIds[allHitLayers[index].id]) {
            return allHitLayers[index];
          }
        }
      }
      const layerWithHighestZIndex = allHitLayers[allHitLayers.length - 1];
      // If we're hitting layer with highest z-index only on its bounding box
      // while also hitting other layer figure, the latter should be considered.
      return isHittingLayerBoundingBoxWithoutHittingLayer(
        layerWithHighestZIndex,
        this.state,
        this.frameNameBoundsCache,
        x,
        y
      )
        ? allHitLayers[allHitLayers.length - 2]
        : layerWithHighestZIndex;
    }
    if (allHitLayers.length === 1) {
      return allHitLayers[0];
    }
    return null;
  }

  private getLayersAtPosition(
    x: number,
    y: number,
    includeBoundTextLayer: boolean = false,
    includeLockedLayers: boolean = false
  ): NonDeleted<ExcalidrawLayer>[] {
    const layers =
      includeBoundTextLayer && includeLockedLayers
        ? this.scene.getNonDeletedLayers()
        : this.scene
            .getNonDeletedLayers()
            .filter(
              (layer) =>
                (includeLockedLayers || !layer.locked) &&
                (includeBoundTextLayer ||
                  !(isTextLayer(layer) && layer.containerId))
            );

    return getLayersAtPosition(layers, (layer) =>
      hitTest(layer, this.state, this.frameNameBoundsCache, x, y)
    ).filter((layer) => {
      // hitting a frame's layer from outside the frame is not considered a hit
      const containingFrame = getContainingFrame(layer);
      return containingFrame &&
        this.state.frameRendering.enabled &&
        this.state.frameRendering.clip
        ? isCursorInFrame({ x, y }, containingFrame)
        : true;
    });
  }

  private startTextEditing = ({
    sceneX,
    sceneY,
    insertAtParentCenter = true,
    container
  }: {
    container?: ExcalidrawTextContainer | null;
    /** whether to attempt to insert at layer center if applicable */
    insertAtParentCenter?: boolean;
    /** X position to insert text at */
    sceneX: number;
    /** Y position to insert text at */
    sceneY: number;
  }) => {
    let shouldBindToContainer = false;

    let parentCenterPosition =
      insertAtParentCenter &&
      this.getTextWysiwygSnappedToCenterPosition(
        sceneX,
        sceneY,
        this.state,
        container
      );
    if (container && parentCenterPosition) {
      const boundTextLayerToContainer = getBoundTextLayer(container);
      if (!boundTextLayerToContainer) {
        shouldBindToContainer = true;
      }
    }
    let existingTextLayer: NonDeleted<ExcalidrawTextLayer> | null = null;

    const selectedLayers = getSelectedLayers(
      this.scene.getNonDeletedLayers(),
      this.state
    );

    if (selectedLayers.length === 1) {
      if (isTextLayer(selectedLayers[0])) {
        existingTextLayer = selectedLayers[0];
      } else if (container) {
        existingTextLayer = getBoundTextLayer(selectedLayers[0]);
      } else {
        existingTextLayer = this.getTextLayerAtPosition(sceneX, sceneY);
      }
    } else {
      existingTextLayer = this.getTextLayerAtPosition(sceneX, sceneY);
    }

    const fontFamily =
      existingTextLayer?.fontFamily || this.state.currentItemFontFamily;

    const lineHeight =
      existingTextLayer?.lineHeight || getDefaultLineHeight(fontFamily);
    const fontSize = this.state.currentItemFontSize;

    if (
      !existingTextLayer &&
      shouldBindToContainer &&
      container &&
      !isArrowLayer(container)
    ) {
      const fontString = {
        fontSize,
        fontFamily
      };
      const minWidth = getApproxMinContainerWidth(
        getFontString(fontString),
        lineHeight
      );
      const minHeight = getApproxMinContainerHeight(fontSize, lineHeight);
      const containerDims = getContainerDims(container);
      const newHeight = Math.max(containerDims.height, minHeight);
      const newWidth = Math.max(containerDims.width, minWidth);
      mutateLayer(container, { height: newHeight, width: newWidth });
      sceneX = container.x + newWidth / 2;
      sceneY = container.y + newHeight / 2;
      if (parentCenterPosition) {
        parentCenterPosition = this.getTextWysiwygSnappedToCenterPosition(
          sceneX,
          sceneY,
          this.state,
          container
        );
      }
    }

    const topLayerFrame = this.getTopLayerFrameAtSceneCoords({
      x: sceneX,
      y: sceneY
    });

    const layer = existingTextLayer
      ? existingTextLayer
      : newTextLayer({
          x: parentCenterPosition ? parentCenterPosition.layerCenterX : sceneX,
          y: parentCenterPosition ? parentCenterPosition.layerCenterY : sceneY,
          strokeColor: this.state.currentItemStrokeColor,
          backgroundColor: this.state.currentItemBackgroundColor,
          fillStyle: this.state.currentItemFillStyle,
          strokeWidth: this.state.currentItemStrokeWidth,
          strokeStyle: this.state.currentItemStrokeStyle,
          roughness: this.state.currentItemRoughness,
          opacity: this.state.currentItemOpacity,
          text: "",
          fontSize,
          fontFamily,
          textAlign: parentCenterPosition
            ? "center"
            : this.state.currentItemTextAlign,
          verticalAlign: parentCenterPosition
            ? VERTICAL_ALIGN.MIDDLE
            : DEFAULT_VERTICAL_ALIGN,
          containerId: shouldBindToContainer ? container?.id : undefined,
          groupIds: container?.groupIds ?? [],
          lineHeight,
          angle: container?.angle ?? 0,
          frameId: topLayerFrame ? topLayerFrame.id : null
        });

    if (!existingTextLayer && shouldBindToContainer && container) {
      mutateLayer(container, {
        boundLayers: (container.boundLayers || []).concat({
          type: "text",
          id: layer.id
        })
      });
    }
    this.setState({ editingLayer: layer });

    if (!existingTextLayer) {
      if (container && shouldBindToContainer) {
        const containerIndex = this.scene.getLayerIndex(container.id);
        this.scene.insertLayerAtIndex(layer, containerIndex + 1);
      } else {
        this.scene.addNewLayer(layer);
      }
    }

    this.setState({
      editingLayer: layer
    });

    this.handleTextWysiwyg(layer, {
      isExistingLayer: !!existingTextLayer
    });
  };

  private handleCanvasDoubleClick = (
    event: React.MouseEvent<HTMLCanvasLayer>
  ) => {
    // case: double-clicking with arrow/line tool selected would both create
    // text and enter multiLayer mode
    if (this.state.multiLayer) {
      return;
    }
    // we should only be able to double click when mode is selection
    if (this.state.activeTool.type !== "selection") {
      return;
    }

    const selectedLayers = getSelectedLayers(
      this.scene.getNonDeletedLayers(),
      this.state
    );

    if (selectedLayers.length === 1 && isLinearLayer(selectedLayers[0])) {
      if (
        event[KEYS.CTRL_OR_CMD] &&
        (!this.state.editingLinearLayer ||
          this.state.editingLinearLayer.layerId !== selectedLayers[0].id)
      ) {
        this.history.resumeRecording();
        this.setState({
          editingLinearLayer: new LinearLayerEditor(
            selectedLayers[0],
            this.scene
          )
        });
        return;
      } else if (
        this.state.editingLinearLayer &&
        this.state.editingLinearLayer.layerId === selectedLayers[0].id
      ) {
        return;
      }
    }

    resetCursor(this.canvas);

    let { x: sceneX, y: sceneY } = viewportCoordsToSceneCoords(
      event,
      this.state
    );

    const selectedGroupIds = getSelectedGroupIds(this.state);

    if (selectedGroupIds.length > 0) {
      const hitLayer = this.getLayerAtPosition(sceneX, sceneY);

      const selectedGroupId =
        hitLayer &&
        getSelectedGroupIdForLayer(hitLayer, this.state.selectedGroupIds);

      if (selectedGroupId) {
        this.setState((prevState) =>
          selectGroupsForSelectedLayers(
            {
              ...prevState,
              editingGroupId: selectedGroupId,
              selectedLayerIds: { [hitLayer!.id]: true },
              selectedGroupIds: {}
            },
            this.scene.getNonDeletedLayers(),
            prevState
          )
        );
        return;
      }
    }

    resetCursor(this.canvas);
    if (!event[KEYS.CTRL_OR_CMD] && !this.state.viewModeEnabled) {
      const container = getTextBindableContainerAtPosition(
        this.scene.getNonDeletedLayers(),
        this.state,
        sceneX,
        sceneY
      );
      if (container) {
        if (
          hasBoundTextLayer(container) ||
          !isTransparent(container.backgroundColor) ||
          isHittingLayerNotConsideringBoundingBox(
            container,
            this.state,
            this.frameNameBoundsCache,
            [sceneX, sceneY]
          )
        ) {
          const midPoint = getContainerCenter(container, this.state);

          sceneX = midPoint.x;
          sceneY = midPoint.y;
        }
      }
      this.startTextEditing({
        sceneX,
        sceneY,
        insertAtParentCenter: !event.altKey,
        container
      });
    }
  };

  private getLayerLinkAtPosition = (
    scenePointer: Readonly<{ x: number; y: number }>,
    hitLayer: NonDeletedExcalidrawLayer | null
  ): ExcalidrawLayer | undefined => {
    // Reversing so we traverse the layers in decreasing order
    // of z-index
    const layers = this.scene.getNonDeletedLayers().slice().reverse();
    let hitLayerIndex = Infinity;

    return layers.find((layer, index) => {
      if (hitLayer && layer.id === hitLayer.id) {
        hitLayerIndex = index;
      }
      return (
        layer.link &&
        index <= hitLayerIndex &&
        isPointHittingLinkIcon(
          layer,
          this.state,
          [scenePointer.x, scenePointer.y],
          this.device.isMobile
        )
      );
    });
  };

  private redirectToLink = (
    event: React.PointerEvent<HTMLCanvasLayer>,
    isTouchScreen: boolean
  ) => {
    const draggedDistance = distance2d(
      this.lastPointerDown!.clientX,
      this.lastPointerDown!.clientY,
      this.lastPointerUp!.clientX,
      this.lastPointerUp!.clientY
    );
    if (
      !this.hitLinkLayer ||
      // For touch screen allow dragging threshold else strict check
      (isTouchScreen && draggedDistance > DRAGGING_THRESHOLD) ||
      (!isTouchScreen && draggedDistance !== 0)
    ) {
      return;
    }
    const lastPointerDownCoords = viewportCoordsToSceneCoords(
      this.lastPointerDown!,
      this.state
    );
    const lastPointerDownHittingLinkIcon = isPointHittingLinkIcon(
      this.hitLinkLayer,
      this.state,
      [lastPointerDownCoords.x, lastPointerDownCoords.y],
      this.device.isMobile
    );
    const lastPointerUpCoords = viewportCoordsToSceneCoords(
      this.lastPointerUp!,
      this.state
    );
    const lastPointerUpHittingLinkIcon = isPointHittingLinkIcon(
      this.hitLinkLayer,
      this.state,
      [lastPointerUpCoords.x, lastPointerUpCoords.y],
      this.device.isMobile
    );
    if (lastPointerDownHittingLinkIcon && lastPointerUpHittingLinkIcon) {
      let url = this.hitLinkLayer.link;
      if (url) {
        url = normalizeLink(url);
        let customEvent;
        if (this.props.onLinkOpen) {
          customEvent = wrapEvent(EVENT.EXCALIDRAW_LINK, event.nativeEvent);
          this.props.onLinkOpen(
            {
              ...this.hitLinkLayer,
              link: url
            },
            customEvent
          );
        }
        if (!customEvent?.defaultPrevented) {
          const target = isLocalLink(url) ? "_self" : "_blank";
          const newWindow = window.open(undefined, target);
          // https://mathiasbynens.github.io/rel-noopener/
          if (newWindow) {
            newWindow.opener = null;
            newWindow.location = url;
          }
        }
      }
    }
  };

  private getTopLayerFrameAtSceneCoords = (sceneCoords: {
    x: number;
    y: number;
  }) => {
    const frames = this.scene
      .getNonDeletedFrames()
      .filter((frame) =>
        isCursorInFrame(sceneCoords, frame as ExcalidrawFrameLayer)
      );

    return frames.length ? frames[frames.length - 1] : null;
  };

  private handleCanvasPointerMove = (
    event: React.PointerEvent<HTMLCanvasLayer>
  ) => {
    this.savePointer(event.clientX, event.clientY, this.state.cursorButton);

    if (gesture.pointers.has(event.pointerId)) {
      gesture.pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
      });
    }

    const initialScale = gesture.initialScale;
    if (
      gesture.pointers.size === 2 &&
      gesture.lastCenter &&
      initialScale &&
      gesture.initialDistance
    ) {
      const center = getCenter(gesture.pointers);
      const deltaX = center.x - gesture.lastCenter.x;
      const deltaY = center.y - gesture.lastCenter.y;
      gesture.lastCenter = center;

      const distance = getDistance(Array.from(gesture.pointers.values()));
      const scaleFactor =
        this.state.activeTool.type === "freedraw" && this.state.penMode
          ? 1
          : distance / gesture.initialDistance;

      const nextZoom = scaleFactor
        ? getNormalizedZoom(initialScale * scaleFactor)
        : this.state.zoom.value;

      this.setState((state) => {
        const zoomState = getStateForZoom(
          {
            viewportX: center.x,
            viewportY: center.y,
            nextZoom
          },
          state
        );

        this.translateCanvas({
          zoom: zoomState.zoom,
          scrollX: zoomState.scrollX + deltaX / nextZoom,
          scrollY: zoomState.scrollY + deltaY / nextZoom,
          shouldCacheIgnoreZoom: true
        });
      });
      this.resetShouldCacheIgnoreZoomDebounced();
    } else {
      gesture.lastCenter =
        gesture.initialDistance =
        gesture.initialScale =
          null;
    }

    if (
      isHoldingSpace ||
      isPanning ||
      isDraggingScrollBar ||
      isHandToolActive(this.state)
    ) {
      return;
    }

    const isPointerOverScrollBars = isOverScrollBars(
      currentScrollBars,
      event.clientX - this.state.offsetLeft,
      event.clientY - this.state.offsetTop
    );
    const isOverScrollBar = isPointerOverScrollBars.isOverEither;
    if (!this.state.draggingLayer && !this.state.multiLayer) {
      if (isOverScrollBar) {
        resetCursor(this.canvas);
      } else {
        setCursorForShape(this.canvas, this.state);
      }
    }

    const scenePointer = viewportCoordsToSceneCoords(event, this.state);
    const { x: scenePointerX, y: scenePointerY } = scenePointer;

    if (
      this.state.editingLinearLayer &&
      !this.state.editingLinearLayer.isDragging
    ) {
      const editingLinearLayer = LinearLayerEditor.handlePointerMove(
        event,
        scenePointerX,
        scenePointerY,
        this.state
      );

      if (
        editingLinearLayer &&
        editingLinearLayer !== this.state.editingLinearLayer
      ) {
        // Since we are reading from previous state which is not possible with
        // automatic batching in React 18 hence using flush sync to synchronously
        // update the state. Check https://github.com/excalidraw/excalidraw/pull/5508 for more details.
        flushSync(() => {
          this.setState({
            editingLinearLayer
          });
        });
      }
      if (editingLinearLayer?.lastUncommittedPoint != null) {
        this.maybeSuggestBindingAtCursor(scenePointer);
      } else {
        // causes stack overflow if not sync
        flushSync(() => {
          this.setState({ suggestedBindings: [] });
        });
      }
    }

    if (isBindingLayerType(this.state.activeTool.type)) {
      // Hovering with a selected tool or creating new linear layer via click
      // and point
      const { draggingLayer } = this.state;
      if (isBindingLayer(draggingLayer, false)) {
        this.maybeSuggestBindingsForLinearLayerAtCoords(
          draggingLayer,
          [scenePointer],
          this.state.startBoundLayer
        );
      } else {
        this.maybeSuggestBindingAtCursor(scenePointer);
      }
    }

    if (this.state.multiLayer) {
      const { multiLayer } = this.state;
      const { x: rx, y: ry } = multiLayer;

      const { points, lastCommittedPoint } = multiLayer;
      const lastPoint = points[points.length - 1];

      setCursorForShape(this.canvas, this.state);

      if (lastPoint === lastCommittedPoint) {
        // if we haven't yet created a temp point and we're beyond commit-zone
        // threshold, add a point
        if (
          distance2d(
            scenePointerX - rx,
            scenePointerY - ry,
            lastPoint[0],
            lastPoint[1]
          ) >= LINE_CONFIRM_THRESHOLD
        ) {
          mutateLayer(multiLayer, {
            points: [...points, [scenePointerX - rx, scenePointerY - ry]]
          });
        } else {
          setCursor(this.canvas, CURSOR_TYPE.POINTER);
          // in this branch, we're inside the commit zone, and no uncommitted
          // point exists. Thus do nothing (don't add/remove points).
        }
      } else if (
        points.length > 2 &&
        lastCommittedPoint &&
        distance2d(
          scenePointerX - rx,
          scenePointerY - ry,
          lastCommittedPoint[0],
          lastCommittedPoint[1]
        ) < LINE_CONFIRM_THRESHOLD
      ) {
        setCursor(this.canvas, CURSOR_TYPE.POINTER);
        mutateLayer(multiLayer, {
          points: points.slice(0, -1)
        });
      } else {
        const [gridX, gridY] = getGridPoint(
          scenePointerX,
          scenePointerY,
          this.state.gridSize
        );

        const [lastCommittedX, lastCommittedY] =
          multiLayer?.lastCommittedPoint ?? [0, 0];

        let dxFromLastCommitted = gridX - rx - lastCommittedX;
        let dyFromLastCommitted = gridY - ry - lastCommittedY;

        if (shouldRotateWithDiscreteAngle(event)) {
          ({ width: dxFromLastCommitted, height: dyFromLastCommitted } =
            getLockedLinearCursorAlignSize(
              // actual coordinate of the last committed point
              lastCommittedX + rx,
              lastCommittedY + ry,
              // cursor-grid coordinate
              gridX,
              gridY
            ));
        }

        if (isPathALoop(points, this.state.zoom.value)) {
          setCursor(this.canvas, CURSOR_TYPE.POINTER);
        }
        // update last uncommitted point
        mutateLayer(multiLayer, {
          points: [
            ...points.slice(0, -1),
            [
              lastCommittedX + dxFromLastCommitted,
              lastCommittedY + dyFromLastCommitted
            ]
          ]
        });
      }

      return;
    }

    const hasDeselectedButton = Boolean(event.buttons);
    if (
      hasDeselectedButton ||
      (this.state.activeTool.type !== "selection" &&
        this.state.activeTool.type !== "text" &&
        this.state.activeTool.type !== "eraser")
    ) {
      return;
    }

    const layers = this.scene.getNonDeletedLayers();

    const selectedLayers = getSelectedLayers(layers, this.state);
    if (
      selectedLayers.length === 1 &&
      !isOverScrollBar &&
      !this.state.editingLinearLayer
    ) {
      const layerWithTransformHandleType = getLayerWithTransformHandleType(
        layers,
        this.state,
        scenePointerX,
        scenePointerY,
        this.state.zoom,
        event.pointerType
      );
      if (
        layerWithTransformHandleType &&
        layerWithTransformHandleType.transformHandleType
      ) {
        setCursor(
          this.canvas,
          getCursorForResizingLayer(layerWithTransformHandleType)
        );
        return;
      }
    } else if (selectedLayers.length > 1 && !isOverScrollBar) {
      const transformHandleType = getTransformHandleTypeFromCoords(
        getCommonBounds(selectedLayers),
        scenePointerX,
        scenePointerY,
        this.state.zoom,
        event.pointerType
      );
      if (transformHandleType) {
        setCursor(
          this.canvas,
          getCursorForResizingLayer({
            transformHandleType
          })
        );
        return;
      }
    }

    const hitLayer = this.getLayerAtPosition(scenePointer.x, scenePointer.y);
    this.hitLinkLayer = this.getLayerLinkAtPosition(scenePointer, hitLayer);
    if (isEraserActive(this.state)) {
      return;
    }
    if (
      this.hitLinkLayer &&
      !this.state.selectedLayerIds[this.hitLinkLayer.id]
    ) {
      setCursor(this.canvas, CURSOR_TYPE.POINTER);
      showHyperlinkTooltip(this.hitLinkLayer, this.state);
    } else {
      hideHyperlinkToolip();
      if (
        hitLayer &&
        hitLayer.link &&
        this.state.selectedLayerIds[hitLayer.id] &&
        !this.state.contextMenu &&
        !this.state.showHyperlinkPopup
      ) {
        this.setState({ showHyperlinkPopup: "info" });
      } else if (this.state.activeTool.type === "text") {
        setCursor(
          this.canvas,
          isTextLayer(hitLayer) ? CURSOR_TYPE.TEXT : CURSOR_TYPE.CROSSHAIR
        );
      } else if (this.state.viewModeEnabled) {
        setCursor(this.canvas, CURSOR_TYPE.GRAB);
      } else if (isOverScrollBar) {
        setCursor(this.canvas, CURSOR_TYPE.AUTO);
      } else if (this.state.selectedLinearLayer) {
        this.handleHoverSelectedLinearLayer(
          this.state.selectedLinearLayer,
          scenePointerX,
          scenePointerY
        );
      } else if (
        // if using cmd/ctrl, we're not dragging
        !event[KEYS.CTRL_OR_CMD]
      ) {
        if (
          (hitLayer ||
            this.isHittingCommonBoundingBoxOfSelectedLayers(
              scenePointer,
              selectedLayers
            )) &&
          !hitLayer?.locked
        ) {
          setCursor(this.canvas, CURSOR_TYPE.MOVE);
        }
      } else {
        setCursor(this.canvas, CURSOR_TYPE.AUTO);
      }
    }
  };

  private handleEraser = (
    event: PointerEvent,
    pointerDownState: PointerDownState,
    scenePointer: { x: number; y: number }
  ) => {
    const updateLayerIds = (layers: ExcalidrawLayer[]) => {
      layers.forEach((layer) => {
        if (layer.locked) {
          return;
        }

        idsToUpdate.push(layer.id);
        if (event.altKey) {
          if (
            pointerDownState.layerIdsToErase[layer.id] &&
            pointerDownState.layerIdsToErase[layer.id].erase
          ) {
            pointerDownState.layerIdsToErase[layer.id].erase = false;
          }
        } else if (!pointerDownState.layerIdsToErase[layer.id]) {
          pointerDownState.layerIdsToErase[layer.id] = {
            erase: true,
            opacity: layer.opacity
          };
        }
      });
    };

    const idsToUpdate: Array<string> = [];

    const distance = distance2d(
      pointerDownState.lastCoords.x,
      pointerDownState.lastCoords.y,
      scenePointer.x,
      scenePointer.y
    );
    const threshold = 10 / this.state.zoom.value;
    const point = { ...pointerDownState.lastCoords };
    let samplingInterval = 0;
    while (samplingInterval <= distance) {
      const hitLayers = this.getLayersAtPosition(point.x, point.y);
      updateLayerIds(hitLayers);

      // Exit since we reached current point
      if (samplingInterval === distance) {
        break;
      }

      // Calculate next point in the line at a distance of sampling interval
      samplingInterval = Math.min(samplingInterval + threshold, distance);

      const distanceRatio = samplingInterval / distance;
      const nextX =
        (1 - distanceRatio) * point.x + distanceRatio * scenePointer.x;
      const nextY =
        (1 - distanceRatio) * point.y + distanceRatio * scenePointer.y;
      point.x = nextX;
      point.y = nextY;
    }

    const layers = this.scene.getLayersIncludingDeleted().map((ele) => {
      const id =
        isBoundToContainer(ele) && idsToUpdate.includes(ele.containerId)
          ? ele.containerId
          : ele.id;
      if (idsToUpdate.includes(id)) {
        if (event.altKey) {
          if (
            pointerDownState.layerIdsToErase[id] &&
            pointerDownState.layerIdsToErase[id].erase === false
          ) {
            return newLayerWith(ele, {
              opacity: pointerDownState.layerIdsToErase[id].opacity
            });
          }
        } else {
          return newLayerWith(ele, {
            opacity: ELEMENT_READY_TO_ERASE_OPACITY
          });
        }
      }
      return ele;
    });

    this.scene.replaceAllLayers(layers);

    pointerDownState.lastCoords.x = scenePointer.x;
    pointerDownState.lastCoords.y = scenePointer.y;
  };
  // set touch moving for mobile context menu
  private handleTouchMove = (event: React.TouchEvent<HTMLCanvasLayer>) => {
    invalidateContextMenu = true;
  };

  handleHoverSelectedLinearLayer(
    linearLayerEditor: LinearLayerEditor,
    scenePointerX: number,
    scenePointerY: number
  ) {
    const layer = LinearLayerEditor.getLayer(linearLayerEditor.layerId);

    const boundTextLayer = getBoundTextLayer(layer);

    if (!layer) {
      return;
    }
    if (this.state.selectedLinearLayer) {
      let hoverPointIndex = -1;
      let segmentMidPointHoveredCoords = null;
      if (
        isHittingLayerNotConsideringBoundingBox(
          layer,
          this.state,
          this.frameNameBoundsCache,
          [scenePointerX, scenePointerY]
        )
      ) {
        hoverPointIndex = LinearLayerEditor.getPointIndexUnderCursor(
          layer,
          this.state.zoom,
          scenePointerX,
          scenePointerY
        );
        segmentMidPointHoveredCoords =
          LinearLayerEditor.getSegmentMidpointHitCoords(
            linearLayerEditor,
            { x: scenePointerX, y: scenePointerY },
            this.state
          );

        if (hoverPointIndex >= 0 || segmentMidPointHoveredCoords) {
          setCursor(this.canvas, CURSOR_TYPE.POINTER);
        } else {
          setCursor(this.canvas, CURSOR_TYPE.MOVE);
        }
      } else if (
        shouldShowBoundingBox([layer], this.state) &&
        isHittingLayerBoundingBoxWithoutHittingLayer(
          layer,
          this.state,
          this.frameNameBoundsCache,
          scenePointerX,
          scenePointerY
        )
      ) {
        setCursor(this.canvas, CURSOR_TYPE.MOVE);
      } else if (
        boundTextLayer &&
        hitTest(
          boundTextLayer,
          this.state,
          this.frameNameBoundsCache,
          scenePointerX,
          scenePointerY
        )
      ) {
        setCursor(this.canvas, CURSOR_TYPE.MOVE);
      }

      if (this.state.selectedLinearLayer.hoverPointIndex !== hoverPointIndex) {
        this.setState({
          selectedLinearLayer: {
            ...this.state.selectedLinearLayer,
            hoverPointIndex
          }
        });
      }

      if (
        !LinearLayerEditor.arePointsEqual(
          this.state.selectedLinearLayer.segmentMidPointHoveredCoords,
          segmentMidPointHoveredCoords
        )
      ) {
        this.setState({
          selectedLinearLayer: {
            ...this.state.selectedLinearLayer,
            segmentMidPointHoveredCoords
          }
        });
      }
    } else {
      setCursor(this.canvas, CURSOR_TYPE.AUTO);
    }
  }
  private handleCanvasPointerDown = (event: React.PointerEvent<HTMLLayer>) => {
    // since contextMenu options are potentially evaluated on each render,
    // and an contextMenu action may depend on selection state, we must
    // close the contextMenu before we update the selection on pointerDown
    // (e.g. resetting selection)
    if (this.state.contextMenu) {
      this.setState({ contextMenu: null });
    }

    this.updateGestureOnPointerDown(event);

    // if dragging layer is freedraw and another pointerdown event occurs
    // a second finger is on the screen
    // discard the freedraw layer if it is very short because it is likely
    // just a spike, otherwise finalize the freedraw layer when the second
    // finger is lifted
    if (
      event.pointerType === "touch" &&
      this.state.draggingLayer &&
      this.state.draggingLayer.type === "freedraw"
    ) {
      const layer = this.state.draggingLayer as ExcalidrawFreeDrawLayer;
      this.updateScene({
        ...(layer.points.length < 10
          ? {
              layers: this.scene
                .getLayersIncludingDeleted()
                .filter((el) => el.id !== layer.id)
            }
          : {}),
        appState: {
          draggingLayer: null,
          editingLayer: null,
          startBoundLayer: null,
          suggestedBindings: [],
          selectedLayerIds: makeNextSelectedLayerIds(
            Object.keys(this.state.selectedLayerIds)
              .filter((key) => key !== layer.id)
              .reduce((obj: { [id: string]: true }, key) => {
                obj[key] = this.state.selectedLayerIds[key];
                return obj;
              }, {}),
            this.state
          )
        }
      });
      return;
    }

    // remove any active selection when we start to interact with canvas
    // (mainly, we care about removing selection outside the component which
    //  would prevent our copy handling otherwise)
    const selection = document.getSelection();
    if (selection?.anchorNode) {
      selection.removeAllRanges();
    }
    this.maybeOpenContextMenuAfterPointerDownOnTouchDevices(event);
    this.maybeCleanupAfterMissingPointerUp(event);

    //fires only once, if pen is detected, penMode is enabled
    //the user can disable this by toggling the penMode button
    if (!this.state.penDetected && event.pointerType === "pen") {
      this.setState((prevState) => ({
        penMode: true,
        penDetected: true
      }));
    }

    if (
      !this.device.isTouchScreen &&
      ["pen", "touch"].includes(event.pointerType)
    ) {
      this.device = updateObject(this.device, { isTouchScreen: true });
    }

    if (isPanning) {
      return;
    }

    this.lastPointerDown = event;
    this.setState({
      lastPointerDownWith: event.pointerType,
      cursorButton: "down"
    });
    this.savePointer(event.clientX, event.clientY, "down");

    if (this.handleCanvasPanUsingWheelOrSpaceDrag(event)) {
      return;
    }

    // only handle left mouse button or touch
    if (
      event.button !== POINTER_BUTTON.MAIN &&
      event.button !== POINTER_BUTTON.TOUCH
    ) {
      return;
    }

    // don't select while panning
    if (gesture.pointers.size > 1) {
      return;
    }

    // State for the duration of a pointer interaction, which starts with a
    // pointerDown event, ends with a pointerUp event (or another pointerDown)
    const pointerDownState = this.initialPointerDownState(event);

    this.setState({
      selectedLayersAreBeingDragged: false
    });

    if (this.handleDraggingScrollBar(event, pointerDownState)) {
      return;
    }

    this.clearSelectionIfNotUsingSelection();
    this.updateBindingEnabledOnPointerMove(event);

    if (this.handleSelectionOnPointerDown(event, pointerDownState)) {
      return;
    }

    const allowOnPointerDown =
      !this.state.penMode ||
      event.pointerType !== "touch" ||
      this.state.activeTool.type === "selection" ||
      this.state.activeTool.type === "text" ||
      this.state.activeTool.type === "image";

    if (!allowOnPointerDown) {
      return;
    }

    if (this.state.activeTool.type === "text") {
      this.handleTextOnPointerDown(event, pointerDownState);
      return;
    } else if (
      this.state.activeTool.type === "arrow" ||
      this.state.activeTool.type === "line"
    ) {
      this.handleLinearLayerOnPointerDown(
        event,
        this.state.activeTool.type,
        pointerDownState
      );
    } else if (this.state.activeTool.type === "image") {
      // reset image preview on pointerdown
      setCursor(this.canvas, CURSOR_TYPE.CROSSHAIR);

      // retrieve the latest layer as the state may be stale
      const pendingImageLayer =
        this.state.pendingImageLayerId &&
        this.scene.getLayer(this.state.pendingImageLayerId);

      if (!pendingImageLayer) {
        return;
      }

      this.setState({
        draggingLayer: pendingImageLayer,
        editingLayer: pendingImageLayer,
        pendingImageLayerId: null,
        multiLayer: null
      });

      const { x, y } = viewportCoordsToSceneCoords(event, this.state);
      mutateLayer(pendingImageLayer, {
        x,
        y
      });
    } else if (this.state.activeTool.type === "freedraw") {
      this.handleFreeDrawLayerOnPointerDown(
        event,
        this.state.activeTool.type,
        pointerDownState
      );
    } else if (this.state.activeTool.type === "custom") {
      setCursor(this.canvas, CURSOR_TYPE.AUTO);
    } else if (this.state.activeTool.type === "frame") {
      this.createFrameLayerOnPointerDown(pointerDownState);
    } else if (
      this.state.activeTool.type !== "eraser" &&
      this.state.activeTool.type !== "hand"
    ) {
      this.createGenericLayerOnPointerDown(
        this.state.activeTool.type,
        pointerDownState
      );
    }

    this.props?.onPointerDown?.(this.state.activeTool, pointerDownState);

    const onPointerMove =
      this.onPointerMoveFromPointerDownHandler(pointerDownState);

    const onPointerUp =
      this.onPointerUpFromPointerDownHandler(pointerDownState);

    const onKeyDown = this.onKeyDownFromPointerDownHandler(pointerDownState);
    const onKeyUp = this.onKeyUpFromPointerDownHandler(pointerDownState);

    lastPointerUp = onPointerUp;

    if (!this.state.viewModeEnabled) {
      window.addEventListener(EVENT.POINTER_MOVE, onPointerMove);
      window.addEventListener(EVENT.POINTER_UP, onPointerUp);
      window.addEventListener(EVENT.KEYDOWN, onKeyDown);
      window.addEventListener(EVENT.KEYUP, onKeyUp);
      pointerDownState.eventListeners.onMove = onPointerMove;
      pointerDownState.eventListeners.onUp = onPointerUp;
      pointerDownState.eventListeners.onKeyUp = onKeyUp;
      pointerDownState.eventListeners.onKeyDown = onKeyDown;
    }
  };

  private handleCanvasPointerUp = (
    event: React.PointerEvent<HTMLCanvasLayer>
  ) => {
    this.lastPointerUp = event;

    if (this.device.isTouchScreen) {
      const scenePointer = viewportCoordsToSceneCoords(
        { clientX: event.clientX, clientY: event.clientY },
        this.state
      );
      const hitLayer = this.getLayerAtPosition(scenePointer.x, scenePointer.y);
      this.hitLinkLayer = this.getLayerLinkAtPosition(scenePointer, hitLayer);
    }
    if (
      this.hitLinkLayer &&
      !this.state.selectedLayerIds[this.hitLinkLayer.id]
    ) {
      this.redirectToLink(event, this.device.isTouchScreen);
    }

    this.removePointer(event);
  };

  private maybeOpenContextMenuAfterPointerDownOnTouchDevices = (
    event: React.PointerEvent<HTMLLayer>
  ): void => {
    // deal with opening context menu on touch devices
    if (event.pointerType === "touch") {
      invalidateContextMenu = false;

      if (touchTimeout) {
        // If there's already a touchTimeout, this means that there's another
        // touch down and we are doing another touch, so we shouldn't open the
        // context menu.
        invalidateContextMenu = true;
      } else {
        // open the context menu with the first touch's clientX and clientY
        // if the touch is not moving
        touchTimeout = window.setTimeout(() => {
          touchTimeout = 0;
          if (!invalidateContextMenu) {
            this.handleCanvasContextMenu(event);
          }
        }, TOUCH_CTX_MENU_TIMEOUT);
      }
    }
  };

  private resetContextMenuTimer = () => {
    clearTimeout(touchTimeout);
    touchTimeout = 0;
    invalidateContextMenu = false;
  };

  private maybeCleanupAfterMissingPointerUp(
    event: React.PointerEvent<HTMLLayer>
  ): void {
    if (lastPointerUp !== null) {
      // Unfortunately, sometimes we don't get a pointerup after a pointerdown,
      // this can happen when a contextual menu or alert is triggered. In order to avoid
      // being in a weird state, we clean up on the next pointerdown
      lastPointerUp(event);
    }
  }

  // Returns whether the event is a panning
  private handleCanvasPanUsingWheelOrSpaceDrag = (
    event: React.PointerEvent<HTMLLayer>
  ): boolean => {
    if (
      !(
        gesture.pointers.size <= 1 &&
        (event.button === POINTER_BUTTON.WHEEL ||
          (event.button === POINTER_BUTTON.MAIN && isHoldingSpace) ||
          isHandToolActive(this.state) ||
          this.state.viewModeEnabled)
      ) ||
      isTextLayer(this.state.editingLayer)
    ) {
      return false;
    }
    isPanning = true;
    event.preventDefault();

    let nextPastePrevented = false;
    const isLinux = /Linux/.test(window.navigator.platform);

    setCursor(this.canvas, CURSOR_TYPE.GRABBING);
    let { clientX: lastX, clientY: lastY } = event;
    const onPointerMove = withBatchedUpdatesThrottled((event: PointerEvent) => {
      const deltaX = lastX - event.clientX;
      const deltaY = lastY - event.clientY;
      lastX = event.clientX;
      lastY = event.clientY;

      /*
       * Prevent paste event if we move while middle clicking on Linux.
       * See issue #1383.
       */
      if (
        isLinux &&
        !nextPastePrevented &&
        (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)
      ) {
        nextPastePrevented = true;

        /* Prevent the next paste event */
        const preventNextPaste = (event: ClipboardEvent) => {
          document.body.removeEventListener(EVENT.PASTE, preventNextPaste);
          event.stopPropagation();
        };

        /*
         * Reenable next paste in case of disabled middle click paste for
         * any reason:
         * - right click paste
         * - empty clipboard
         */
        const enableNextPaste = () => {
          setTimeout(() => {
            document.body.removeEventListener(EVENT.PASTE, preventNextPaste);
            window.removeEventListener(EVENT.POINTER_UP, enableNextPaste);
          }, 100);
        };

        document.body.addEventListener(EVENT.PASTE, preventNextPaste);
        window.addEventListener(EVENT.POINTER_UP, enableNextPaste);
      }

      this.translateCanvas({
        scrollX: this.state.scrollX - deltaX / this.state.zoom.value,
        scrollY: this.state.scrollY - deltaY / this.state.zoom.value
      });
    });
    const teardown = withBatchedUpdates(
      (lastPointerUp = () => {
        lastPointerUp = null;
        isPanning = false;
        if (!isHoldingSpace) {
          if (this.state.viewModeEnabled) {
            setCursor(this.canvas, CURSOR_TYPE.GRAB);
          } else {
            setCursorForShape(this.canvas, this.state);
          }
        }
        this.setState({
          cursorButton: "up"
        });
        this.savePointer(event.clientX, event.clientY, "up");
        window.removeEventListener(EVENT.POINTER_MOVE, onPointerMove);
        window.removeEventListener(EVENT.POINTER_UP, teardown);
        window.removeEventListener(EVENT.BLUR, teardown);
        onPointerMove.flush();
      })
    );
    window.addEventListener(EVENT.BLUR, teardown);
    window.addEventListener(EVENT.POINTER_MOVE, onPointerMove, {
      passive: true
    });
    window.addEventListener(EVENT.POINTER_UP, teardown);
    return true;
  };

  private updateGestureOnPointerDown(
    event: React.PointerEvent<HTMLLayer>
  ): void {
    gesture.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (gesture.pointers.size === 2) {
      gesture.lastCenter = getCenter(gesture.pointers);
      gesture.initialScale = this.state.zoom.value;
      gesture.initialDistance = getDistance(
        Array.from(gesture.pointers.values())
      );
    }
  }

  private initialPointerDownState(
    event: React.PointerEvent<HTMLLayer>
  ): PointerDownState {
    const origin = viewportCoordsToSceneCoords(event, this.state);
    const selectedLayers = getSelectedLayers(
      this.scene.getNonDeletedLayers(),
      this.state
    );
    const [minX, minY, maxX, maxY] = getCommonBounds(selectedLayers);

    return {
      origin,
      withCmdOrCtrl: event[KEYS.CTRL_OR_CMD],
      originInGrid: tupleToCoors(
        getGridPoint(origin.x, origin.y, this.state.gridSize)
      ),
      scrollbars: isOverScrollBars(
        currentScrollBars,
        event.clientX - this.state.offsetLeft,
        event.clientY - this.state.offsetTop
      ),
      // we need to duplicate because we'll be updating this state
      lastCoords: { ...origin },
      originalLayers: this.scene.getNonDeletedLayers().reduce((acc, layer) => {
        acc.set(layer.id, deepCopyLayer(layer));
        return acc;
      }, new Map() as PointerDownState["originalLayers"]),
      resize: {
        handleType: false,
        isResizing: false,
        offset: { x: 0, y: 0 },
        arrowDirection: "origin",
        center: { x: (maxX + minX) / 2, y: (maxY + minY) / 2 }
      },
      hit: {
        layer: null,
        allHitLayers: [],
        wasAddedToSelection: false,
        hasBeenDuplicated: false,
        hasHitCommonBoundingBoxOfSelectedLayers:
          this.isHittingCommonBoundingBoxOfSelectedLayers(
            origin,
            selectedLayers
          )
      },
      drag: {
        hasOccurred: false,
        offset: null
      },
      eventListeners: {
        onMove: null,
        onUp: null,
        onKeyUp: null,
        onKeyDown: null
      },
      boxSelection: {
        hasOccurred: false
      },
      layerIdsToErase: {}
    };
  }

  // Returns whether the event is a dragging a scrollbar
  private handleDraggingScrollBar(
    event: React.PointerEvent<HTMLLayer>,
    pointerDownState: PointerDownState
  ): boolean {
    if (!(pointerDownState.scrollbars.isOverEither && !this.state.multiLayer)) {
      return false;
    }
    isDraggingScrollBar = true;
    pointerDownState.lastCoords.x = event.clientX;
    pointerDownState.lastCoords.y = event.clientY;
    const onPointerMove = withBatchedUpdatesThrottled((event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLLayer)) {
        return;
      }

      this.handlePointerMoveOverScrollbars(event, pointerDownState);
    });

    const onPointerUp = withBatchedUpdates(() => {
      isDraggingScrollBar = false;
      setCursorForShape(this.canvas, this.state);
      lastPointerUp = null;
      this.setState({
        cursorButton: "up"
      });
      this.savePointer(event.clientX, event.clientY, "up");
      window.removeEventListener(EVENT.POINTER_MOVE, onPointerMove);
      window.removeEventListener(EVENT.POINTER_UP, onPointerUp);
      onPointerMove.flush();
    });

    lastPointerUp = onPointerUp;

    window.addEventListener(EVENT.POINTER_MOVE, onPointerMove);
    window.addEventListener(EVENT.POINTER_UP, onPointerUp);
    return true;
  }

  private clearSelectionIfNotUsingSelection = (): void => {
    if (this.state.activeTool.type !== "selection") {
      this.setState({
        selectedLayerIds: makeNextSelectedLayerIds({}, this.state),
        selectedGroupIds: {},
        editingGroupId: null
      });
    }
  };

  /**
   * @returns whether the pointer event has been completely handled
   */
  private handleSelectionOnPointerDown = (
    event: React.PointerEvent<HTMLLayer>,
    pointerDownState: PointerDownState
  ): boolean => {
    if (this.state.activeTool.type === "selection") {
      const layers = this.scene.getNonDeletedLayers();
      const selectedLayers = getSelectedLayers(layers, this.state);
      if (selectedLayers.length === 1 && !this.state.editingLinearLayer) {
        const layerWithTransformHandleType = getLayerWithTransformHandleType(
          layers,
          this.state,
          pointerDownState.origin.x,
          pointerDownState.origin.y,
          this.state.zoom,
          event.pointerType
        );
        if (layerWithTransformHandleType != null) {
          this.setState({
            resizingLayer: layerWithTransformHandleType.layer
          });
          pointerDownState.resize.handleType =
            layerWithTransformHandleType.transformHandleType;
        }
      } else if (selectedLayers.length > 1) {
        pointerDownState.resize.handleType = getTransformHandleTypeFromCoords(
          getCommonBounds(selectedLayers),
          pointerDownState.origin.x,
          pointerDownState.origin.y,
          this.state.zoom,
          event.pointerType
        );
      }
      if (pointerDownState.resize.handleType) {
        pointerDownState.resize.isResizing = true;
        pointerDownState.resize.offset = tupleToCoors(
          getResizeOffsetXY(
            pointerDownState.resize.handleType,
            selectedLayers,
            pointerDownState.origin.x,
            pointerDownState.origin.y
          )
        );
        if (
          selectedLayers.length === 1 &&
          isLinearLayer(selectedLayers[0]) &&
          selectedLayers[0].points.length === 2
        ) {
          pointerDownState.resize.arrowDirection = getResizeArrowDirection(
            pointerDownState.resize.handleType,
            selectedLayers[0]
          );
        }
      } else {
        if (this.state.selectedLinearLayer) {
          const linearLayerEditor =
            this.state.editingLinearLayer || this.state.selectedLinearLayer;
          const ret = LinearLayerEditor.handlePointerDown(
            event,
            this.state,
            this.history,
            pointerDownState.origin,
            linearLayerEditor
          );
          if (ret.hitLayer) {
            pointerDownState.hit.layer = ret.hitLayer;
          }
          if (ret.linearLayerEditor) {
            this.setState({ selectedLinearLayer: ret.linearLayerEditor });

            if (this.state.editingLinearLayer) {
              this.setState({ editingLinearLayer: ret.linearLayerEditor });
            }
          }
          if (ret.didAddPoint) {
            return true;
          }
        }
        // hitLayer may already be set above, so check first
        pointerDownState.hit.layer =
          pointerDownState.hit.layer ??
          this.getLayerAtPosition(
            pointerDownState.origin.x,
            pointerDownState.origin.y
          );

        if (pointerDownState.hit.layer) {
          // Early return if pointer is hitting link icon
          const hitLinkLayer = this.getLayerLinkAtPosition(
            {
              x: pointerDownState.origin.x,
              y: pointerDownState.origin.y
            },
            pointerDownState.hit.layer
          );
          if (hitLinkLayer) {
            return false;
          }
        }

        // For overlapped layers one position may hit
        // multiple layers
        pointerDownState.hit.allHitLayers = this.getLayersAtPosition(
          pointerDownState.origin.x,
          pointerDownState.origin.y
        );

        const hitLayer = pointerDownState.hit.layer;
        const someHitLayerIsSelected = pointerDownState.hit.allHitLayers.some(
          (layer) => this.isASelectedLayer(layer)
        );
        if (
          (hitLayer === null || !someHitLayerIsSelected) &&
          !event.shiftKey &&
          !pointerDownState.hit.hasHitCommonBoundingBoxOfSelectedLayers
        ) {
          this.clearSelection(hitLayer);
        }

        if (this.state.editingLinearLayer) {
          this.setState({
            selectedLayerIds: makeNextSelectedLayerIds(
              {
                [this.state.editingLinearLayer.layerId]: true
              },
              this.state
            )
          });
          // If we click on something
        } else if (hitLayer != null) {
          // on CMD/CTRL, drill down to hit layer regardless of groups etc.
          if (event[KEYS.CTRL_OR_CMD]) {
            if (!this.state.selectedLayerIds[hitLayer.id]) {
              pointerDownState.hit.wasAddedToSelection = true;
            }
            this.setState((prevState) => ({
              ...editGroupForSelectedLayer(prevState, hitLayer),
              previousSelectedLayerIds: this.state.selectedLayerIds
            }));
            // mark as not completely handled so as to allow dragging etc.
            return false;
          }

          // deselect if item is selected
          // if shift is not clicked, this will always return true
          // otherwise, it will trigger selection based on current
          // state of the box
          if (!this.state.selectedLayerIds[hitLayer.id]) {
            // if we are currently editing a group, exiting editing mode and deselect the group.
            if (
              this.state.editingGroupId &&
              !isLayerInGroup(hitLayer, this.state.editingGroupId)
            ) {
              this.setState({
                selectedLayerIds: makeNextSelectedLayerIds({}, this.state),
                selectedGroupIds: {},
                editingGroupId: null
              });
            }

            // Add hit layer to selection. At this point if we're not holding
            // SHIFT the previously selected layer(s) were deselected above
            // (make sure you use setState updater to use latest state)
            // With shift-selection, we want to make sure that frames and their containing
            // layers are not selected at the same time.
            if (
              !someHitLayerIsSelected &&
              !pointerDownState.hit.hasHitCommonBoundingBoxOfSelectedLayers
            ) {
              this.setState((prevState) => {
                const nextSelectedLayerIds: { [id: string]: true } = {
                  ...prevState.selectedLayerIds,
                  [hitLayer.id]: true
                };

                const previouslySelectedLayers: ExcalidrawLayer[] = [];

                Object.keys(prevState.selectedLayerIds).forEach((id) => {
                  const layer = this.scene.getLayer(id);
                  layer && previouslySelectedLayers.push(layer);
                });

                // if hitLayer is frame, deselect all of its layers if they are selected
                if (hitLayer.type === "frame") {
                  getFrameLayers(previouslySelectedLayers, hitLayer.id).forEach(
                    (layer) => {
                      delete nextSelectedLayerIds[layer.id];
                    }
                  );
                } else if (hitLayer.frameId) {
                  // if hitLayer is in a frame and its frame has been selected
                  // disable selection for the given layer
                  if (nextSelectedLayerIds[hitLayer.frameId]) {
                    delete nextSelectedLayerIds[hitLayer.id];
                  }
                } else {
                  // hitLayer is neither a frame nor an layer in a frame
                  // but since hitLayer could be in a group with some frames
                  // this means selecting hitLayer will have the frames selected as well
                  // because we want to keep the invariant:
                  // - frames and their layers are not selected at the same time
                  // we deselect layers in those frames that were previously selected

                  const groupIds = hitLayer.groupIds;
                  const framesInGroups = new Set(
                    groupIds
                      .flatMap((gid) =>
                        getLayersInGroup(this.scene.getNonDeletedLayers(), gid)
                      )
                      .filter((layer) => layer.type === "frame")
                      .map((frame) => frame.id)
                  );

                  if (framesInGroups.size > 0) {
                    previouslySelectedLayers.forEach((layer) => {
                      if (layer.frameId && framesInGroups.has(layer.frameId)) {
                        // deselect layer and groups containing the layer
                        delete nextSelectedLayerIds[layer.id];
                        layer.groupIds
                          .flatMap((gid) =>
                            getLayersInGroup(
                              this.scene.getNonDeletedLayers(),
                              gid
                            )
                          )
                          .forEach((layer) => {
                            delete nextSelectedLayerIds[layer.id];
                          });
                      }
                    });
                  }
                }

                return selectGroupsForSelectedLayers(
                  {
                    ...prevState,
                    selectedLayerIds: nextSelectedLayerIds,
                    showHyperlinkPopup: hitLayer.link ? "info" : false
                  },
                  this.scene.getNonDeletedLayers(),
                  prevState
                );
              });
              pointerDownState.hit.wasAddedToSelection = true;
            }
          }
        }

        this.setState({
          previousSelectedLayerIds: this.state.selectedLayerIds
        });
      }
    }
    return false;
  };

  private isASelectedLayer(hitLayer: ExcalidrawLayer | null): boolean {
    return hitLayer != null && this.state.selectedLayerIds[hitLayer.id];
  }

  private isHittingCommonBoundingBoxOfSelectedLayers(
    point: Readonly<{ x: number; y: number }>,
    selectedLayers: readonly ExcalidrawLayer[]
  ): boolean {
    if (selectedLayers.length < 2) {
      return false;
    }

    // How many pixels off the shape boundary we still consider a hit
    const threshold = 10 / this.state.zoom.value;
    const [x1, y1, x2, y2] = getCommonBounds(selectedLayers);
    return (
      point.x > x1 - threshold &&
      point.x < x2 + threshold &&
      point.y > y1 - threshold &&
      point.y < y2 + threshold
    );
  }

  private handleTextOnPointerDown = (
    event: React.PointerEvent<HTMLLayer>,
    pointerDownState: PointerDownState
  ): void => {
    // if we're currently still editing text, clicking outside
    // should only finalize it, not create another (irrespective
    // of state.activeTool.locked)
    if (isTextLayer(this.state.editingLayer)) {
      return;
    }
    let sceneX = pointerDownState.origin.x;
    let sceneY = pointerDownState.origin.y;

    const layer = this.getLayerAtPosition(sceneX, sceneY, {
      includeBoundTextLayer: true
    });

    let container = getTextBindableContainerAtPosition(
      this.scene.getNonDeletedLayers(),
      this.state,
      sceneX,
      sceneY
    );

    if (hasBoundTextLayer(layer)) {
      container = layer as ExcalidrawTextContainer;
      sceneX = layer.x + layer.width / 2;
      sceneY = layer.y + layer.height / 2;
    }
    this.startTextEditing({
      sceneX,
      sceneY,
      insertAtParentCenter: !event.altKey,
      container
    });

    resetCursor(this.canvas);
    if (!this.state.activeTool.locked) {
      this.setState({
        activeTool: updateActiveTool(this.state, { type: "selection" })
      });
    }
  };

  private handleFreeDrawLayerOnPointerDown = (
    event: React.PointerEvent<HTMLLayer>,
    layerType: ExcalidrawFreeDrawLayer["type"],
    pointerDownState: PointerDownState
  ) => {
    // Begin a mark capture. This does not have to update state yet.
    const [gridX, gridY] = getGridPoint(
      pointerDownState.origin.x,
      pointerDownState.origin.y,
      null
    );

    const topLayerFrame = this.getTopLayerFrameAtSceneCoords({
      x: gridX,
      y: gridY
    });

    const layer = newFreeDrawLayer({
      type: layerType,
      x: gridX,
      y: gridY,
      strokeColor: this.state.currentItemStrokeColor,
      backgroundColor: this.state.currentItemBackgroundColor,
      fillStyle: this.state.currentItemFillStyle,
      strokeWidth: this.state.currentItemStrokeWidth,
      strokeStyle: this.state.currentItemStrokeStyle,
      roughness: this.state.currentItemRoughness,
      opacity: this.state.currentItemOpacity,
      roundness: null,
      simulatePressure: event.pressure === 0.5,
      locked: false,
      frameId: topLayerFrame ? topLayerFrame.id : null
    });

    this.setState((prevState) => {
      const nextSelectedLayerIds = {
        ...prevState.selectedLayerIds
      };
      delete nextSelectedLayerIds[layer.id];
      return {
        selectedLayerIds: makeNextSelectedLayerIds(
          nextSelectedLayerIds,
          prevState
        )
      };
    });

    const pressures = layer.simulatePressure
      ? layer.pressures
      : [...layer.pressures, event.pressure];

    mutateLayer(layer, {
      points: [[0, 0]],
      pressures
    });

    const boundLayer = getHoveredLayerForBinding(
      pointerDownState.origin,
      this.scene
    );
    this.scene.addNewLayer(layer);
    this.setState({
      draggingLayer: layer,
      editingLayer: layer,
      startBoundLayer: boundLayer,
      suggestedBindings: []
    });
  };

  private createImageLayer = ({
    sceneX,
    sceneY
  }: {
    sceneX: number;
    sceneY: number;
  }) => {
    const [gridX, gridY] = getGridPoint(sceneX, sceneY, this.state.gridSize);

    const topLayerFrame = this.getTopLayerFrameAtSceneCoords({
      x: gridX,
      y: gridY
    });

    const layer = newImageLayer({
      type: "image",
      x: gridX,
      y: gridY,
      strokeColor: this.state.currentItemStrokeColor,
      backgroundColor: this.state.currentItemBackgroundColor,
      fillStyle: this.state.currentItemFillStyle,
      strokeWidth: this.state.currentItemStrokeWidth,
      strokeStyle: this.state.currentItemStrokeStyle,
      roughness: this.state.currentItemRoughness,
      roundness: null,
      opacity: this.state.currentItemOpacity,
      locked: false,
      frameId: topLayerFrame ? topLayerFrame.id : null
    });

    return layer;
  };

  private handleLinearLayerOnPointerDown = (
    event: React.PointerEvent<HTMLLayer>,
    layerType: ExcalidrawLinearLayer["type"],
    pointerDownState: PointerDownState
  ): void => {
    if (this.state.multiLayer) {
      const { multiLayer } = this.state;

      // finalize if completing a loop
      if (
        multiLayer.type === "line" &&
        isPathALoop(multiLayer.points, this.state.zoom.value)
      ) {
        mutateLayer(multiLayer, {
          lastCommittedPoint: multiLayer.points[multiLayer.points.length - 1]
        });
        this.actionManager.executeAction(actionFinalize);
        return;
      }

      const { x: rx, y: ry, lastCommittedPoint } = multiLayer;

      // clicking inside commit zone → finalize arrow
      if (
        multiLayer.points.length > 1 &&
        lastCommittedPoint &&
        distance2d(
          pointerDownState.origin.x - rx,
          pointerDownState.origin.y - ry,
          lastCommittedPoint[0],
          lastCommittedPoint[1]
        ) < LINE_CONFIRM_THRESHOLD
      ) {
        this.actionManager.executeAction(actionFinalize);
        return;
      }

      this.setState((prevState) => ({
        selectedLayerIds: makeNextSelectedLayerIds(
          {
            ...prevState.selectedLayerIds,
            [multiLayer.id]: true
          },
          prevState
        )
      }));
      // clicking outside commit zone → update reference for last committed
      // point
      mutateLayer(multiLayer, {
        lastCommittedPoint: multiLayer.points[multiLayer.points.length - 1]
      });
      setCursor(this.canvas, CURSOR_TYPE.POINTER);
    } else {
      const [gridX, gridY] = getGridPoint(
        pointerDownState.origin.x,
        pointerDownState.origin.y,
        this.state.gridSize
      );

      const topLayerFrame = this.getTopLayerFrameAtSceneCoords({
        x: gridX,
        y: gridY
      });

      /* If arrow is pre-arrowheads, it will have undefined for both start and end arrowheads.
      If so, we want it to be null for start and "arrow" for end. If the linear item is not
      an arrow, we want it to be null for both. Otherwise, we want it to use the
      values from appState. */

      const { currentItemStartArrowhead, currentItemEndArrowhead } = this.state;
      const [startArrowhead, endArrowhead] =
        layerType === "arrow"
          ? [currentItemStartArrowhead, currentItemEndArrowhead]
          : [null, null];

      const layer = newLinearLayer({
        type: layerType,
        x: gridX,
        y: gridY,
        strokeColor: this.state.currentItemStrokeColor,
        backgroundColor: this.state.currentItemBackgroundColor,
        fillStyle: this.state.currentItemFillStyle,
        strokeWidth: this.state.currentItemStrokeWidth,
        strokeStyle: this.state.currentItemStrokeStyle,
        roughness: this.state.currentItemRoughness,
        opacity: this.state.currentItemOpacity,
        roundness:
          this.state.currentItemRoundness === "round"
            ? { type: ROUNDNESS.PROPORTIONAL_RADIUS }
            : null,
        startArrowhead,
        endArrowhead,
        locked: false,
        frameId: topLayerFrame ? topLayerFrame.id : null
      });
      this.setState((prevState) => {
        const nextSelectedLayerIds = {
          ...prevState.selectedLayerIds
        };
        delete nextSelectedLayerIds[layer.id];
        return {
          selectedLayerIds: makeNextSelectedLayerIds(
            nextSelectedLayerIds,
            prevState
          )
        };
      });
      mutateLayer(layer, {
        points: [...layer.points, [0, 0]]
      });
      const boundLayer = getHoveredLayerForBinding(
        pointerDownState.origin,
        this.scene
      );

      this.scene.addNewLayer(layer);
      this.setState({
        draggingLayer: layer,
        editingLayer: layer,
        startBoundLayer: boundLayer,
        suggestedBindings: []
      });
    }
  };

  private createGenericLayerOnPointerDown = (
    layerType: ExcalidrawGenericLayer["type"],
    pointerDownState: PointerDownState
  ): void => {
    const [gridX, gridY] = getGridPoint(
      pointerDownState.origin.x,
      pointerDownState.origin.y,
      this.state.gridSize
    );

    const topLayerFrame = this.getTopLayerFrameAtSceneCoords({
      x: gridX,
      y: gridY
    });

    const layer = newLayer({
      type: layerType,
      x: gridX,
      y: gridY,
      strokeColor: this.state.currentItemStrokeColor,
      backgroundColor: this.state.currentItemBackgroundColor,
      fillStyle: this.state.currentItemFillStyle,
      strokeWidth: this.state.currentItemStrokeWidth,
      strokeStyle: this.state.currentItemStrokeStyle,
      roughness: this.state.currentItemRoughness,
      opacity: this.state.currentItemOpacity,
      roundness:
        this.state.currentItemRoundness === "round"
          ? {
              type: isUsingAdaptiveRadius(layerType)
                ? ROUNDNESS.ADAPTIVE_RADIUS
                : ROUNDNESS.PROPORTIONAL_RADIUS
            }
          : null,
      locked: false,
      frameId: topLayerFrame ? topLayerFrame.id : null
    });

    if (layer.type === "selection") {
      this.setState({
        selectionLayer: layer,
        draggingLayer: layer
      });
    } else {
      this.scene.addNewLayer(layer);
      this.setState({
        multiLayer: null,
        draggingLayer: layer,
        editingLayer: layer
      });
    }
  };

  private createFrameLayerOnPointerDown = (
    pointerDownState: PointerDownState
  ): void => {
    const [gridX, gridY] = getGridPoint(
      pointerDownState.origin.x,
      pointerDownState.origin.y,
      this.state.gridSize
    );

    const frame = newFrameLayer({
      x: gridX,
      y: gridY,
      opacity: this.state.currentItemOpacity,
      locked: false,
      ...FRAME_STYLE
    });

    this.scene.replaceAllLayers([
      ...this.scene.getLayersIncludingDeleted(),
      frame
    ]);

    this.setState({
      multiLayer: null,
      draggingLayer: frame,
      editingLayer: frame
    });
  };

  private onKeyDownFromPointerDownHandler(
    pointerDownState: PointerDownState
  ): (event: KeyboardEvent) => void {
    return withBatchedUpdates((event: KeyboardEvent) => {
      if (this.maybeHandleResize(pointerDownState, event)) {
        return;
      }
      this.maybeDragNewGenericLayer(pointerDownState, event);
    });
  }

  private onKeyUpFromPointerDownHandler(
    pointerDownState: PointerDownState
  ): (event: KeyboardEvent) => void {
    return withBatchedUpdates((event: KeyboardEvent) => {
      // Prevents focus from escaping excalidraw tab
      event.key === KEYS.ALT && event.preventDefault();
      if (this.maybeHandleResize(pointerDownState, event)) {
        return;
      }
      this.maybeDragNewGenericLayer(pointerDownState, event);
    });
  }

  private onPointerMoveFromPointerDownHandler(
    pointerDownState: PointerDownState
  ) {
    return withBatchedUpdatesThrottled((event: PointerEvent) => {
      // We need to initialize dragOffsetXY only after we've updated
      // `state.selectedLayerIds` on pointerDown. Doing it here in pointerMove
      // event handler should hopefully ensure we're already working with
      // the updated state.
      if (pointerDownState.drag.offset === null) {
        pointerDownState.drag.offset = tupleToCoors(
          getDragOffsetXY(
            getSelectedLayers(this.scene.getNonDeletedLayers(), this.state),
            pointerDownState.origin.x,
            pointerDownState.origin.y
          )
        );
      }
      const target = event.target;
      if (!(target instanceof HTMLLayer)) {
        return;
      }

      if (this.handlePointerMoveOverScrollbars(event, pointerDownState)) {
        return;
      }

      const pointerCoords = viewportCoordsToSceneCoords(event, this.state);

      if (isEraserActive(this.state)) {
        this.handleEraser(event, pointerDownState, pointerCoords);
        return;
      }

      const [gridX, gridY] = getGridPoint(
        pointerCoords.x,
        pointerCoords.y,
        this.state.gridSize
      );

      // for arrows/lines, don't start dragging until a given threshold
      // to ensure we don't create a 2-point arrow by mistake when
      // user clicks mouse in a way that it moves a tiny bit (thus
      // triggering pointermove)
      if (
        !pointerDownState.drag.hasOccurred &&
        (this.state.activeTool.type === "arrow" ||
          this.state.activeTool.type === "line")
      ) {
        if (
          distance2d(
            pointerCoords.x,
            pointerCoords.y,
            pointerDownState.origin.x,
            pointerDownState.origin.y
          ) < DRAGGING_THRESHOLD
        ) {
          return;
        }
      }
      if (pointerDownState.resize.isResizing) {
        pointerDownState.lastCoords.x = pointerCoords.x;
        pointerDownState.lastCoords.y = pointerCoords.y;
        if (this.maybeHandleResize(pointerDownState, event)) {
          return true;
        }
      }

      if (this.state.selectedLinearLayer) {
        const linearLayerEditor =
          this.state.editingLinearLayer || this.state.selectedLinearLayer;

        if (
          LinearLayerEditor.shouldAddMidpoint(
            this.state.selectedLinearLayer,
            pointerCoords,
            this.state
          )
        ) {
          const ret = LinearLayerEditor.addMidpoint(
            this.state.selectedLinearLayer,
            pointerCoords,
            this.state
          );
          if (!ret) {
            return;
          }

          // Since we are reading from previous state which is not possible with
          // automatic batching in React 18 hence using flush sync to synchronously
          // update the state. Check https://github.com/excalidraw/excalidraw/pull/5508 for more details.

          flushSync(() => {
            if (this.state.selectedLinearLayer) {
              this.setState({
                selectedLinearLayer: {
                  ...this.state.selectedLinearLayer,
                  pointerDownState: ret.pointerDownState,
                  selectedPointsIndices: ret.selectedPointsIndices
                }
              });
            }
            if (this.state.editingLinearLayer) {
              this.setState({
                editingLinearLayer: {
                  ...this.state.editingLinearLayer,
                  pointerDownState: ret.pointerDownState,
                  selectedPointsIndices: ret.selectedPointsIndices
                }
              });
            }
          });

          return;
        } else if (
          linearLayerEditor.pointerDownState.segmentMidpoint.value !== null &&
          !linearLayerEditor.pointerDownState.segmentMidpoint.added
        ) {
          return;
        }

        const didDrag = LinearLayerEditor.handlePointDragging(
          event,
          this.state,
          pointerCoords.x,
          pointerCoords.y,
          (layer, pointsSceneCoords) => {
            this.maybeSuggestBindingsForLinearLayerAtCoords(
              layer,
              pointsSceneCoords
            );
          },
          linearLayerEditor
        );
        if (didDrag) {
          pointerDownState.lastCoords.x = pointerCoords.x;
          pointerDownState.lastCoords.y = pointerCoords.y;
          pointerDownState.drag.hasOccurred = true;
          if (
            this.state.editingLinearLayer &&
            !this.state.editingLinearLayer.isDragging
          ) {
            this.setState({
              editingLinearLayer: {
                ...this.state.editingLinearLayer,
                isDragging: true
              }
            });
          }
          if (!this.state.selectedLinearLayer.isDragging) {
            this.setState({
              selectedLinearLayer: {
                ...this.state.selectedLinearLayer,
                isDragging: true
              }
            });
          }
          return;
        }
      }

      const hasHitASelectedLayer = pointerDownState.hit.allHitLayers.some(
        (layer) => this.isASelectedLayer(layer)
      );

      const isSelectingPointsInLineEditor =
        this.state.editingLinearLayer &&
        event.shiftKey &&
        this.state.editingLinearLayer.layerId ===
          pointerDownState.hit.layer?.id;
      if (
        (hasHitASelectedLayer ||
          pointerDownState.hit.hasHitCommonBoundingBoxOfSelectedLayers) &&
        !isSelectingPointsInLineEditor
      ) {
        const selectedLayers = getSelectedLayers(
          this.scene.getNonDeletedLayers(),
          this.state
        );

        if (selectedLayers.every((layer) => layer.locked)) {
          return;
        }

        const selectedLayersHasAFrame = selectedLayers.find((e) =>
          isFrameLayer(e)
        );
        const topLayerFrame = this.getTopLayerFrameAtSceneCoords(pointerCoords);
        this.setState({
          frameToHighlight:
            topLayerFrame && !selectedLayersHasAFrame ? topLayerFrame : null
        });

        // Marking that click was used for dragging to check
        // if layers should be deselected on pointerup
        pointerDownState.drag.hasOccurred = true;
        this.setState({
          selectedLayersAreBeingDragged: true
        });
        // prevent dragging even if we're no longer holding cmd/ctrl otherwise
        // it would have weird results (stuff jumping all over the screen)
        // Checking for editingLayer to avoid jump while editing on mobile #6503
        if (
          selectedLayers.length > 0 &&
          !pointerDownState.withCmdOrCtrl &&
          !this.state.editingLayer
        ) {
          const [dragX, dragY] = getGridPoint(
            pointerCoords.x - pointerDownState.drag.offset.x,
            pointerCoords.y - pointerDownState.drag.offset.y,
            this.state.gridSize
          );

          const [dragDistanceX, dragDistanceY] = [
            Math.abs(pointerCoords.x - pointerDownState.origin.x),
            Math.abs(pointerCoords.y - pointerDownState.origin.y)
          ];

          // We only drag in one direction if shift is pressed
          const lockDirection = event.shiftKey;
          // when we're editing the name of a frame, we want the user to be
          // able to select and interact with the text input
          !this.state.editingFrame &&
            dragSelectedLayers(
              pointerDownState,
              selectedLayers,
              dragX,
              dragY,
              lockDirection,
              dragDistanceX,
              dragDistanceY,
              this.state,
              this.scene
            );
          this.maybeSuggestBindingForAll(selectedLayers);

          // We duplicate the selected layer if alt is pressed on pointer move
          if (event.altKey && !pointerDownState.hit.hasBeenDuplicated) {
            // Move the currently selected layers to the top of the z index stack, and
            // put the duplicates where the selected layers used to be.
            // (the origin point where the dragging started)

            pointerDownState.hit.hasBeenDuplicated = true;

            const nextLayers = [];
            const layersToAppend = [];
            const groupIdMap = new Map();
            const oldIdToDuplicatedId = new Map();
            const hitLayer = pointerDownState.hit.layer;
            const layers = this.scene.getLayersIncludingDeleted();
            const selectedLayerIds = new Set(
              getSelectedLayers(layers, this.state, {
                includeBoundTextLayer: true,
                includeLayersInFrames: true
              }).map((layer) => layer.id)
            );

            for (const layer of layers) {
              if (
                selectedLayerIds.has(layer.id) ||
                // case: the state.selectedLayerIds might not have been
                // updated yet by the time this mousemove event is fired
                (layer.id === hitLayer?.id &&
                  pointerDownState.hit.wasAddedToSelection)
              ) {
                const duplicatedLayer = duplicateLayer(
                  this.state.editingGroupId,
                  groupIdMap,
                  layer
                );
                const [originDragX, originDragY] = getGridPoint(
                  pointerDownState.origin.x - pointerDownState.drag.offset.x,
                  pointerDownState.origin.y - pointerDownState.drag.offset.y,
                  this.state.gridSize
                );
                mutateLayer(duplicatedLayer, {
                  x: duplicatedLayer.x + (originDragX - dragX),
                  y: duplicatedLayer.y + (originDragY - dragY)
                });
                nextLayers.push(duplicatedLayer);
                layersToAppend.push(layer);
                oldIdToDuplicatedId.set(layer.id, duplicatedLayer.id);
              } else {
                nextLayers.push(layer);
              }
            }
            const nextSceneLayers = [...nextLayers, ...layersToAppend];
            bindTextToShapeAfterDuplication(
              nextLayers,
              layersToAppend,
              oldIdToDuplicatedId
            );
            fixBindingsAfterDuplication(
              nextSceneLayers,
              layersToAppend,
              oldIdToDuplicatedId,
              "duplicatesServeAsOld"
            );
            bindLayersToFramesAfterDuplication(
              nextSceneLayers,
              layersToAppend,
              oldIdToDuplicatedId
            );
            this.scene.replaceAllLayers(nextSceneLayers);
          }
          return;
        }
      }

      // It is very important to read this.state within each move event,
      // otherwise we would read a stale one!
      const draggingLayer = this.state.draggingLayer;
      if (!draggingLayer) {
        return;
      }

      if (draggingLayer.type === "freedraw") {
        const points = draggingLayer.points;
        const dx = pointerCoords.x - draggingLayer.x;
        const dy = pointerCoords.y - draggingLayer.y;

        const lastPoint = points.length > 0 && points[points.length - 1];
        const discardPoint =
          lastPoint && lastPoint[0] === dx && lastPoint[1] === dy;

        if (!discardPoint) {
          const pressures = draggingLayer.simulatePressure
            ? draggingLayer.pressures
            : [...draggingLayer.pressures, event.pressure];

          mutateLayer(draggingLayer, {
            points: [...points, [dx, dy]],
            pressures
          });
        }
      } else if (isLinearLayer(draggingLayer)) {
        pointerDownState.drag.hasOccurred = true;
        this.setState({
          selectedLayersAreBeingDragged: true
        });
        const points = draggingLayer.points;
        let dx = gridX - draggingLayer.x;
        let dy = gridY - draggingLayer.y;

        if (shouldRotateWithDiscreteAngle(event) && points.length === 2) {
          ({ width: dx, height: dy } = getLockedLinearCursorAlignSize(
            draggingLayer.x,
            draggingLayer.y,
            pointerCoords.x,
            pointerCoords.y
          ));
        }

        if (points.length === 1) {
          mutateLayer(draggingLayer, {
            points: [...points, [dx, dy]]
          });
        } else if (points.length === 2) {
          mutateLayer(draggingLayer, {
            points: [...points.slice(0, -1), [dx, dy]]
          });
        }

        if (isBindingLayer(draggingLayer, false)) {
          // When creating a linear layer by dragging
          this.maybeSuggestBindingsForLinearLayerAtCoords(
            draggingLayer,
            [pointerCoords],
            this.state.startBoundLayer
          );
        }
      } else {
        pointerDownState.lastCoords.x = pointerCoords.x;
        pointerDownState.lastCoords.y = pointerCoords.y;
        this.maybeDragNewGenericLayer(pointerDownState, event);
      }

      if (this.state.activeTool.type === "selection") {
        pointerDownState.boxSelection.hasOccurred = true;

        const layers = this.scene.getNonDeletedLayers();
        if (
          !event.shiftKey &&
          // allows for box-selecting points (without shift)
          !this.state.editingLinearLayer &&
          isSomeLayerSelected(layers, this.state)
        ) {
          if (pointerDownState.withCmdOrCtrl && pointerDownState.hit.layer) {
            this.setState((prevState) =>
              selectGroupsForSelectedLayers(
                {
                  ...prevState,
                  selectedLayerIds: {
                    [pointerDownState.hit.layer!.id]: true
                  }
                },
                this.scene.getNonDeletedLayers(),
                prevState
              )
            );
          }
        }
        // box-select line editor points
        if (this.state.editingLinearLayer) {
          LinearLayerEditor.handleBoxSelection(
            event,
            this.state,
            this.setState.bind(this)
          );
          // regular box-select
        } else {
          const layersWithinSelection = getLayersWithinSelection(
            layers,
            draggingLayer
          );
          this.setState((prevState) => {
            const nextSelectedLayerIds = layersWithinSelection.reduce(
              (acc: Record<ExcalidrawLayer["id"], true>, layer) => {
                acc[layer.id] = true;
                return acc;
              },
              {}
            );

            if (pointerDownState.hit.layer) {
              // if using ctrl/cmd, select the hitLayer only if we
              // haven't box-selected anything else
              if (!layersWithinSelection.length) {
                nextSelectedLayerIds[pointerDownState.hit.layer.id] = true;
              } else {
                delete nextSelectedLayerIds[pointerDownState.hit.layer.id];
              }
            }

            return selectGroupsForSelectedLayers(
              {
                ...prevState,
                selectedLayerIds: nextSelectedLayerIds,
                showHyperlinkPopup:
                  layersWithinSelection.length === 1 &&
                  layersWithinSelection[0].link
                    ? "info"
                    : false,
                // select linear layer only when we haven't box-selected anything else
                selectedLinearLayer:
                  layersWithinSelection.length === 1 &&
                  isLinearLayer(layersWithinSelection[0])
                    ? new LinearLayerEditor(
                        layersWithinSelection[0],
                        this.scene
                      )
                    : null
              },
              this.scene.getNonDeletedLayers(),
              prevState
            );
          });
        }
      }
    });
  }

  // Returns whether the pointer move happened over either scrollbar
  private handlePointerMoveOverScrollbars(
    event: PointerEvent,
    pointerDownState: PointerDownState
  ): boolean {
    if (pointerDownState.scrollbars.isOverHorizontal) {
      const x = event.clientX;
      const dx = x - pointerDownState.lastCoords.x;
      this.translateCanvas({
        scrollX: this.state.scrollX - dx / this.state.zoom.value
      });
      pointerDownState.lastCoords.x = x;
      return true;
    }

    if (pointerDownState.scrollbars.isOverVertical) {
      const y = event.clientY;
      const dy = y - pointerDownState.lastCoords.y;
      this.translateCanvas({
        scrollY: this.state.scrollY - dy / this.state.zoom.value
      });
      pointerDownState.lastCoords.y = y;
      return true;
    }
    return false;
  }

  private onPointerUpFromPointerDownHandler(
    pointerDownState: PointerDownState
  ): (event: PointerEvent) => void {
    return withBatchedUpdates((childEvent: PointerEvent) => {
      if (pointerDownState.eventListeners.onMove) {
        pointerDownState.eventListeners.onMove.flush();
      }

      const {
        draggingLayer,
        resizingLayer,
        multiLayer,
        activeTool,
        isResizing,
        isRotating
      } = this.state;
      this.setState({
        isResizing: false,
        isRotating: false,
        resizingLayer: null,
        selectionLayer: null,
        frameToHighlight: null,
        layersToHighlight: null,
        cursorButton: "up",
        // text layers are reset on finalize, and resetting on pointerup
        // may cause issues with double taps
        editingLayer:
          multiLayer || isTextLayer(this.state.editingLayer)
            ? this.state.editingLayer
            : null
      });

      this.savePointer(childEvent.clientX, childEvent.clientY, "up");

      this.setState({
        selectedLayersAreBeingDragged: false
      });

      // Handle end of dragging a point of a linear layer, might close a loop
      // and sets binding layer
      if (this.state.editingLinearLayer) {
        if (
          !pointerDownState.boxSelection.hasOccurred &&
          pointerDownState.hit?.layer?.id !==
            this.state.editingLinearLayer.layerId
        ) {
          this.actionManager.executeAction(actionFinalize);
        } else {
          const editingLinearLayer = LinearLayerEditor.handlePointerUp(
            childEvent,
            this.state.editingLinearLayer,
            this.state
          );
          if (editingLinearLayer !== this.state.editingLinearLayer) {
            this.setState({
              editingLinearLayer,
              suggestedBindings: []
            });
          }
        }
      } else if (this.state.selectedLinearLayer) {
        if (
          pointerDownState.hit?.layer?.id !==
          this.state.selectedLinearLayer.layerId
        ) {
          const selectedELements = getSelectedLayers(
            this.scene.getNonDeletedLayers(),
            this.state
          );
          // set selectedLinearLayer to null if there is more than one layer selected since we don't want to show linear layer handles
          if (selectedELements.length > 1) {
            this.setState({ selectedLinearLayer: null });
          }
        } else {
          const linearLayerEditor = LinearLayerEditor.handlePointerUp(
            childEvent,
            this.state.selectedLinearLayer,
            this.state
          );

          const { startBindingLayer, endBindingLayer } = linearLayerEditor;
          const layer = this.scene.getLayer(linearLayerEditor.layerId);
          if (isBindingLayer(layer)) {
            bindOrUnbindLinearLayer(layer, startBindingLayer, endBindingLayer);
          }

          if (linearLayerEditor !== this.state.selectedLinearLayer) {
            this.setState({
              selectedLinearLayer: {
                ...linearLayerEditor,
                selectedPointsIndices: null
              },
              suggestedBindings: []
            });
          }
        }
      }

      lastPointerUp = null;

      window.removeEventListener(
        EVENT.POINTER_MOVE,
        pointerDownState.eventListeners.onMove!
      );
      window.removeEventListener(
        EVENT.POINTER_UP,
        pointerDownState.eventListeners.onUp!
      );
      window.removeEventListener(
        EVENT.KEYDOWN,
        pointerDownState.eventListeners.onKeyDown!
      );
      window.removeEventListener(
        EVENT.KEYUP,
        pointerDownState.eventListeners.onKeyUp!
      );

      if (this.state.pendingImageLayerId) {
        this.setState({ pendingImageLayerId: null });
      }

      if (draggingLayer?.type === "freedraw") {
        const pointerCoords = viewportCoordsToSceneCoords(
          childEvent,
          this.state
        );

        const points = draggingLayer.points;
        let dx = pointerCoords.x - draggingLayer.x;
        let dy = pointerCoords.y - draggingLayer.y;

        // Allows dots to avoid being flagged as infinitely small
        if (dx === points[0][0] && dy === points[0][1]) {
          dy += 0.0001;
          dx += 0.0001;
        }

        const pressures = draggingLayer.simulatePressure
          ? []
          : [...draggingLayer.pressures, childEvent.pressure];

        mutateLayer(draggingLayer, {
          points: [...points, [dx, dy]],
          pressures,
          lastCommittedPoint: [dx, dy]
        });

        this.actionManager.executeAction(actionFinalize);

        return;
      }
      if (isImageLayer(draggingLayer)) {
        const imageLayer = draggingLayer;
        try {
          this.initializeImageDimensions(imageLayer);
          this.setState(
            {
              selectedLayerIds: makeNextSelectedLayerIds(
                { [imageLayer.id]: true },
                this.state
              )
            },
            () => {
              this.actionManager.executeAction(actionFinalize);
            }
          );
        } catch (error: any) {
          console.error(error);
          this.scene.replaceAllLayers(
            this.scene
              .getLayersIncludingDeleted()
              .filter((el) => el.id !== imageLayer.id)
          );
          this.actionManager.executeAction(actionFinalize);
        }
        return;
      }

      if (isLinearLayer(draggingLayer)) {
        if (draggingLayer!.points.length > 1) {
          this.history.resumeRecording();
        }
        const pointerCoords = viewportCoordsToSceneCoords(
          childEvent,
          this.state
        );

        if (
          !pointerDownState.drag.hasOccurred &&
          draggingLayer &&
          !multiLayer
        ) {
          mutateLayer(draggingLayer, {
            points: [
              ...draggingLayer.points,
              [
                pointerCoords.x - draggingLayer.x,
                pointerCoords.y - draggingLayer.y
              ]
            ]
          });
          this.setState({
            multiLayer: draggingLayer,
            editingLayer: this.state.draggingLayer
          });
        } else if (pointerDownState.drag.hasOccurred && !multiLayer) {
          if (
            isBindingEnabled(this.state) &&
            isBindingLayer(draggingLayer, false)
          ) {
            maybeBindLinearLayer(
              draggingLayer,
              this.state,
              this.scene,
              pointerCoords
            );
          }
          this.setState({ suggestedBindings: [], startBoundLayer: null });
          if (!activeTool.locked) {
            resetCursor(this.canvas);
            this.setState((prevState) => ({
              draggingLayer: null,
              activeTool: updateActiveTool(this.state, {
                type: "selection"
              }),
              selectedLayerIds: makeNextSelectedLayerIds(
                {
                  ...prevState.selectedLayerIds,
                  [draggingLayer.id]: true
                },
                prevState
              ),
              selectedLinearLayer: new LinearLayerEditor(
                draggingLayer,
                this.scene
              )
            }));
          } else {
            this.setState((prevState) => ({
              draggingLayer: null
            }));
          }
        }
        return;
      }

      if (
        activeTool.type !== "selection" &&
        draggingLayer &&
        isInvisiblySmallLayer(draggingLayer)
      ) {
        // remove invisible layer which was added in onPointerDown
        this.scene.replaceAllLayers(
          this.scene.getLayersIncludingDeleted().slice(0, -1)
        );
        this.setState({
          draggingLayer: null
        });
        return;
      }

      if (draggingLayer) {
        if (pointerDownState.drag.hasOccurred) {
          const sceneCoords = viewportCoordsToSceneCoords(
            childEvent,
            this.state
          );

          // when editing the points of a linear layer, we check if the
          // linear layer still is in the frame afterwards
          // if not, the linear layer will be removed from its frame (if any)
          if (
            this.state.selectedLinearLayer &&
            this.state.selectedLinearLayer.isDragging
          ) {
            const linearLayer = this.scene.getLayer(
              this.state.selectedLinearLayer.layerId
            );

            if (linearLayer?.frameId) {
              const frame = getContainingFrame(linearLayer);

              if (frame && linearLayer) {
                if (!layerOverlapsWithFrame(linearLayer, frame)) {
                  // remove the linear layer from all groups
                  // before removing it from the frame as well
                  mutateLayer(linearLayer, {
                    groupIds: []
                  });

                  this.scene.replaceAllLayers(
                    removeLayersFromFrame(
                      this.scene.getLayersIncludingDeleted(),
                      [linearLayer],
                      this.state
                    )
                  );
                }
              }
            }
          } else {
            // update the relationships between selected layers and frames
            const topLayerFrame =
              this.getTopLayerFrameAtSceneCoords(sceneCoords);

            const selectedLayers = getSelectedLayers(
              this.scene.getNonDeletedLayers(),
              this.state
            );
            let nextLayers = this.scene.getLayersIncludingDeleted();

            const updateGroupIdsAfterEditingGroup = (
              layers: ExcalidrawLayer[]
            ) => {
              if (layers.length > 0) {
                for (const layer of layers) {
                  const index = layer.groupIds.indexOf(
                    this.state.editingGroupId!
                  );

                  mutateLayer(
                    layer,
                    {
                      groupIds: layer.groupIds.slice(0, index)
                    },
                    false
                  );
                }

                nextLayers.forEach((layer) => {
                  if (
                    layer.groupIds.length &&
                    getLayersInGroup(
                      nextLayers,
                      layer.groupIds[layer.groupIds.length - 1]
                    ).length < 2
                  ) {
                    mutateLayer(
                      layer,
                      {
                        groupIds: []
                      },
                      false
                    );
                  }
                });

                this.setState({
                  editingGroupId: null
                });
              }
            };

            if (
              topLayerFrame &&
              !this.state.selectedLayerIds[topLayerFrame.id]
            ) {
              const layersToAdd = selectedLayers.filter(
                (layer) =>
                  layer.frameId !== topLayerFrame.id &&
                  isLayerInFrame(layer, nextLayers, this.state)
              );

              if (this.state.editingGroupId) {
                updateGroupIdsAfterEditingGroup(layersToAdd);
              }

              nextLayers = addLayersToFrame(
                nextLayers,
                layersToAdd,
                topLayerFrame
              );
            } else if (!topLayerFrame) {
              if (this.state.editingGroupId) {
                const layersToRemove = selectedLayers.filter(
                  (layer) =>
                    layer.frameId &&
                    !isLayerInFrame(layer, nextLayers, this.state)
                );

                updateGroupIdsAfterEditingGroup(layersToRemove);
              }
            }

            nextLayers = updateFrameMembershipOfSelectedLayers(
              this.scene.getLayersIncludingDeleted(),
              this.state
            );

            this.scene.replaceAllLayers(nextLayers);
          }
        }

        if (draggingLayer.type === "frame") {
          const layersInsideFrame = getLayersInNewFrame(
            this.scene.getLayersIncludingDeleted(),
            draggingLayer
          );

          this.scene.replaceAllLayers(
            addLayersToFrame(
              this.scene.getLayersIncludingDeleted(),
              layersInsideFrame,
              draggingLayer
            )
          );
        }

        mutateLayer(draggingLayer, getNormalizedDimensions(draggingLayer));
      }

      if (resizingLayer) {
        this.history.resumeRecording();
      }

      if (resizingLayer && isInvisiblySmallLayer(resizingLayer)) {
        this.scene.replaceAllLayers(
          this.scene
            .getLayersIncludingDeleted()
            .filter((el) => el.id !== resizingLayer.id)
        );
      }

      // handle frame membership for resizing frames and/or selected layers
      if (pointerDownState.resize.isResizing) {
        let nextLayers = updateFrameMembershipOfSelectedLayers(
          this.scene.getLayersIncludingDeleted(),
          this.state
        );

        const selectedFrames = getSelectedLayers(
          this.scene.getLayersIncludingDeleted(),
          this.state
        ).filter((layer) => layer.type === "frame") as ExcalidrawFrameLayer[];

        for (const frame of selectedFrames) {
          nextLayers = replaceAllLayersInFrame(
            nextLayers,
            getLayersInResizingFrame(
              this.scene.getLayersIncludingDeleted(),
              frame,
              this.state
            ),
            frame,
            this.state
          );
        }

        this.scene.replaceAllLayers(nextLayers);
      }

      // Code below handles selection when layer(s) weren't
      // drag or added to selection on pointer down phase.
      const hitLayer = pointerDownState.hit.layer;
      if (
        this.state.selectedLinearLayer?.layerId !== hitLayer?.id &&
        isLinearLayer(hitLayer)
      ) {
        const selectedELements = getSelectedLayers(
          this.scene.getNonDeletedLayers(),
          this.state
        );
        // set selectedLinearLayer when no other layer selected except
        // the one we've hit
        if (selectedELements.length === 1) {
          this.setState({
            selectedLinearLayer: new LinearLayerEditor(hitLayer, this.scene)
          });
        }
      }
      if (isEraserActive(this.state)) {
        const draggedDistance = distance2d(
          this.lastPointerDown!.clientX,
          this.lastPointerDown!.clientY,
          this.lastPointerUp!.clientX,
          this.lastPointerUp!.clientY
        );

        if (draggedDistance === 0) {
          const scenePointer = viewportCoordsToSceneCoords(
            {
              clientX: this.lastPointerUp!.clientX,
              clientY: this.lastPointerUp!.clientY
            },
            this.state
          );
          const hitLayers = this.getLayersAtPosition(
            scenePointer.x,
            scenePointer.y
          );
          hitLayers.forEach(
            (hitLayer) =>
              (pointerDownState.layerIdsToErase[hitLayer.id] = {
                erase: true,
                opacity: hitLayer.opacity
              })
          );
        }
        this.eraseLayers(pointerDownState);
        return;
      } else if (Object.keys(pointerDownState.layerIdsToErase).length) {
        this.restoreReadyToEraseLayers(pointerDownState);
      }

      if (
        hitLayer &&
        !pointerDownState.drag.hasOccurred &&
        !pointerDownState.hit.wasAddedToSelection &&
        // if we're editing a line, pointerup shouldn't switch selection if
        // box selected
        (!this.state.editingLinearLayer ||
          !pointerDownState.boxSelection.hasOccurred)
      ) {
        // when inside line editor, shift selects points instead
        if (childEvent.shiftKey && !this.state.editingLinearLayer) {
          if (this.state.selectedLayerIds[hitLayer.id]) {
            if (isSelectedViaGroup(this.state, hitLayer)) {
              this.setState((_prevState) => {
                const nextSelectedLayerIds = {
                  ..._prevState.selectedLayerIds
                };

                // We want to unselect all groups hitLayer is part of
                // as well as all layers that are part of the groups
                // hitLayer is part of
                for (const groupedLayer of hitLayer.groupIds.flatMap(
                  (groupId) =>
                    getLayersInGroup(this.scene.getNonDeletedLayers(), groupId)
                )) {
                  delete nextSelectedLayerIds[groupedLayer.id];
                }

                return {
                  selectedGroupIds: {
                    ..._prevState.selectedLayerIds,
                    ...hitLayer.groupIds
                      .map((gId) => ({ [gId]: false }))
                      .reduce((prev, acc) => ({ ...prev, ...acc }), {})
                  },
                  selectedLayerIds: makeNextSelectedLayerIds(
                    nextSelectedLayerIds,
                    _prevState
                  )
                };
              });
              // if not gragging a linear layer point (outside editor)
            } else if (!this.state.selectedLinearLayer?.isDragging) {
              // remove layer from selection while
              // keeping prev layers selected

              this.setState((prevState) => {
                const newSelectedLayerIds = {
                  ...prevState.selectedLayerIds
                };
                delete newSelectedLayerIds[hitLayer!.id];
                const newSelectedLayers = getSelectedLayers(
                  this.scene.getNonDeletedLayers(),
                  { ...prevState, selectedLayerIds: newSelectedLayerIds }
                );

                return selectGroupsForSelectedLayers(
                  {
                    ...prevState,
                    selectedLayerIds: newSelectedLayerIds,
                    // set selectedLinearLayer only if thats the only layer selected
                    selectedLinearLayer:
                      newSelectedLayers.length === 1 &&
                      isLinearLayer(newSelectedLayers[0])
                        ? new LinearLayerEditor(
                            newSelectedLayers[0],
                            this.scene
                          )
                        : prevState.selectedLinearLayer
                  },
                  this.scene.getNonDeletedLayers(),
                  prevState
                );
              });
            }
          } else if (
            hitLayer.frameId &&
            this.state.selectedLayerIds[hitLayer.frameId]
          ) {
            // when hitLayer is part of a selected frame, deselect the frame
            // to avoid frame and containing layers selected simultaneously
            this.setState((prevState) => {
              const nextSelectedLayerIds: {
                [id: string]: true;
              } = {
                ...prevState.selectedLayerIds,
                [hitLayer.id]: true
              };
              // deselect the frame
              delete nextSelectedLayerIds[hitLayer.frameId!];

              // deselect groups containing the frame
              (this.scene.getLayer(hitLayer.frameId!)?.groupIds ?? [])
                .flatMap((gid) =>
                  getLayersInGroup(this.scene.getNonDeletedLayers(), gid)
                )
                .forEach((layer) => {
                  delete nextSelectedLayerIds[layer.id];
                });

              return selectGroupsForSelectedLayers(
                {
                  ...prevState,
                  selectedLayerIds: nextSelectedLayerIds,
                  showHyperlinkPopup: hitLayer.link ? "info" : false
                },
                this.scene.getNonDeletedLayers(),
                prevState
              );
            });
          } else {
            // add layer to selection while keeping prev layers selected
            this.setState((_prevState) => ({
              selectedLayerIds: makeNextSelectedLayerIds(
                {
                  ..._prevState.selectedLayerIds,
                  [hitLayer!.id]: true
                },
                _prevState
              )
            }));
          }
        } else {
          this.setState((prevState) => ({
            ...selectGroupsForSelectedLayers(
              {
                ...prevState,
                selectedLayerIds: { [hitLayer.id]: true },
                selectedLinearLayer:
                  isLinearLayer(hitLayer) &&
                  // Don't set `selectedLinearLayer` if its same as the hitLayer, this is mainly to prevent resetting the `hoverPointIndex` to -1.
                  // Future we should update the API to take care of setting the correct `hoverPointIndex` when initialized
                  prevState.selectedLinearLayer?.layerId !== hitLayer.id
                    ? new LinearLayerEditor(hitLayer, this.scene)
                    : prevState.selectedLinearLayer
              },
              this.scene.getNonDeletedLayers(),
              prevState
            )
          }));
        }
      }

      if (
        !pointerDownState.drag.hasOccurred &&
        !this.state.isResizing &&
        ((hitLayer &&
          isHittingLayerBoundingBoxWithoutHittingLayer(
            hitLayer,
            this.state,
            this.frameNameBoundsCache,
            pointerDownState.origin.x,
            pointerDownState.origin.y
          )) ||
          (!hitLayer &&
            pointerDownState.hit.hasHitCommonBoundingBoxOfSelectedLayers))
      ) {
        if (this.state.editingLinearLayer) {
          this.setState({ editingLinearLayer: null });
        } else {
          // Deselect selected layers
          this.setState({
            selectedLayerIds: makeNextSelectedLayerIds({}, this.state),
            selectedGroupIds: {},
            editingGroupId: null
          });
        }
        return;
      }

      if (
        !activeTool.locked &&
        activeTool.type !== "freedraw" &&
        draggingLayer &&
        draggingLayer.type !== "selection"
      ) {
        this.setState((prevState) => ({
          selectedLayerIds: makeNextSelectedLayerIds(
            {
              ...prevState.selectedLayerIds,
              [draggingLayer.id]: true
            },
            prevState
          )
        }));
      }

      if (
        activeTool.type !== "selection" ||
        isSomeLayerSelected(this.scene.getNonDeletedLayers(), this.state)
      ) {
        this.history.resumeRecording();
      }

      if (pointerDownState.drag.hasOccurred || isResizing || isRotating) {
        (isBindingEnabled(this.state)
          ? bindOrUnbindSelectedLayers
          : unbindLinearLayers)(
          getSelectedLayers(this.scene.getNonDeletedLayers(), this.state)
        );
      }

      if (!activeTool.locked && activeTool.type !== "freedraw") {
        resetCursor(this.canvas);
        this.setState({
          draggingLayer: null,
          suggestedBindings: [],
          activeTool: updateActiveTool(this.state, { type: "selection" })
        });
      } else {
        this.setState({
          draggingLayer: null,
          suggestedBindings: []
        });
      }
    });
  }

  private restoreReadyToEraseLayers = (pointerDownState: PointerDownState) => {
    const layers = this.scene.getLayersIncludingDeleted().map((ele) => {
      if (
        pointerDownState.layerIdsToErase[ele.id] &&
        pointerDownState.layerIdsToErase[ele.id].erase
      ) {
        return newLayerWith(ele, {
          opacity: pointerDownState.layerIdsToErase[ele.id].opacity
        });
      } else if (
        isBoundToContainer(ele) &&
        pointerDownState.layerIdsToErase[ele.containerId] &&
        pointerDownState.layerIdsToErase[ele.containerId].erase
      ) {
        return newLayerWith(ele, {
          opacity: pointerDownState.layerIdsToErase[ele.containerId].opacity
        });
      } else if (
        ele.frameId &&
        pointerDownState.layerIdsToErase[ele.frameId] &&
        pointerDownState.layerIdsToErase[ele.frameId].erase
      ) {
        return newLayerWith(ele, {
          opacity: pointerDownState.layerIdsToErase[ele.frameId].opacity
        });
      }
      return ele;
    });

    this.scene.replaceAllLayers(layers);
  };

  private eraseLayers = (pointerDownState: PointerDownState) => {
    const layers = this.scene.getLayersIncludingDeleted().map((ele) => {
      if (
        pointerDownState.layerIdsToErase[ele.id] &&
        pointerDownState.layerIdsToErase[ele.id].erase
      ) {
        return newLayerWith(ele, { isDeleted: true });
      } else if (
        isBoundToContainer(ele) &&
        pointerDownState.layerIdsToErase[ele.containerId] &&
        pointerDownState.layerIdsToErase[ele.containerId].erase
      ) {
        return newLayerWith(ele, { isDeleted: true });
      } else if (
        ele.frameId &&
        pointerDownState.layerIdsToErase[ele.frameId] &&
        pointerDownState.layerIdsToErase[ele.frameId].erase
      ) {
        return newLayerWith(ele, { isDeleted: true });
      }
      return ele;
    });

    this.history.resumeRecording();
    this.scene.replaceAllLayers(layers);
  };

  private initializeImage = async ({
    imageFile,
    imageLayer: _imageLayer,
    showCursorImagePreview = false
  }: {
    imageFile: File;
    imageLayer: ExcalidrawImageLayer;
    showCursorImagePreview?: boolean;
  }) => {
    // at this point this should be guaranteed image file, but we do this check
    // to satisfy TS down the line
    if (!isSupportedImageFile(imageFile)) {
      throw new Error(t("errors.unsupportedFileType"));
    }
    const mimeType = imageFile.type;

    setCursor(this.canvas, "wait");

    if (mimeType === MIME_TYPES.svg) {
      try {
        imageFile = SVGStringToFile(
          await normalizeSVG(await imageFile.text()),
          imageFile.name
        );
      } catch (error: any) {
        console.warn(error);
        throw new Error(t("errors.svgImageInsertError"));
      }
    }

    // generate image id (by default the file digest) before any
    // resizing/compression takes place to keep it more portable
    const fileId = await ((this.props.generateIdForFile?.(
      imageFile
    ) as Promise<FileId>) || generateIdFromFile(imageFile));

    if (!fileId) {
      console.warn(
        "Couldn't generate file id or the supplied `generateIdForFile` didn't resolve to one."
      );
      throw new Error(t("errors.imageInsertError"));
    }

    const existingFileData = this.files[fileId];
    if (!existingFileData?.dataURL) {
      try {
        imageFile = await resizeImageFile(imageFile, {
          maxWidthOrHeight: DEFAULT_MAX_IMAGE_WIDTH_OR_HEIGHT
        });
      } catch (error: any) {
        console.error("error trying to resing image file on insertion", error);
      }

      if (imageFile.size > MAX_ALLOWED_FILE_BYTES) {
        throw new Error(
          t("errors.fileTooBig", {
            maxSize: `${Math.trunc(MAX_ALLOWED_FILE_BYTES / 1024 / 1024)}MB`
          })
        );
      }
    }

    if (showCursorImagePreview) {
      const dataURL = this.files[fileId]?.dataURL;
      // optimization so that we don't unnecessarily resize the original
      // full-size file for cursor preview
      // (it's much faster to convert the resized dataURL to File)
      const resizedFile = dataURL && dataURLToFile(dataURL);

      this.setImagePreviewCursor(resizedFile || imageFile);
    }

    const dataURL =
      this.files[fileId]?.dataURL || (await getDataURL(imageFile));

    const imageLayer = mutateLayer(
      _imageLayer,
      {
        fileId
      },
      false
    ) as NonDeleted<InitializedExcalidrawImageLayer>;

    return new Promise<NonDeleted<InitializedExcalidrawImageLayer>>(
      async (resolve, reject) => {
        try {
          this.files = {
            ...this.files,
            [fileId]: {
              mimeType,
              id: fileId,
              dataURL,
              created: Date.now(),
              lastRetrieved: Date.now()
            }
          };
          const cachedImageData = this.imageCache.get(fileId);
          if (!cachedImageData) {
            this.addNewImagesToImageCache();
            await this.updateImageCache([imageLayer]);
          }
          if (cachedImageData?.image instanceof Promise) {
            await cachedImageData.image;
          }
          if (
            this.state.pendingImageLayerId !== imageLayer.id &&
            this.state.draggingLayer?.id !== imageLayer.id
          ) {
            this.initializeImageDimensions(imageLayer, true);
          }
          resolve(imageLayer);
        } catch (error: any) {
          console.error(error);
          reject(new Error(t("errors.imageInsertError")));
        } finally {
          if (!showCursorImagePreview) {
            resetCursor(this.canvas);
          }
        }
      }
    );
  };

  /**
   * inserts image into layers array and rerenders
   */
  private insertImageLayer = async (
    imageLayer: ExcalidrawImageLayer,
    imageFile: File,
    showCursorImagePreview?: boolean
  ) => {
    this.scene.addNewLayer(imageLayer);

    try {
      await this.initializeImage({
        imageFile,
        imageLayer,
        showCursorImagePreview
      });
    } catch (error: any) {
      mutateLayer(imageLayer, {
        isDeleted: true
      });
      this.actionManager.executeAction(actionFinalize);
      this.setState({
        errorMessage: error.message || t("errors.imageInsertError")
      });
    }
  };

  private setImagePreviewCursor = async (imageFile: File) => {
    // mustn't be larger than 128 px
    // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Basic_User_Interface/Using_URL_values_for_the_cursor_property
    const cursorImageSizePx = 96;

    const imagePreview = await resizeImageFile(imageFile, {
      maxWidthOrHeight: cursorImageSizePx
    });

    let previewDataURL = await getDataURL(imagePreview);

    // SVG cannot be resized via `resizeImageFile` so we resize by rendering to
    // a small canvas
    if (imageFile.type === MIME_TYPES.svg) {
      const img = await loadHTMLImageElement(previewDataURL);

      let height = Math.min(img.height, cursorImageSizePx);
      let width = height * (img.width / img.height);

      if (width > cursorImageSizePx) {
        width = cursorImageSizePx;
        height = width * (img.height / img.width);
      }

      const canvas = document.createLayer("canvas");
      canvas.height = height;
      canvas.width = width;
      const context = canvas.getContext("2d")!;

      context.drawImage(img, 0, 0, width, height);

      previewDataURL = canvas.toDataURL(MIME_TYPES.svg) as DataURL;
    }

    if (this.state.pendingImageLayerId) {
      setCursor(this.canvas, `url(${previewDataURL}) 4 4, auto`);
    }
  };

  private onImageAction = async (
    { insertOnCanvasDirectly } = { insertOnCanvasDirectly: false }
  ) => {
    try {
      const clientX = this.state.width / 2 + this.state.offsetLeft;
      const clientY = this.state.height / 2 + this.state.offsetTop;

      const { x, y } = viewportCoordsToSceneCoords(
        { clientX, clientY },
        this.state
      );

      const imageFile = await fileOpen({
        description: "Image",
        extensions: Object.keys(
          IMAGE_MIME_TYPES
        ) as (keyof typeof IMAGE_MIME_TYPES)[]
      });

      const imageLayer = this.createImageLayer({
        sceneX: x,
        sceneY: y
      });

      if (insertOnCanvasDirectly) {
        this.insertImageLayer(imageLayer, imageFile);
        this.initializeImageDimensions(imageLayer);
        this.setState(
          {
            selectedLayerIds: makeNextSelectedLayerIds(
              { [imageLayer.id]: true },
              this.state
            )
          },
          () => {
            this.actionManager.executeAction(actionFinalize);
          }
        );
      } else {
        this.setState(
          {
            pendingImageLayerId: imageLayer.id
          },
          () => {
            this.insertImageLayer(
              imageLayer,
              imageFile,
              /* showCursorImagePreview */ true
            );
          }
        );
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error(error);
      } else {
        console.warn(error);
      }
      this.setState(
        {
          pendingImageLayerId: null,
          editingLayer: null,
          activeTool: updateActiveTool(this.state, { type: "selection" })
        },
        () => {
          this.actionManager.executeAction(actionFinalize);
        }
      );
    }
  };

  private initializeImageDimensions = (
    imageLayer: ExcalidrawImageLayer,
    forceNaturalSize = false
  ) => {
    const image =
      isInitializedImageLayer(imageLayer) &&
      this.imageCache.get(imageLayer.fileId)?.image;

    if (!image || image instanceof Promise) {
      if (
        imageLayer.width < DRAGGING_THRESHOLD / this.state.zoom.value &&
        imageLayer.height < DRAGGING_THRESHOLD / this.state.zoom.value
      ) {
        const placeholderSize = 100 / this.state.zoom.value;
        mutateLayer(imageLayer, {
          x: imageLayer.x - placeholderSize / 2,
          y: imageLayer.y - placeholderSize / 2,
          width: placeholderSize,
          height: placeholderSize
        });
      }

      return;
    }

    if (
      forceNaturalSize ||
      // if user-created bounding box is below threshold, assume the
      // intention was to click instead of drag, and use the image's
      // intrinsic size
      (imageLayer.width < DRAGGING_THRESHOLD / this.state.zoom.value &&
        imageLayer.height < DRAGGING_THRESHOLD / this.state.zoom.value)
    ) {
      const minHeight = Math.max(this.state.height - 120, 160);
      // max 65% of canvas height, clamped to <300px, vh - 120px>
      const maxHeight = Math.min(
        minHeight,
        Math.floor(this.state.height * 0.5) / this.state.zoom.value
      );

      const height = Math.min(image.naturalHeight, maxHeight);
      const width = height * (image.naturalWidth / image.naturalHeight);

      // add current imageLayer width/height to account for previous centering
      // of the placeholder image
      const x = imageLayer.x + imageLayer.width / 2 - width / 2;
      const y = imageLayer.y + imageLayer.height / 2 - height / 2;

      mutateLayer(imageLayer, { x, y, width, height });
    }
  };

  /** updates image cache, refreshing updated layers and/or setting status
      to error for images that fail during <img> layer creation */
  private updateImageCache = async (
    layers: readonly InitializedExcalidrawImageLayer[],
    files = this.files
  ) => {
    const { updatedFiles, erroredFiles } = await _updateImageCache({
      imageCache: this.imageCache,
      fileIds: layers.map((layer) => layer.fileId),
      files
    });
    if (updatedFiles.size || erroredFiles.size) {
      for (const layer of layers) {
        if (updatedFiles.has(layer.fileId)) {
          invalidateShapeForLayer(layer);
        }
      }
    }
    if (erroredFiles.size) {
      this.scene.replaceAllLayers(
        this.scene.getLayersIncludingDeleted().map((layer) => {
          if (
            isInitializedImageLayer(layer) &&
            erroredFiles.has(layer.fileId)
          ) {
            return newLayerWith(layer, {
              status: "error"
            });
          }
          return layer;
        })
      );
    }

    return { updatedFiles, erroredFiles };
  };

  /** adds new images to imageCache and re-renders if needed */
  private addNewImagesToImageCache = async (
    imageLayers: InitializedExcalidrawImageLayer[] = getInitializedImageLayers(
      this.scene.getNonDeletedLayers()
    ),
    files: BinaryFiles = this.files
  ) => {
    const uncachedImageLayers = imageLayers.filter(
      (layer) => !layer.isDeleted && !this.imageCache.has(layer.fileId)
    );

    if (uncachedImageLayers.length) {
      const { updatedFiles } = await this.updateImageCache(
        uncachedImageLayers,
        files
      );
      if (updatedFiles.size) {
        this.scene.informMutation();
      }
    }
  };

  /** generally you should use `addNewImagesToImageCache()` directly if you need
   *  to render new images. This is just a failsafe  */
  private scheduleImageRefresh = throttle(() => {
    this.addNewImagesToImageCache();
  }, IMAGE_RENDER_TIMEOUT);

  private updateBindingEnabledOnPointerMove = (
    event: React.PointerEvent<HTMLLayer>
  ) => {
    const shouldEnableBinding = shouldEnableBindingForPointerEvent(event);
    if (this.state.isBindingEnabled !== shouldEnableBinding) {
      this.setState({ isBindingEnabled: shouldEnableBinding });
    }
  };

  private maybeSuggestBindingAtCursor = (pointerCoords: {
    x: number;
    y: number;
  }): void => {
    const hoveredBindableLayer = getHoveredLayerForBinding(
      pointerCoords,
      this.scene
    );
    this.setState({
      suggestedBindings:
        hoveredBindableLayer != null ? [hoveredBindableLayer] : []
    });
  };

  private maybeSuggestBindingsForLinearLayerAtCoords = (
    linearLayer: NonDeleted<ExcalidrawLinearLayer>,
    /** scene coords */
    pointerCoords: {
      x: number;
      y: number;
    }[],
    // During line creation the start binding hasn't been written yet
    // into `linearLayer`
    oppositeBindingBoundLayer?: ExcalidrawBindableLayer | null
  ): void => {
    if (!pointerCoords.length) {
      return;
    }

    const suggestedBindings = pointerCoords.reduce(
      (acc: NonDeleted<ExcalidrawBindableLayer>[], coords) => {
        const hoveredBindableLayer = getHoveredLayerForBinding(
          coords,
          this.scene
        );
        if (
          hoveredBindableLayer != null &&
          !isLinearLayerSimpleAndAlreadyBound(
            linearLayer,
            oppositeBindingBoundLayer?.id,
            hoveredBindableLayer
          )
        ) {
          acc.push(hoveredBindableLayer);
        }
        return acc;
      },
      []
    );

    this.setState({ suggestedBindings });
  };

  private maybeSuggestBindingForAll(
    selectedLayers: NonDeleted<ExcalidrawLayer>[]
  ): void {
    const suggestedBindings = getEligibleLayersForBinding(selectedLayers);
    this.setState({ suggestedBindings });
  }

  private clearSelection(hitLayer: ExcalidrawLayer | null): void {
    this.setState((prevState) => ({
      selectedLayerIds: makeNextSelectedLayerIds({}, prevState),
      selectedGroupIds: {},
      // Continue editing the same group if the user selected a different
      // layer from it
      editingGroupId:
        prevState.editingGroupId &&
        hitLayer != null &&
        isLayerInGroup(hitLayer, prevState.editingGroupId)
          ? prevState.editingGroupId
          : null
    }));
    this.setState({
      selectedLayerIds: makeNextSelectedLayerIds({}, this.state),
      previousSelectedLayerIds: this.state.selectedLayerIds
    });
  }

  private handleCanvasRef = (canvas: HTMLCanvasLayer) => {
    // canvas is null when unmounting
    if (canvas !== null) {
      this.canvas = canvas;
      this.rc = rough.canvas(this.canvas);

      this.canvas.addEventListener(EVENT.WHEEL, this.handleWheel, {
        passive: false
      });
      this.canvas.addEventListener(EVENT.TOUCH_START, this.onTapStart);
      this.canvas.addEventListener(EVENT.TOUCH_END, this.onTapEnd);
    } else {
      this.canvas?.removeEventListener(EVENT.WHEEL, this.handleWheel);
      this.canvas?.removeEventListener(EVENT.TOUCH_START, this.onTapStart);
      this.canvas?.removeEventListener(EVENT.TOUCH_END, this.onTapEnd);
    }
  };

  private handleAppOnDrop = async (event: React.DragEvent<HTMLDivLayer>) => {
    // must be retrieved first, in the same frame
    const { file, fileHandle } = await getFileFromEvent(event);

    try {
      if (isSupportedImageFile(file)) {
        // first attempt to decode scene from the image if it's embedded
        // ---------------------------------------------------------------------

        if (file?.type === MIME_TYPES.png || file?.type === MIME_TYPES.svg) {
          try {
            const scene = await loadFromBlob(
              file,
              this.state,
              this.scene.getLayersIncludingDeleted(),
              fileHandle
            );
            this.syncActionResult({
              ...scene,
              appState: {
                ...(scene.appState || this.state),
                isLoading: false
              },
              replaceFiles: true,
              commitToHistory: true
            });
            return;
          } catch (error: any) {
            if (error.name !== "EncodingError") {
              throw error;
            }
          }
        }

        // if no scene is embedded or we fail for whatever reason, fall back
        // to importing as regular image
        // ---------------------------------------------------------------------

        const { x: sceneX, y: sceneY } = viewportCoordsToSceneCoords(
          event,
          this.state
        );

        const imageLayer = this.createImageLayer({ sceneX, sceneY });
        this.insertImageLayer(imageLayer, file);
        this.initializeImageDimensions(imageLayer);
        this.setState({
          selectedLayerIds: makeNextSelectedLayerIds(
            { [imageLayer.id]: true },
            this.state
          )
        });

        return;
      }
    } catch (error: any) {
      return this.setState({
        isLoading: false,
        errorMessage: error.message
      });
    }

    const libraryJSON = event.dataTransfer.getData(MIME_TYPES.excalidrawlib);
    if (libraryJSON && typeof libraryJSON === "string") {
      try {
        const libraryItems = parseLibraryJSON(libraryJSON);
        this.addLayersFromPasteOrLibrary({
          layers: distributeLibraryItemsOnSquareGrid(libraryItems),
          position: event,
          files: null
        });
      } catch (error: any) {
        this.setState({ errorMessage: error.message });
      }
      return;
    }

    if (file) {
      // atetmpt to parse an excalidraw/excalidrawlib file
      await this.loadFileToCanvas(file, fileHandle);
    }
  };

  loadFileToCanvas = async (
    file: File,
    fileHandle: FileSystemHandle | null
  ) => {
    file = await normalizeFile(file);
    try {
      const ret = await loadSceneOrLibraryFromBlob(
        file,
        this.state,
        this.scene.getLayersIncludingDeleted(),
        fileHandle
      );
      if (ret.type === MIME_TYPES.excalidraw) {
        this.setState({ isLoading: true });
        this.syncActionResult({
          ...ret.data,
          appState: {
            ...(ret.data.appState || this.state),
            isLoading: false
          },
          replaceFiles: true,
          commitToHistory: true
        });
      } else if (ret.type === MIME_TYPES.excalidrawlib) {
        await this.library
          .updateLibrary({
            libraryItems: file,
            merge: true,
            openLibraryMenu: true
          })
          .catch((error) => {
            console.error(error);
            this.setState({ errorMessage: t("errors.importLibraryError") });
          });
      }
    } catch (error: any) {
      this.setState({ isLoading: false, errorMessage: error.message });
    }
  };

  private handleCanvasContextMenu = (event: React.PointerEvent<HTMLLayer>) => {
    event.preventDefault();

    if (
      (event.nativeEvent.pointerType === "touch" ||
        (event.nativeEvent.pointerType === "pen" &&
          // always allow if user uses a pen secondary button
          event.button !== POINTER_BUTTON.SECONDARY)) &&
      this.state.activeTool.type !== "selection"
    ) {
      return;
    }

    const { x, y } = viewportCoordsToSceneCoords(event, this.state);
    const layer = this.getLayerAtPosition(x, y, {
      preferSelected: true,
      includeLockedLayers: true
    });

    const selectedLayers = getSelectedLayers(
      this.scene.getNonDeletedLayers(),
      this.state
    );
    const isHittignCommonBoundBox =
      this.isHittingCommonBoundingBoxOfSelectedLayers({ x, y }, selectedLayers);

    const type = layer || isHittignCommonBoundBox ? "layer" : "canvas";

    const container = this.excalidrawContainerRef.current!;
    const { top: offsetTop, left: offsetLeft } =
      container.getBoundingClientRect();
    const left = event.clientX - offsetLeft;
    const top = event.clientY - offsetTop;

    trackEvent("contextMenu", "openContextMenu", type);

    this.setState(
      {
        ...(layer && !this.state.selectedLayerIds[layer.id]
          ? selectGroupsForSelectedLayers(
              {
                ...this.state,
                selectedLayerIds: { [layer.id]: true },
                selectedLinearLayer: isLinearLayer(layer)
                  ? new LinearLayerEditor(layer, this.scene)
                  : null
              },
              this.scene.getNonDeletedLayers(),
              this.state
            )
          : this.state),
        showHyperlinkPopup: false
      },
      () => {
        this.setState({
          contextMenu: { top, left, items: this.getContextMenuItems(type) }
        });
      }
    );
  };

  private maybeDragNewGenericLayer = (
    pointerDownState: PointerDownState,
    event: MouseEvent | KeyboardEvent
  ): void => {
    const draggingLayer = this.state.draggingLayer;
    const pointerCoords = pointerDownState.lastCoords;
    if (!draggingLayer) {
      return;
    }
    if (
      draggingLayer.type === "selection" &&
      this.state.activeTool.type !== "eraser"
    ) {
      dragNewLayer(
        draggingLayer,
        this.state.activeTool.type,
        pointerDownState.origin.x,
        pointerDownState.origin.y,
        pointerCoords.x,
        pointerCoords.y,
        distance(pointerDownState.origin.x, pointerCoords.x),
        distance(pointerDownState.origin.y, pointerCoords.y),
        shouldMaintainAspectRatio(event),
        shouldResizeFromCenter(event)
      );
    } else {
      const [gridX, gridY] = getGridPoint(
        pointerCoords.x,
        pointerCoords.y,
        this.state.gridSize
      );

      const image =
        isInitializedImageLayer(draggingLayer) &&
        this.imageCache.get(draggingLayer.fileId)?.image;
      const aspectRatio =
        image && !(image instanceof Promise)
          ? image.width / image.height
          : null;

      dragNewLayer(
        draggingLayer,
        this.state.activeTool.type,
        pointerDownState.originInGrid.x,
        pointerDownState.originInGrid.y,
        gridX,
        gridY,
        distance(pointerDownState.originInGrid.x, gridX),
        distance(pointerDownState.originInGrid.y, gridY),
        isImageLayer(draggingLayer)
          ? !shouldMaintainAspectRatio(event)
          : shouldMaintainAspectRatio(event),
        shouldResizeFromCenter(event),
        aspectRatio
      );

      this.maybeSuggestBindingForAll([draggingLayer]);

      // highlight layers that are to be added to frames on frames creation
      if (this.state.activeTool.type === "frame") {
        this.setState({
          layersToHighlight: getLayersInResizingFrame(
            this.scene.getNonDeletedLayers(),
            draggingLayer as ExcalidrawFrameLayer,
            this.state
          )
        });
      }
    }
  };

  private maybeHandleResize = (
    pointerDownState: PointerDownState,
    event: MouseEvent | KeyboardEvent
  ): boolean => {
    const selectedLayers = getSelectedLayers(
      this.scene.getNonDeletedLayers(),
      this.state
    );
    const selectedFrames = selectedLayers.filter(
      (layer) => layer.type === "frame"
    ) as ExcalidrawFrameLayer[];

    const transformHandleType = pointerDownState.resize.handleType;

    if (selectedFrames.length > 0 && transformHandleType === "rotation") {
      return false;
    }

    this.setState({
      // TODO: rename this state field to "isScaling" to distinguish
      // it from the generic "isResizing" which includes scaling and
      // rotating
      isResizing: transformHandleType && transformHandleType !== "rotation",
      isRotating: transformHandleType === "rotation"
    });
    const pointerCoords = pointerDownState.lastCoords;
    const [resizeX, resizeY] = getGridPoint(
      pointerCoords.x - pointerDownState.resize.offset.x,
      pointerCoords.y - pointerDownState.resize.offset.y,
      this.state.gridSize
    );

    const frameLayersOffsetsMap = new Map<
      string,
      {
        x: number;
        y: number;
      }
    >();

    selectedFrames.forEach((frame) => {
      const layersInFrame = getFrameLayers(
        this.scene.getNonDeletedLayers(),
        frame.id
      );

      layersInFrame.forEach((layer) => {
        frameLayersOffsetsMap.set(frame.id + layer.id, {
          x: layer.x - frame.x,
          y: layer.y - frame.y
        });
      });
    });

    if (
      transformLayers(
        pointerDownState,
        transformHandleType,
        selectedLayers,
        pointerDownState.resize.arrowDirection,
        shouldRotateWithDiscreteAngle(event),
        shouldResizeFromCenter(event),
        selectedLayers.length === 1 && isImageLayer(selectedLayers[0])
          ? !shouldMaintainAspectRatio(event)
          : shouldMaintainAspectRatio(event),
        resizeX,
        resizeY,
        pointerDownState.resize.center.x,
        pointerDownState.resize.center.y
      )
    ) {
      this.maybeSuggestBindingForAll(selectedLayers);

      const layersToHighlight = new Set<ExcalidrawLayer>();
      selectedFrames.forEach((frame) => {
        const layersInFrame = getFrameLayers(
          this.scene.getNonDeletedLayers(),
          frame.id
        );

        // keep layers' positions relative to their frames on frames resizing
        if (transformHandleType) {
          if (transformHandleType.includes("w")) {
            layersInFrame.forEach((layer) => {
              mutateLayer(layer, {
                x:
                  frame.x +
                  (frameLayersOffsetsMap.get(frame.id + layer.id)?.x || 0),
                y:
                  frame.y +
                  (frameLayersOffsetsMap.get(frame.id + layer.id)?.y || 0)
              });
            });
          }
          if (transformHandleType.includes("n")) {
            layersInFrame.forEach((layer) => {
              mutateLayer(layer, {
                x:
                  frame.x +
                  (frameLayersOffsetsMap.get(frame.id + layer.id)?.x || 0),
                y:
                  frame.y +
                  (frameLayersOffsetsMap.get(frame.id + layer.id)?.y || 0)
              });
            });
          }
        }

        getLayersInResizingFrame(
          this.scene.getNonDeletedLayers(),
          frame,
          this.state
        ).forEach((layer) => layersToHighlight.add(layer));
      });

      this.setState({
        layersToHighlight: [...layersToHighlight]
      });

      return true;
    }
    return false;
  };

  private getContextMenuItems = (
    type: "canvas" | "layer"
  ): ContextMenuItems => {
    const options: ContextMenuItems = [];

    options.push(actionCopyAsPng, actionCopyAsSvg);

    // canvas contextMenu
    // -------------------------------------------------------------------------

    if (type === "canvas") {
      if (this.state.viewModeEnabled) {
        return [
          ...options,
          actionToggleGridMode,
          actionToggleZenMode,
          actionToggleViewMode,
          actionToggleStats
        ];
      }

      return [
        actionPaste,
        CONTEXT_MENU_SEPARATOR,
        actionCopyAsPng,
        actionCopyAsSvg,
        copyText,
        CONTEXT_MENU_SEPARATOR,
        actionSelectAll,
        actionUnlockAllLayers,
        CONTEXT_MENU_SEPARATOR,
        actionToggleGridMode,
        actionToggleZenMode,
        actionToggleViewMode,
        actionToggleStats
      ];
    }

    // layer contextMenu
    // -------------------------------------------------------------------------

    options.push(copyText);

    if (this.state.viewModeEnabled) {
      return [actionCopy, ...options];
    }

    return [
      actionCut,
      actionCopy,
      actionPaste,
      actionSelectAllLayersInFrame,
      actionRemoveAllLayersFromFrame,
      CONTEXT_MENU_SEPARATOR,
      ...options,
      CONTEXT_MENU_SEPARATOR,
      actionCopyStyles,
      actionPasteStyles,
      CONTEXT_MENU_SEPARATOR,
      actionGroup,
      actionUnbindText,
      actionBindText,
      actionWrapTextInContainer,
      actionUngroup,
      CONTEXT_MENU_SEPARATOR,
      actionAddToLibrary,
      CONTEXT_MENU_SEPARATOR,
      actionSendBackward,
      actionBringForward,
      actionSendToBack,
      actionBringToFront,
      CONTEXT_MENU_SEPARATOR,
      actionFlipHorizontal,
      actionFlipVertical,
      CONTEXT_MENU_SEPARATOR,
      actionToggleLinearEditor,
      actionLink,
      actionDuplicateSelection,
      actionToggleLayerLock,
      CONTEXT_MENU_SEPARATOR,
      actionDeleteSelected
    ];
  };

  private handleWheel = withBatchedUpdates(
    (event: WheelEvent | React.WheelEvent<HTMLDivLayer>) => {
      event.preventDefault();
      if (isPanning) {
        return;
      }

      const { deltaX, deltaY } = event;
      // note that event.ctrlKey is necessary to handle pinch zooming
      if (event.metaKey || event.ctrlKey) {
        const sign = Math.sign(deltaY);
        const MAX_STEP = ZOOM_STEP * 100;
        const absDelta = Math.abs(deltaY);
        let delta = deltaY;
        if (absDelta > MAX_STEP) {
          delta = MAX_STEP * sign;
        }

        let newZoom = this.state.zoom.value - delta / 100;
        // increase zoom steps the more zoomed-in we are (applies to >100% only)
        newZoom +=
          Math.log10(Math.max(1, this.state.zoom.value)) *
          -sign *
          // reduced amplification for small deltas (small movements on a trackpad)
          Math.min(1, absDelta / 20);

        this.translateCanvas((state) => ({
          ...getStateForZoom(
            {
              viewportX: this.lastViewportPosition.x,
              viewportY: this.lastViewportPosition.y,
              nextZoom: getNormalizedZoom(newZoom)
            },
            state
          ),
          shouldCacheIgnoreZoom: true
        }));
        this.resetShouldCacheIgnoreZoomDebounced();
        return;
      }

      // scroll horizontally when shift pressed
      if (event.shiftKey) {
        this.translateCanvas(({ zoom, scrollX }) => ({
          // on Mac, shift+wheel tends to result in deltaX
          scrollX: scrollX - (deltaY || deltaX) / zoom.value
        }));
        return;
      }

      this.translateCanvas(({ zoom, scrollX, scrollY }) => ({
        scrollX: scrollX - deltaX / zoom.value,
        scrollY: scrollY - deltaY / zoom.value
      }));
    }
  );

  private getTextWysiwygSnappedToCenterPosition(
    x: number,
    y: number,
    appState: AppState,
    container?: ExcalidrawTextContainer | null
  ) {
    if (container) {
      let layerCenterX = container.x + container.width / 2;
      let layerCenterY = container.y + container.height / 2;

      const layerCenter = getContainerCenter(container, appState);
      if (layerCenter) {
        layerCenterX = layerCenter.x;
        layerCenterY = layerCenter.y;
      }
      const distanceToCenter = Math.hypot(x - layerCenterX, y - layerCenterY);
      const isSnappedToCenter =
        distanceToCenter < TEXT_TO_CENTER_SNAP_THRESHOLD;
      if (isSnappedToCenter) {
        const { x: viewportX, y: viewportY } = sceneCoordsToViewportCoords(
          { sceneX: layerCenterX, sceneY: layerCenterY },
          appState
        );
        return { viewportX, viewportY, layerCenterX, layerCenterY };
      }
    }
  }

  private savePointer = (x: number, y: number, button: "up" | "down") => {
    if (!x || !y) {
      return;
    }
    const pointer = viewportCoordsToSceneCoords(
      { clientX: x, clientY: y },
      this.state
    );

    if (isNaN(pointer.x) || isNaN(pointer.y)) {
      // sometimes the pointer goes off screen
    }

    this.props.onPointerUpdate?.({
      pointer,
      button,
      pointersMap: gesture.pointers
    });
  };

  private resetShouldCacheIgnoreZoomDebounced = debounce(() => {
    if (!this.unmounted) {
      this.setState({ shouldCacheIgnoreZoom: false });
    }
  }, 300);

  private updateDOMRect = (cb?: () => void) => {
    if (this.excalidrawContainerRef?.current) {
      const excalidrawContainer = this.excalidrawContainerRef.current;
      const {
        width,
        height,
        left: offsetLeft,
        top: offsetTop
      } = excalidrawContainer.getBoundingClientRect();
      const {
        width: currentWidth,
        height: currentHeight,
        offsetTop: currentOffsetTop,
        offsetLeft: currentOffsetLeft
      } = this.state;

      if (
        width === currentWidth &&
        height === currentHeight &&
        offsetLeft === currentOffsetLeft &&
        offsetTop === currentOffsetTop
      ) {
        if (cb) {
          cb();
        }
        return;
      }

      this.setState(
        {
          width,
          height,
          offsetLeft,
          offsetTop
        },
        () => {
          cb && cb();
        }
      );
    }
  };

  public refresh = () => {
    this.setState({ ...this.getCanvasOffsets() });
  };

  private getCanvasOffsets(): Pick<AppState, "offsetTop" | "offsetLeft"> {
    if (this.excalidrawContainerRef?.current) {
      const excalidrawContainer = this.excalidrawContainerRef.current;
      const { left, top } = excalidrawContainer.getBoundingClientRect();
      return {
        offsetLeft: left,
        offsetTop: top
      };
    }
    return {
      offsetLeft: 0,
      offsetTop: 0
    };
  }

  private async updateLanguage() {
    const currentLang =
      languages.find((lang) => lang.code === this.props.langCode) ||
      defaultLang;
    await setLanguage(currentLang);
    this.setAppState({});
  }
}

// -----------------------------------------------------------------------------
// TEST HOOKS
// -----------------------------------------------------------------------------

declare global {
  interface Window {
    h: {
      app: InstanceType<typeof App>;
      history: History;
      layers: readonly ExcalidrawLayer[];
      setState: React.Component<any, AppState>["setState"];
      state: AppState;
    };
  }
}

if (
  process.env.NODE_ENV === ENV.TEST ||
  process.env.NODE_ENV === ENV.DEVELOPMENT
) {
  window.h = window.h || ({} as Window["h"]);

  Object.defineProperties(window.h, {
    layers: {
      configurable: true,
      get() {
        return this.app?.scene.getLayersIncludingDeleted();
      },
      set(layers: ExcalidrawLayer[]) {
        return this.app?.scene.replaceAllLayers(layers);
      }
    }
  });
}

export default App;
