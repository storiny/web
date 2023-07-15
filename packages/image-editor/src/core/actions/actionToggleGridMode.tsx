import { GRID_SIZE } from "../constants";
import { CODES, KEYS } from "../keys";
import { AppState } from "../types";
import { register } from "./register";

export const actionToggleGridMode = register({
  name: "gridMode",
  viewMode: true,
  trackEvent: {
    category: "canvas",
    predicate: (appState) => !appState.gridSize
  },
  perform(layers, appState) {
    return {
      appState: {
        ...appState,
        gridSize: this.checked!(appState) ? null : GRID_SIZE
      },
      commitToHistory: false
    };
  },
  checked: (appState: AppState) => appState.gridSize !== null,
  predicate: (layer, appState, props) =>
    typeof props.gridModeEnabled === "undefined",
  contextItemLabel: "labels.showGrid",
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.code === CODES.QUOTE
});
