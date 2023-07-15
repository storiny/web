import "./HintViewer.scss";

import { getSelectedLayers } from "../../lib/scene";
import { isEraserActive } from "../appState";
import { t } from "../i18n";
import {
  isImageLayer,
  isLinearLayer,
  isTextBindableContainer,
  isTextLayer
} from "../layer/typeChecks";
import { NonDeletedExcalidrawLayer } from "../layer/types";
import { Device, UIAppState } from "../types";
import { getShortcutKey } from "../utils";

interface HintViewerProps {
  appState: UIAppState;
  device: Device;
  isMobile: boolean;
  layers: readonly NonDeletedExcalidrawLayer[];
}

const getHints = ({ appState, layers, isMobile, device }: HintViewerProps) => {
  const { activeTool, isResizing, isRotating, lastPointerDownWith } = appState;
  const multiMode = appState.multiLayer !== null;

  if (appState.openSidebar && !device.canDeviceFitSidebar) {
    return null;
  }

  if (isEraserActive(appState)) {
    return t("hints.eraserRevert");
  }
  if (activeTool.type === "arrow" || activeTool.type === "line") {
    if (!multiMode) {
      return t("hints.linearLayer");
    }
    return t("hints.linearLayerMulti");
  }

  if (activeTool.type === "freedraw") {
    return t("hints.freeDraw");
  }

  if (activeTool.type === "text") {
    return t("hints.text");
  }

  if (appState.activeTool.type === "image" && appState.pendingImageLayerId) {
    return t("hints.placeImage");
  }

  const selectedLayers = getSelectedLayers(layers, appState);

  if (
    isResizing &&
    lastPointerDownWith === "mouse" &&
    selectedLayers.length === 1
  ) {
    const targetLayer = selectedLayers[0];
    if (isLinearLayer(targetLayer) && targetLayer.points.length === 2) {
      return t("hints.lockAngle");
    }
    return isImageLayer(targetLayer)
      ? t("hints.resizeImage")
      : t("hints.resize");
  }

  if (isRotating && lastPointerDownWith === "mouse") {
    return t("hints.rotate");
  }

  if (selectedLayers.length === 1 && isTextLayer(selectedLayers[0])) {
    return t("hints.text_selected");
  }

  if (appState.editingLayer && isTextLayer(appState.editingLayer)) {
    return t("hints.text_editing");
  }

  if (activeTool.type === "selection") {
    if (
      appState.draggingLayer?.type === "selection" &&
      !appState.editingLayer &&
      !appState.editingLinearLayer
    ) {
      return t("hints.deepBoxSelect");
    }
    if (!selectedLayers.length && !isMobile) {
      return t("hints.canvasPanning");
    }
  }

  if (selectedLayers.length === 1) {
    if (isLinearLayer(selectedLayers[0])) {
      if (appState.editingLinearLayer) {
        return appState.editingLinearLayer.selectedPointsIndices
          ? t("hints.lineEditor_pointSelected")
          : t("hints.lineEditor_nothingSelected");
      }
      return t("hints.lineEditor_info");
    }
    if (isTextBindableContainer(selectedLayers[0])) {
      return t("hints.bindTextToLayer");
    }
  }

  return null;
};

export const HintViewer = ({
  appState,
  layers,
  isMobile,
  device
}: HintViewerProps) => {
  let hint = getHints({
    appState,
    layers,
    isMobile,
    device
  });
  if (!hint) {
    return null;
  }

  hint = getShortcutKey(hint);

  return (
    <div className="HintViewer">
      <span>{hint}</span>
    </div>
  );
};
