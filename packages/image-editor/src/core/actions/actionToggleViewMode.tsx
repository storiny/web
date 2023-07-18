import { CODES, KEYS } from "../keys";
import { register } from "./register";

export const actionToggleViewMode = register({
  name: "viewMode",
  viewMode: true,
  trackEvent: {
    category: "canvas",
    predicate: (editorState) => !editorState.viewModeEnabled
  },
  perform(layers, editorState) {
    return {
      editorState: {
        ...editorState,
        viewModeEnabled: !this.checked!(editorState)
      },
      commitToHistory: false
    };
  },
  checked: (editorState) => editorState.viewModeEnabled,
  predicate: (layers, editorState, appProps) =>
    typeof appProps.viewModeEnabled === "undefined",
  contextItemLabel: "labels.viewMode",
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.R
});
