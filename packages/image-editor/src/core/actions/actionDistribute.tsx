import { getSelectedLayers, isSomeLayerSelected } from "../../lib/scene";
import { arrayToMap, getShortcutKey } from "../../lib/utils/utils";
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
import { register } from "./register";

const enableActionGroup = (
  layers: readonly ExcalidrawLayer[],
  editorState: AppState
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    editorState
  );
  return (
    selectedLayers.length > 1 &&
    // TODO enable distributing frames when implemented properly
    !selectedLayers.some((el) => el.type === "frame")
  );
};

const distributeSelectedLayers = (
  layers: readonly ExcalidrawLayer[],
  editorState: Readonly<AppState>,
  distribution: Distribution
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    editorState
  );

  const updatedLayers = distributeLayers(selectedLayers, distribution);

  const updatedLayersMap = arrayToMap(updatedLayers);

  return updateFrameMembershipOfSelectedLayers(
    layers.map((layer) => updatedLayersMap.get(layer.id) || layer),
    editorState
  );
};

export const distributeHorizontally = register({
  name: "distributeHorizontally",
  trackEvent: { category: "layer" },
  perform: (layers, editorState) => ({
    editorState,
    layers: distributeSelectedLayers(layers, editorState, {
      space: "between",
      axis: "x"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.H,
  PanelComponent: ({ layers, editorState, updateData }) => (
    <ToolButton
      aria-label={t("labels.distributeHorizontally")}
      hidden={!enableActionGroup(layers, editorState)}
      icon={DistributeHorizontallyIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.distributeHorizontally")} — ${getShortcutKey(
        "Alt+H"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), editorState)}
    />
  )
});

export const distributeVertically = register({
  name: "distributeVertically",
  trackEvent: { category: "layer" },
  perform: (layers, editorState) => ({
    editorState,
    layers: distributeSelectedLayers(layers, editorState, {
      space: "between",
      axis: "y"
    }),
    commitToHistory: true
  }),
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.V,
  PanelComponent: ({ layers, editorState, updateData }) => (
    <ToolButton
      aria-label={t("labels.distributeVertically")}
      hidden={!enableActionGroup(layers, editorState)}
      icon={DistributeVerticallyIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.distributeVertically")} — ${getShortcutKey("Alt+V")}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), editorState)}
    />
  )
});
