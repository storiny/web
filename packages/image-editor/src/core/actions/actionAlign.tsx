import { getSelectedLayers, isSomeLayerSelected } from "../../lib/scene";
import { alignLayers, Alignment } from "../align";
import {
  AlignBottomIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  CenterHorizontallyIcon,
  CenterVerticallyIcon
} from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { updateFrameMembershipOfSelectedLayers } from "../frame";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { getNonDeletedLayers } from "../layer";
import { ExcalidrawLayer } from "../layer/types";
import { AppState } from "../types";
import { arrayToMap, getShortcutKey } from "../utils";
import { register } from "./register";

const alignActionsPredicate = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    appState
  );
  return (
    selectedLayers.length > 1 &&
    // TODO enable aligning frames when implemented properly
    !selectedLayers.some((el) => el.type === "frame")
  );
};

const alignSelectedLayers = (
  layers: readonly ExcalidrawLayer[],
  appState: Readonly<AppState>,
  alignment: Alignment
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    appState
  );

  const updatedLayers = alignLayers(selectedLayers, alignment);

  const updatedLayersMap = arrayToMap(updatedLayers);

  return updateFrameMembershipOfSelectedLayers(
    layers.map((layer) => updatedLayersMap.get(layer.id) || layer),
    appState
  );
};

export const actionAlignTop = register({
  name: "alignTop",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, appState) => ({
    appState,
    layers: alignSelectedLayers(layers, appState, {
      position: "start",
      axis: "y"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_UP,
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.alignTop")}
      hidden={!alignActionsPredicate(layers, appState)}
      icon={AlignTopIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.alignTop")} — ${getShortcutKey(
        "CtrlOrCmd+Shift+Up"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    />
  )
});

export const actionAlignBottom = register({
  name: "alignBottom",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, appState) => ({
    appState,
    layers: alignSelectedLayers(layers, appState, {
      position: "end",
      axis: "y"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_DOWN,
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.alignBottom")}
      hidden={!alignActionsPredicate(layers, appState)}
      icon={AlignBottomIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.alignBottom")} — ${getShortcutKey(
        "CtrlOrCmd+Shift+Down"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    />
  )
});

export const actionAlignLeft = register({
  name: "alignLeft",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, appState) => ({
    appState,
    layers: alignSelectedLayers(layers, appState, {
      position: "start",
      axis: "x"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_LEFT,
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.alignLeft")}
      hidden={!alignActionsPredicate(layers, appState)}
      icon={AlignLeftIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.alignLeft")} — ${getShortcutKey(
        "CtrlOrCmd+Shift+Left"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    />
  )
});

export const actionAlignRight = register({
  name: "alignRight",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, appState) => ({
    appState,
    layers: alignSelectedLayers(layers, appState, {
      position: "end",
      axis: "x"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_RIGHT,
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.alignRight")}
      hidden={!alignActionsPredicate(layers, appState)}
      icon={AlignRightIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.alignRight")} — ${getShortcutKey(
        "CtrlOrCmd+Shift+Right"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    />
  )
});

export const actionAlignVerticallyCentered = register({
  name: "alignVerticallyCentered",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, appState) => ({
    appState,
    layers: alignSelectedLayers(layers, appState, {
      position: "center",
      axis: "y"
    }),
    commitToHistory: true
  }),
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.centerVertically")}
      hidden={!alignActionsPredicate(layers, appState)}
      icon={CenterVerticallyIcon}
      onClick={() => updateData(null)}
      title={t("labels.centerVertically")}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    />
  )
});

export const actionAlignHorizontallyCentered = register({
  name: "alignHorizontallyCentered",
  trackEvent: { category: "layer" },
  predicate: alignActionsPredicate,
  perform: (layers, appState) => ({
    appState,
    layers: alignSelectedLayers(layers, appState, {
      position: "center",
      axis: "x"
    }),
    commitToHistory: true
  }),
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.centerHorizontally")}
      hidden={!alignActionsPredicate(layers, appState)}
      icon={CenterHorizontallyIcon}
      onClick={() => updateData(null)}
      title={t("labels.centerHorizontally")}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    />
  )
});
