import { CODES, KEYS } from "../keys";
import { register } from "./register";

export const actionToggleZenMode = register({
  name: "zenMode",
  viewMode: true,
  trackEvent: {
    category: "canvas",
    predicate: (editorState) => !editorState.zenModeEnabled
  },
  perform(layers, editorState) {
    return {
      editorState: {
        ...editorState,
        zenModeEnabled: !this.checked!(editorState)
      },
      commitToHistory: false
    };
  },
  checked: (editorState) => editorState.zenModeEnabled,
  predicate: (layers, editorState, appProps) =>
    typeof appProps.zenModeEnabled === "undefined",
  contextItemLabel: "buttons.zenMode",
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.Z
});
