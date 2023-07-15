import { RedoIcon, UndoIcon } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { isWindows } from "../constants";
import History, { HistoryEntry } from "../history";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { fixBindingsAfterDeletion } from "../layer/binding";
import { newLayerWith } from "../layer/mutateLayer";
import { ExcalidrawLayer } from "../layer/types";
import { AppState } from "../types";
import { arrayToMap } from "../utils";
import { Action, ActionResult } from "./types";

const writeData = (
  prevLayers: readonly ExcalidrawLayer[],
  appState: AppState,
  updater: () => HistoryEntry | null
): ActionResult => {
  const commitToHistory = false;
  if (
    !appState.multiLayer &&
    !appState.resizingLayer &&
    !appState.editingLayer &&
    !appState.draggingLayer
  ) {
    const data = updater();
    if (data === null) {
      return { commitToHistory };
    }

    const prevLayerMap = arrayToMap(prevLayers);
    const nextLayers = data.layers;
    const nextLayerMap = arrayToMap(nextLayers);

    const deletedLayers = prevLayers.filter(
      (prevLayer) => !nextLayerMap.has(prevLayer.id)
    );
    const layers = nextLayers
      .map((nextLayer) =>
        newLayerWith(prevLayerMap.get(nextLayer.id) || nextLayer, nextLayer)
      )
      .concat(
        deletedLayers.map((prevLayer) =>
          newLayerWith(prevLayer, { isDeleted: true })
        )
      );
    fixBindingsAfterDeletion(layers, deletedLayers);

    return {
      layers,
      appState: { ...appState, ...data.appState },
      commitToHistory,
      syncHistory: true
    };
  }
  return { commitToHistory };
};

type ActionCreator = (history: History) => Action;

export const createUndoAction: ActionCreator = (history) => ({
  name: "undo",
  trackEvent: { category: "history" },
  perform: (layers, appState) =>
    writeData(layers, appState, () => history.undoOnce()),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] &&
    event.key.toLowerCase() === KEYS.Z &&
    !event.shiftKey,
  PanelComponent: ({ updateData, data }) => (
    <ToolButton
      aria-label={t("buttons.undo")}
      icon={UndoIcon}
      onClick={updateData}
      size={data?.size || "medium"}
      type="button"
    />
  ),
  commitToHistory: () => false
});

export const createRedoAction: ActionCreator = (history) => ({
  name: "redo",
  trackEvent: { category: "history" },
  perform: (layers, appState) =>
    writeData(layers, appState, () => history.redoOnce()),
  keyTest: (event) =>
    (event[KEYS.CTRL_OR_CMD] &&
      event.shiftKey &&
      event.key.toLowerCase() === KEYS.Z) ||
    (isWindows && event.ctrlKey && !event.shiftKey && event.key === KEYS.Y),
  PanelComponent: ({ updateData, data }) => (
    <ToolButton
      aria-label={t("buttons.redo")}
      icon={RedoIcon}
      onClick={updateData}
      size={data?.size || "medium"}
      type="button"
    />
  ),
  commitToHistory: () => false
});
