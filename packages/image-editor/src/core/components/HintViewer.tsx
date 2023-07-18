import "./HintViewer.scss";

import { getSelectedLayers } from "../../lib/scene";
import { getShortcutKey } from "../../lib/utils/utils";
import { isEraserActive } from "../editorState";
import { t } from "../i18n";
import {
  isImageLayer,
  isLinearLayer,
  isTextBindableContainer,
  isTextLayer
} from "../layer/typeChecks";
import { NonDeletedExcalidrawLayer } from "../layer/types";
import { Device, UIAppState } from "../types";

interface HintViewerProps {
  device: Device;
  editorState: UIAppState;
  isMobile: boolean;
  layers: readonly NonDeletedExcalidrawLayer[];
}

const getHints = ({
  editorState,
  layers,
  isMobile,
  device
}: HintViewerProps) => {
  const { activeTool, isResizing, isRotating, lastPointerDownWith } =
    editorState;
  const multiMode = editorState.multiLayer !== null;

  if (editorState.openSidebar && !device.canDeviceFitSidebar) {
    return null;
  }

  if (isEraserActive(editorState)) {
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

  if (
    editorState.activeTool.type === "image" &&
    editorState.pendingImageLayerId
  ) {
    return t("hints.placeImage");
  }

  const selectedLayers = getSelectedLayers(layers, editorState);

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

  if (editorState.editingLayer && isTextLayer(editorState.editingLayer)) {
    return t("hints.text_editing");
  }

  if (activeTool.type === "selection") {
    if (
      editorState.draggingLayer?.type === "selection" &&
      !editorState.editingLayer &&
      !editorState.editingLinearLayer
    ) {
      return t("hints.deepBoxSelect");
    }
    if (!selectedLayers.length && !isMobile) {
      return t("hints.canvasPanning");
    }
  }

  if (selectedLayers.length === 1) {
    if (isLinearLayer(selectedLayers[0])) {
      if (editorState.editingLinearLayer) {
        return editorState.editingLinearLayer.selectedPointsIndices
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
  editorState,
  layers,
  isMobile,
  device
}: HintViewerProps) => {
  let hint = getHints({
    editorState,
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
