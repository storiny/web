import "./Hyperlink.scss";

import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";

import { isLocalLink, normalizeLink } from "../../lib/data/url/url";
import { rotate } from "../../lib/math/math";
import { getSelectedLayers } from "../../lib/scene";
import {
  getShortcutKey,
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords,
  wrapEvent
} from "../../lib/utils/utils";
import { register } from "../actions/register";
import { trackEvent } from "../analytics";
import { useExcalidrawAppState } from "../components/App";
import { FreedrawIcon, LinkIcon, TrashIcon } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { getTooltipDiv, updateTooltipPosition } from "../components/Tooltip";
import { EVENT, HYPERLINK_TOOLTIP_DELAY, MIME_TYPES } from "../constants";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { DEFAULT_LINK_SIZE } from "../renderer/renderLayer";
import { AppState, ExcalidrawProps, Point, UIAppState } from "../types";
import { getLayerAbsoluteCoords } from "./";
import { Bounds } from "./bounds";
import { isPointHittingLayerBoundingBox } from "./collision";
import { mutateLayer } from "./mutateLayer";
import { NonDeletedExcalidrawLayer } from "./types";

const CONTAINER_WIDTH = 320;
const SPACE_BOTTOM = 85;
const CONTAINER_PADDING = 5;
const CONTAINER_HEIGHT = 42;
const AUTO_HIDE_TIMEOUT = 500;

export const EXTERNAL_LINK_IMG = document.createLayer("img");
EXTERNAL_LINK_IMG.src = `data:${MIME_TYPES.svg}, ${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1971c2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-external-link"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`
)}`;

let IS_HYPERLINK_TOOLTIP_VISIBLE = false;

export const Hyperlink = ({
  layer,
  setAppState,
  onLinkOpen
}: {
  layer: NonDeletedExcalidrawLayer;
  onLinkOpen: ExcalidrawProps["onLinkOpen"];
  setAppState: React.Component<any, AppState>["setState"];
}) => {
  const editorState = useExcalidrawAppState();

  const linkVal = layer.link || "";

  const [inputVal, setInputVal] = useState(linkVal);
  const inputRef = useRef<HTMLInputLayer>(null);
  const isEditing = editorState.showHyperlinkPopup === "editor" || !linkVal;

  const handleSubmit = useCallback(() => {
    if (!inputRef.current) {
      return;
    }

    const link = normalizeLink(inputRef.current.value);

    if (!layer.link && link) {
      trackEvent("hyperlink", "create");
    }

    mutateLayer(layer, { link });
    setAppState({ showHyperlinkPopup: "info" });
  }, [layer, setAppState]);

  useLayoutEffect(
    () => () => {
      handleSubmit();
    },
    [handleSubmit]
  );

  useEffect(() => {
    let timeoutId: number | null = null;
    const handlePointerMove = (event: PointerEvent) => {
      if (isEditing) {
        return;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const shouldHide = shouldHideLinkPopup(layer, editorState, [
        event.clientX,
        event.clientY
      ]) as boolean;
      if (shouldHide) {
        timeoutId = window.setTimeout(() => {
          setAppState({ showHyperlinkPopup: false });
        }, AUTO_HIDE_TIMEOUT);
      }
    };
    window.addEventListener(EVENT.POINTER_MOVE, handlePointerMove, false);
    return () => {
      window.removeEventListener(EVENT.POINTER_MOVE, handlePointerMove, false);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [editorState, layer, isEditing, setAppState]);

  const handleRemove = useCallback(() => {
    trackEvent("hyperlink", "delete");
    mutateLayer(layer, { link: null });
    if (isEditing) {
      inputRef.current!.value = "";
    }
    setAppState({ showHyperlinkPopup: false });
  }, [setAppState, layer, isEditing]);

  const onEdit = () => {
    trackEvent("hyperlink", "edit", "popup-ui");
    setAppState({ showHyperlinkPopup: "editor" });
  };
  const { x, y } = getCoordsForPopover(layer, editorState);
  if (
    editorState.draggingLayer ||
    editorState.resizingLayer ||
    editorState.isRotating ||
    editorState.openMenu
  ) {
    return null;
  }
  return (
    <div
      className="excalidraw-hyperlinkContainer"
      style={{
        top: `${y}px`,
        left: `${x}px`,
        width: CONTAINER_WIDTH,
        padding: CONTAINER_PADDING
      }}
    >
      {isEditing ? (
        <input
          autoFocus
          className={clsx("excalidraw-hyperlinkContainer-input")}
          onChange={(event) => setInputVal(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
            // prevent cmd/ctrl+k shortcut when editing link
            if (event[KEYS.CTRL_OR_CMD] && event.key === KEYS.K) {
              event.preventDefault();
            }
            if (event.key === KEYS.ENTER || event.key === KEYS.ESCAPE) {
              handleSubmit();
            }
          }}
          placeholder="Type or paste your link here"
          ref={inputRef}
          value={inputVal}
        />
      ) : (
        <a
          className={clsx("excalidraw-hyperlinkContainer-link", {
            "d-none": isEditing
          })}
          href={normalizeLink(layer.link || "")}
          onClick={(event) => {
            if (layer.link && onLinkOpen) {
              const customEvent = wrapEvent(
                EVENT.EXCALIDRAW_LINK,
                event.nativeEvent
              );
              onLinkOpen(
                {
                  ...layer,
                  link: normalizeLink(layer.link)
                },
                customEvent
              );
              if (customEvent.defaultPrevented) {
                event.preventDefault();
              }
            }
          }}
          rel="noopener noreferrer"
          target={isLocalLink(layer.link) ? "_self" : "_blank"}
        >
          {layer.link}
        </a>
      )}
      <div className="excalidraw-hyperlinkContainer__buttons">
        {!isEditing && (
          <ToolButton
            aria-label={t("buttons.edit")}
            className="excalidraw-hyperlinkContainer--edit"
            icon={FreedrawIcon}
            label={t("buttons.edit")}
            onClick={onEdit}
            title={t("buttons.edit")}
            type="button"
          />
        )}

        {linkVal && (
          <ToolButton
            aria-label={t("buttons.remove")}
            className="excalidraw-hyperlinkContainer--remove"
            icon={TrashIcon}
            label={t("buttons.remove")}
            onClick={handleRemove}
            title={t("buttons.remove")}
            type="button"
          />
        )}
      </div>
    </div>
  );
};

const getCoordsForPopover = (
  layer: NonDeletedExcalidrawLayer,
  editorState: AppState
) => {
  const [x1, y1] = getLayerAbsoluteCoords(layer);
  const { x: viewportX, y: viewportY } = sceneCoordsToViewportCoords(
    { sceneX: x1 + layer.width / 2, sceneY: y1 },
    editorState
  );
  const x = viewportX - editorState.offsetLeft - CONTAINER_WIDTH / 2;
  const y = viewportY - editorState.offsetTop - SPACE_BOTTOM;
  return { x, y };
};

export const actionLink = register({
  name: "hyperlink",
  perform: (layers, editorState) => {
    if (editorState.showHyperlinkPopup === "editor") {
      return false;
    }

    return {
      layers,
      editorState: {
        ...editorState,
        showHyperlinkPopup: "editor",
        openMenu: null
      },
      commitToHistory: true
    };
  },
  trackEvent: { category: "hyperlink", action: "click" },
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.K,
  contextItemLabel: (layers, editorState) =>
    getContextMenuLabel(layers, editorState),
  predicate: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(layers, editorState);
    return selectedLayers.length === 1;
  },
  PanelComponent: ({ layers, editorState, updateData }) => {
    const selectedLayers = getSelectedLayers(layers, editorState);

    return (
      <ToolButton
        aria-label={t(getContextMenuLabel(layers, editorState))}
        icon={LinkIcon}
        onClick={() => updateData(null)}
        selected={selectedLayers.length === 1 && !!selectedLayers[0].link}
        title={`${t("labels.link.label")} - ${getShortcutKey("CtrlOrCmd+K")}`}
        type="button"
      />
    );
  }
});

export const getContextMenuLabel = (
  layers: readonly NonDeletedExcalidrawLayer[],
  editorState: AppState
) => {
  const selectedLayers = getSelectedLayers(layers, editorState);
  const label = selectedLayers[0]!.link
    ? "labels.link.edit"
    : "labels.link.create";
  return label;
};

export const getLinkHandleFromCoords = (
  [x1, y1, x2, y2]: Bounds,
  angle: number,
  editorState: UIAppState
): [x: number, y: number, width: number, height: number] => {
  const size = DEFAULT_LINK_SIZE;
  const linkWidth = size / editorState.zoom.value;
  const linkHeight = size / editorState.zoom.value;
  const linkMarginY = size / editorState.zoom.value;
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  const centeringOffset = (size - 8) / (2 * editorState.zoom.value);
  const dashedLineMargin = 4 / editorState.zoom.value;

  // Same as `ne` resize handle
  const x = x2 + dashedLineMargin - centeringOffset;
  const y = y1 - dashedLineMargin - linkMarginY + centeringOffset;

  const [rotatedX, rotatedY] = rotate(
    x + linkWidth / 2,
    y + linkHeight / 2,
    centerX,
    centerY,
    angle
  );
  return [
    rotatedX - linkWidth / 2,
    rotatedY - linkHeight / 2,
    linkWidth,
    linkHeight
  ];
};

export const isPointHittingLinkIcon = (
  layer: NonDeletedExcalidrawLayer,
  editorState: AppState,
  [x, y]: Point,
  isMobile: boolean
) => {
  if (!layer.link || editorState.selectedLayerIds[layer.id]) {
    return false;
  }
  const threshold = 4 / editorState.zoom.value;
  if (
    !isMobile &&
    editorState.viewModeEnabled &&
    isPointHittingLayerBoundingBox(layer, [x, y], threshold, null)
  ) {
    return true;
  }
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);

  const [linkX, linkY, linkWidth, linkHeight] = getLinkHandleFromCoords(
    [x1, y1, x2, y2],
    layer.angle,
    editorState
  );
  const hitLink =
    x > linkX - threshold &&
    x < linkX + threshold + linkWidth &&
    y > linkY - threshold &&
    y < linkY + linkHeight + threshold;
  return hitLink;
};

let HYPERLINK_TOOLTIP_TIMEOUT_ID: number | null = null;
export const showHyperlinkTooltip = (
  layer: NonDeletedExcalidrawLayer,
  editorState: AppState
) => {
  if (HYPERLINK_TOOLTIP_TIMEOUT_ID) {
    clearTimeout(HYPERLINK_TOOLTIP_TIMEOUT_ID);
  }
  HYPERLINK_TOOLTIP_TIMEOUT_ID = window.setTimeout(
    () => renderTooltip(layer, editorState),
    HYPERLINK_TOOLTIP_DELAY
  );
};

const renderTooltip = (
  layer: NonDeletedExcalidrawLayer,
  editorState: AppState
) => {
  if (!layer.link) {
    return;
  }

  const tooltipDiv = getTooltipDiv();

  tooltipDiv.classList.add("excalidraw-tooltip--visible");
  tooltipDiv.style.maxWidth = "20rem";
  tooltipDiv.textContent = layer.link;

  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);

  const [linkX, linkY, linkWidth, linkHeight] = getLinkHandleFromCoords(
    [x1, y1, x2, y2],
    layer.angle,
    editorState
  );

  const linkViewportCoords = sceneCoordsToViewportCoords(
    { sceneX: linkX, sceneY: linkY },
    editorState
  );

  updateTooltipPosition(
    tooltipDiv,
    {
      left: linkViewportCoords.x,
      top: linkViewportCoords.y,
      width: linkWidth,
      height: linkHeight
    },
    "top"
  );
  trackEvent("hyperlink", "tooltip", "link-icon");

  IS_HYPERLINK_TOOLTIP_VISIBLE = true;
};
export const hideHyperlinkToolip = () => {
  if (HYPERLINK_TOOLTIP_TIMEOUT_ID) {
    clearTimeout(HYPERLINK_TOOLTIP_TIMEOUT_ID);
  }
  if (IS_HYPERLINK_TOOLTIP_VISIBLE) {
    IS_HYPERLINK_TOOLTIP_VISIBLE = false;
    getTooltipDiv().classList.remove("excalidraw-tooltip--visible");
  }
};

export const shouldHideLinkPopup = (
  layer: NonDeletedExcalidrawLayer,
  editorState: AppState,
  [clientX, clientY]: Point
): Boolean => {
  const { x: sceneX, y: sceneY } = viewportCoordsToSceneCoords(
    { clientX, clientY },
    editorState
  );

  const threshold = 15 / editorState.zoom.value;
  // hitbox to prevent hiding when hovered in layer bounding box
  if (
    isPointHittingLayerBoundingBox(layer, [sceneX, sceneY], threshold, null)
  ) {
    return false;
  }
  const [x1, y1, x2] = getLayerAbsoluteCoords(layer);
  // hit box to prevent hiding when hovered in the vertical area between layer and popover
  if (
    sceneX >= x1 &&
    sceneX <= x2 &&
    sceneY >= y1 - SPACE_BOTTOM &&
    sceneY <= y1
  ) {
    return false;
  }
  // hit box to prevent hiding when hovered around popover within threshold
  const { x: popoverX, y: popoverY } = getCoordsForPopover(layer, editorState);

  if (
    clientX >= popoverX - threshold &&
    clientX <= popoverX + CONTAINER_WIDTH + CONTAINER_PADDING * 2 + threshold &&
    clientY >= popoverY - threshold &&
    clientY <= popoverY + threshold + CONTAINER_PADDING * 2 + CONTAINER_HEIGHT
  ) {
    return false;
  }
  return true;
};
