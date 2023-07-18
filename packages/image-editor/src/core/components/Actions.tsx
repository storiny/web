import "./Actions.scss";

import clsx from "clsx";
import React, { useState } from "react";

import {
  canChangeRoundness,
  canHaveArrowheads,
  getTargetLayers,
  hasBackground,
  hasStrokeStyle,
  hasStrokeWidth,
  hasText
} from "../../lib/scene";
import { hasStrokeColor } from "../../lib/scene/comparisons";
import {
  capitalizeString,
  isTransparent,
  setCursorForShape,
  updateActiveTool
} from "../../lib/utils/utils";
import { actionToggleZenMode } from "../actions";
import { ActionManager } from "../actions/manager";
import { trackEvent } from "../analytics";
import { useDevice } from "../components/App";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { getNonDeletedLayers } from "../layer";
import {
  shouldAllowVerticalAlign,
  suppportsHorizontalAlign
} from "../layer/textLayer";
import { hasBoundTextLayer } from "../layer/typeChecks";
import { ExcalidrawLayer, PointerType } from "../layer/types";
import { SHAPES } from "../shapes";
import { UIAppState, Zoom } from "../types";
import DropdownMenu from "./dropdownMenu/DropdownMenu";
import { extraToolsIcon, frameToolIcon } from "./icons";
import Stack from "./Stack";
import { ToolButton } from "./ToolButton";
import { Tooltip } from "./Tooltip";

export const SelectedShapeActions = ({
  editorState,
  layers,
  renderAction
}: {
  editorState: UIAppState;
  layers: readonly ExcalidrawLayer[];
  renderAction: ActionManager["renderAction"];
}) => {
  const targetLayers = getTargetLayers(
    getNonDeletedLayers(layers),
    editorState
  );

  let isSingleLayerBoundContainer = false;
  if (
    targetLayers.length === 2 &&
    (hasBoundTextLayer(targetLayers[0]) || hasBoundTextLayer(targetLayers[1]))
  ) {
    isSingleLayerBoundContainer = true;
  }
  const isEditing = Boolean(editorState.editingLayer);
  const device = useDevice();
  const isRTL = document.documentLayer.getAttribute("dir") === "rtl";

  const showFillIcons =
    hasBackground(editorState.activeTool.type) ||
    targetLayers.some(
      (layer) =>
        hasBackground(layer.type) && !isTransparent(layer.backgroundColor)
    );
  const showChangeBackgroundIcons =
    hasBackground(editorState.activeTool.type) ||
    targetLayers.some((layer) => hasBackground(layer.type));

  const showLinkIcon = targetLayers.length === 1 || isSingleLayerBoundContainer;

  let commonSelectedType: string | null = targetLayers[0]?.type || null;

  for (const layer of targetLayers) {
    if (layer.type !== commonSelectedType) {
      commonSelectedType = null;
      break;
    }
  }

  return (
    <div className="panelColumn">
      <div>
        {((hasStrokeColor(editorState.activeTool.type) &&
          editorState.activeTool.type !== "image" &&
          commonSelectedType !== "image" &&
          commonSelectedType !== "frame") ||
          targetLayers.some((layer) => hasStrokeColor(layer.type))) &&
          renderAction("changeStrokeColor")}
      </div>
      {showChangeBackgroundIcons && (
        <div>{renderAction("changeBackgroundColor")}</div>
      )}
      {showFillIcons && renderAction("changeFillStyle")}

      {(hasStrokeWidth(editorState.activeTool.type) ||
        targetLayers.some((layer) => hasStrokeWidth(layer.type))) &&
        renderAction("changeStrokeWidth")}

      {(editorState.activeTool.type === "freedraw" ||
        targetLayers.some((layer) => layer.type === "freedraw")) &&
        renderAction("changeStrokeShape")}

      {(hasStrokeStyle(editorState.activeTool.type) ||
        targetLayers.some((layer) => hasStrokeStyle(layer.type))) && (
        <>
          {renderAction("changeStrokeStyle")}
          {renderAction("changeSloppiness")}
        </>
      )}

      {(canChangeRoundness(editorState.activeTool.type) ||
        targetLayers.some((layer) => canChangeRoundness(layer.type))) && (
        <>{renderAction("changeRoundness")}</>
      )}

      {(hasText(editorState.activeTool.type) ||
        targetLayers.some((layer) => hasText(layer.type))) && (
        <>
          {renderAction("changeFontSize")}

          {renderAction("changeFontFamily")}

          {suppportsHorizontalAlign(targetLayers) &&
            renderAction("changeTextAlign")}
        </>
      )}

      {shouldAllowVerticalAlign(targetLayers) &&
        renderAction("changeVerticalAlign")}
      {(canHaveArrowheads(editorState.activeTool.type) ||
        targetLayers.some((layer) => canHaveArrowheads(layer.type))) && (
        <>{renderAction("changeArrowhead")}</>
      )}

      {renderAction("changeOpacity")}

      <fieldset>
        <legend>{t("labels.layers")}</legend>
        <div className="buttonList">
          {renderAction("sendToBack")}
          {renderAction("sendBackward")}
          {renderAction("bringToFront")}
          {renderAction("bringForward")}
        </div>
      </fieldset>

      {targetLayers.length > 1 && !isSingleLayerBoundContainer && (
        <fieldset>
          <legend>{t("labels.align")}</legend>
          <div className="buttonList">
            {
              // swap this order for RTL so the button positions always match their action
              // (i.e. the leftmost button aligns left)
            }
            {isRTL ? (
              <>
                {renderAction("alignRight")}
                {renderAction("alignHorizontallyCentered")}
                {renderAction("alignLeft")}
              </>
            ) : (
              <>
                {renderAction("alignLeft")}
                {renderAction("alignHorizontallyCentered")}
                {renderAction("alignRight")}
              </>
            )}
            {targetLayers.length > 2 && renderAction("distributeHorizontally")}
            {/* breaks the row ˇˇ */}
            <div style={{ flexBasis: "100%", height: 0 }} />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: ".5rem",
                marginTop: "-0.5rem"
              }}
            >
              {renderAction("alignTop")}
              {renderAction("alignVerticallyCentered")}
              {renderAction("alignBottom")}
              {targetLayers.length > 2 && renderAction("distributeVertically")}
            </div>
          </div>
        </fieldset>
      )}
      {!isEditing && targetLayers.length > 0 && (
        <fieldset>
          <legend>{t("labels.actions")}</legend>
          <div className="buttonList">
            {!device.isMobile && renderAction("duplicateSelection")}
            {!device.isMobile && renderAction("deleteSelectedLayers")}
            {renderAction("group")}
            {renderAction("ungroup")}
            {showLinkIcon && renderAction("hyperlink")}
          </div>
        </fieldset>
      )}
    </div>
  );
};

export const ShapesSwitcher = ({
  canvas,
  activeTool,
  setAppState,
  onImageAction,
  editorState
}: {
  activeTool: UIAppState["activeTool"];
  canvas: HTMLCanvasLayer | null;
  editorState: UIAppState;
  onImageAction: (data: { pointerType: PointerType | null }) => void;
  setAppState: React.Component<any, UIAppState>["setState"];
}) => {
  const [isExtraToolsMenuOpen, setIsExtraToolsMenuOpen] = useState(false);
  const device = useDevice();
  return (
    <>
      {SHAPES.map(({ value, icon, key, numericKey, fillable }, index) => {
        const label = t(`toolBar.${value}`);
        const letter =
          key && capitalizeString(typeof key === "string" ? key : key[0]);
        const shortcut = letter
          ? `${letter} ${t("helpDialog.or")} ${numericKey}`
          : `${numericKey}`;
        return (
          <ToolButton
            aria-keyshortcuts={shortcut}
            aria-label={capitalizeString(label)}
            checked={activeTool.type === value}
            className={clsx("Shape", { fillable })}
            data-testid={`toolbar-${value}`}
            icon={icon}
            key={value}
            keyBindingLabel={numericKey || letter}
            name="editor-current-shape"
            onChange={({ pointerType }) => {
              if (editorState.activeTool.type !== value) {
                trackEvent("toolbar", value, "ui");
              }
              const nextActiveTool = updateActiveTool(editorState, {
                type: value
              });
              setAppState({
                activeTool: nextActiveTool,
                multiLayer: null,
                selectedLayerIds: {}
              });
              setCursorForShape(canvas, {
                ...editorState,
                activeTool: nextActiveTool
              });
              if (value === "image") {
                onImageAction({ pointerType });
              }
            }}
            onPointerDown={({ pointerType }) => {
              if (!editorState.penDetected && pointerType === "pen") {
                setAppState({
                  penDetected: true,
                  penMode: true
                });
              }
            }}
            title={`${capitalizeString(label)} — ${shortcut}`}
            type="radio"
          />
        );
      })}
      <div className="App-toolbar__divider" />
      {/* TEMP HACK because dropdown doesn't work well inside mobile toolbar */}
      {device.isMobile ? (
        <ToolButton
          aria-keyshortcuts={KEYS.F.toLocaleUpperCase()}
          aria-label={capitalizeString(t("toolBar.frame"))}
          checked={activeTool.type === "frame"}
          className={clsx("Shape", { fillable: false })}
          data-testid={`toolbar-frame`}
          icon={frameToolIcon}
          keyBindingLabel={KEYS.F.toLocaleUpperCase()}
          name="editor-current-shape"
          onChange={({ pointerType }) => {
            trackEvent("toolbar", "frame", "ui");
            const nextActiveTool = updateActiveTool(editorState, {
              type: "frame"
            });
            setAppState({
              activeTool: nextActiveTool,
              multiLayer: null,
              selectedLayerIds: {}
            });
          }}
          onPointerDown={({ pointerType }) => {
            if (!editorState.penDetected && pointerType === "pen") {
              setAppState({
                penDetected: true,
                penMode: true
              });
            }
          }}
          title={`${capitalizeString(
            t("toolBar.frame")
          )} — ${KEYS.F.toLocaleUpperCase()}`}
          type="radio"
        />
      ) : (
        <DropdownMenu open={isExtraToolsMenuOpen}>
          <DropdownMenu.Trigger
            className="App-toolbar__extra-tools-trigger"
            onToggle={() => setIsExtraToolsMenuOpen(!isExtraToolsMenuOpen)}
            title={t("toolBar.extraTools")}
          >
            {extraToolsIcon}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            className="App-toolbar__extra-tools-dropdown"
            onClickOutside={() => setIsExtraToolsMenuOpen(false)}
            onSelect={() => setIsExtraToolsMenuOpen(false)}
          >
            <DropdownMenu.Item
              data-testid="toolbar-frame"
              icon={frameToolIcon}
              onSelect={() => {
                const nextActiveTool = updateActiveTool(editorState, {
                  type: "frame"
                });
                setAppState({
                  activeTool: nextActiveTool,
                  multiLayer: null,
                  selectedLayerIds: {}
                });
              }}
              shortcut={KEYS.F.toLocaleUpperCase()}
            >
              {t("toolBar.frame")}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      )}
    </>
  );
};

export const ZoomActions = ({
  renderAction,
  zoom
}: {
  renderAction: ActionManager["renderAction"];
  zoom: Zoom;
}) => (
  <Stack.Col className="zoom-actions" gap={1}>
    <Stack.Row align="center">
      {renderAction("zoomOut")}
      {renderAction("resetZoom")}
      {renderAction("zoomIn")}
    </Stack.Row>
  </Stack.Col>
);

export const UndoRedoActions = ({
  renderAction,
  className
}: {
  className?: string;
  renderAction: ActionManager["renderAction"];
}) => (
  <div className={`undo-redo-buttons ${className}`}>
    <div className="undo-button-container">
      <Tooltip label={t("buttons.undo")}>{renderAction("undo")}</Tooltip>
    </div>
    <div className="redo-button-container">
      <Tooltip label={t("buttons.redo")}> {renderAction("redo")}</Tooltip>
    </div>
  </div>
);

export const ExitZenModeAction = ({
  actionManager,
  showExitZenModeBtn
}: {
  actionManager: ActionManager;
  showExitZenModeBtn: boolean;
}) => (
  <button
    className={clsx("disable-zen-mode", {
      "disable-zen-mode--visible": showExitZenModeBtn
    })}
    onClick={() => actionManager.executeAction(actionToggleZenMode)}
  >
    {t("buttons.exitZenMode")}
  </button>
);

export const FinalizeAction = ({
  renderAction,
  className
}: {
  className?: string;
  renderAction: ActionManager["renderAction"];
}) => (
  <div className={`finalize-button ${className}`}>
    {renderAction("finalize", { size: "small" })}
  </div>
);
