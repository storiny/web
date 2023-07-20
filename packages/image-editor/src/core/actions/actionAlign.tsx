import {
  AlignBottomIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  CenterHorizontallyIcon,
  CenterVerticallyIcon
} from "../../components/core/icons";
import { ToolButton } from "../../components/core/ToolButton";
import {
  alignLayers,
  Alignment,
  arrayToMap,
  getNonDeletedLayers,
  getSelectedLayers,
  LayersIncludingDeleted
} from "../../lib";
import { EditorClassProperties, EditorState, Layer } from "../../types";
import { AppState } from "../types";
import { register } from "./register";

export const updateFrameMembershipOfSelectedElements = (
  allElements: LayersIncludingDeleted,
  editorState: EditorState,
  app: EditorClassProperties
) => {
  const selectedElements = app.scene.getSelectedElements({
    selectedElementIds: appState.selectedElementIds,
    // supplying elements explicitly in case we're passed non-state elements
    elements: allElements
  });
  const elementsToFilter = new Set<ExcalidrawElement>(selectedElements);

  if (appState.editingGroupId) {
    for (const element of selectedElements) {
      if (element.groupIds.length === 0) {
        elementsToFilter.add(element);
      } else {
        element.groupIds
          .flatMap((gid) => getElementsInGroup(allElements, gid))
          .forEach((element) => elementsToFilter.add(element));
      }
    }
  }

  const elementsToRemove = new Set<ExcalidrawElement>();

  elementsToFilter.forEach((element) => {
    if (
      element.frameId &&
      !isFrameElement(element) &&
      !isElementInFrame(element, allElements, appState)
    ) {
      elementsToRemove.add(element);
    }
  });

  return elementsToRemove.size > 0
    ? removeElementsFromFrame(allElements, [...elementsToRemove], appState)
    : allElements;
};

const alignActionsPredicate = (
  layers: readonly Layer[],
  editorState: AppState
): boolean => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    editorState
  );

  return selectedLayers.length > 1;
};

const alignSelectedLayers = (
  layers: readonly Layer[],
  editorState: Readonly<EditorState>,
  alignment: Alignment
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    editorState
  );
  const updatedLayers = alignLayers(selectedLayers, alignment);
  const updatedLayersMap = arrayToMap(updatedLayers);

  return updateFrameMembershipOfSelectedLayers(
    layers.map((layer) => updatedLayersMap.get(layer.id) || layer),
    editorState
  );
};

export const actionAlignTop = register({
  name: "alignTop",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, editorState) => ({
    editorState,
    layers: alignSelectedLayers(layers, editorState, {
      position: "start",
      axis: "y"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_UP,
  PanelComponent: ({ layers, editorState, updateData }) => (
    <ToolButton
      aria-label={t("labels.alignTop")}
      hidden={!alignActionsPredicate(layers, editorState)}
      icon={AlignTopIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.alignTop")} — ${getShortcutKey(
        "CtrlOrCmd+Shift+Up"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), editorState)}
    />
  )
});

export const actionAlignBottom = register({
  name: "alignBottom",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, editorState) => ({
    editorState,
    layers: alignSelectedLayers(layers, editorState, {
      position: "end",
      axis: "y"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_DOWN,
  PanelComponent: ({ layers, editorState, updateData }) => (
    <ToolButton
      aria-label={t("labels.alignBottom")}
      hidden={!alignActionsPredicate(layers, editorState)}
      icon={AlignBottomIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.alignBottom")} — ${getShortcutKey(
        "CtrlOrCmd+Shift+Down"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), editorState)}
    />
  )
});

export const actionAlignLeft = register({
  name: "alignLeft",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, editorState) => ({
    editorState,
    layers: alignSelectedLayers(layers, editorState, {
      position: "start",
      axis: "x"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_LEFT,
  PanelComponent: ({ layers, editorState, updateData }) => (
    <ToolButton
      aria-label={t("labels.alignLeft")}
      hidden={!alignActionsPredicate(layers, editorState)}
      icon={AlignLeftIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.alignLeft")} — ${getShortcutKey(
        "CtrlOrCmd+Shift+Left"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), editorState)}
    />
  )
});

export const actionAlignRight = register({
  name: "alignRight",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, editorState) => ({
    editorState,
    layers: alignSelectedLayers(layers, editorState, {
      position: "end",
      axis: "x"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_RIGHT,
  PanelComponent: ({ layers, editorState, updateData }) => (
    <ToolButton
      aria-label={t("labels.alignRight")}
      hidden={!alignActionsPredicate(layers, editorState)}
      icon={AlignRightIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.alignRight")} — ${getShortcutKey(
        "CtrlOrCmd+Shift+Right"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), editorState)}
    />
  )
});

export const actionAlignVerticallyCentered = register({
  name: "alignVerticallyCentered",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, editorState) => ({
    editorState,
    layers: alignSelectedLayers(layers, editorState, {
      position: "center",
      axis: "y"
    }),
    commitToHistory: true
  }),
  PanelComponent: ({ layers, editorState, updateData }) => (
    <ToolButton
      aria-label={t("labels.centerVertically")}
      hidden={!alignActionsPredicate(layers, editorState)}
      icon={CenterVerticallyIcon}
      onClick={() => updateData(null)}
      title={t("labels.centerVertically")}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), editorState)}
    />
  )
});

export const actionAlignHorizontallyCentered = register({
  name: "alignHorizontallyCentered",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, editorState) => ({
    editorState,
    layers: alignSelectedLayers(layers, editorState, {
      position: "center",
      axis: "x"
    }),
    commitToHistory: true
  }),
  PanelComponent: ({ layers, editorState, updateData }) => (
    <ToolButton
      aria-label={t("labels.centerHorizontally")}
      hidden={!alignActionsPredicate(layers, editorState)}
      icon={CenterHorizontallyIcon}
      onClick={() => updateData(null)}
      title={t("labels.centerHorizontally")}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), editorState)}
    />
  )
});
