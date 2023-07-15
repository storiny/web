import { getSelectedLayers, isSomeLayerSelected } from "../../lib/scene";
import {
  DistributeHorizontallyIcon,
  DistributeVerticallyIcon
} from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { distributeLayers, Distribution } from "../distribute";
import { updateFrameMembershipOfSelectedLayers } from "../frame";
import { t } from "../i18n";
import { CODES, KEYS } from "../keys";
import { getNonDeletedLayers } from "../layer";
import { ExcalidrawLayer } from "../layer/types";
import { AppState } from "../types";
import { arrayToMap, getShortcutKey } from "../utils";
import { register } from "./register";

const enableActionGroup = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    appState
  );
  return (
    selectedLayers.length > 1 &&
    // TODO enable distributing frames when implemented properly
    !selectedLayers.some((el) => el.type === "frame")
  );
};

const distributeSelectedLayers = (
  layers: readonly ExcalidrawLayer[],
  appState: Readonly<AppState>,
  distribution: Distribution
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    appState
  );

  const updatedLayers = distributeLayers(selectedLayers, distribution);

  const updatedLayersMap = arrayToMap(updatedLayers);

  return updateFrameMembershipOfSelectedLayers(
    layers.map((layer) => updatedLayersMap.get(layer.id) || layer),
    appState
  );
};

export const distributeHorizontally = register({
  name: "distributeHorizontally",
  trackEvent: { category: "layer" },
  perform: (layers, appState) => ({
    appState,
    layers: distributeSelectedLayers(layers, appState, {
      space: "between",
      axis: "x"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.H,
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.distributeHorizontally")}
      hidden={!enableActionGroup(layers, appState)}
      icon={DistributeHorizontallyIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.distributeHorizontally")} — ${getShortcutKey(
        "Alt+H"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    />
  )
});

export const distributeVertically = register({
  name: "distributeVertically",
  trackEvent: { category: "layer" },
  perform: (layers, appState) => ({
    appState,
    layers: distributeSelectedLayers(layers, appState, {
      space: "between",
      axis: "y"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.V,
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.distributeVertically")}
      hidden={!enableActionGroup(layers, appState)}
      icon={DistributeVerticallyIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.distributeVertically")} — ${getShortcutKey("Alt+V")}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    />
  )
});
