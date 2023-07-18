import { GRID_SIZE } from "../constants";
import { CODES, KEYS } from "../keys";
import { AppState } from "../types";
import { register } from "./register";

export const actionToggleGridMode = register({
  name: "gridMode",
  viewMode: true,
  trackEvent: {
    category: "canvas",
    predicate: (editorState) => !editorState.gridSize
  },
  perform(layers, editorState) {
    return {
      editorState: {
        ...editorState,
        gridSize: this.checked!(editorState) ? null : GRID_SIZE
      },
      commitToHistory: false
    };
  },
  checked: (editorState: AppState) => editorState.gridSize !== null,
  predicate: (layer, editorState, props) =>
    typeof props.gridModeEnabled === "undefined",
  contextItemLabel: "labels.showGrid",
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.code === CODES.QUOTE
});
