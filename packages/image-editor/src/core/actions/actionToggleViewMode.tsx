import { CODES, KEYS } from "../keys";
import { register } from "./register";

export const actionToggleViewMode = register({
  name: "viewMode",
  viewMode: true,
  trackEvent: {
    category: "canvas",
    predicate: (appState) => !appState.viewModeEnabled
  },
  perform(layers, appState) {
    return {
      appState: {
        ...appState,
        viewModeEnabled: !this.checked!(appState)
      },
      commitToHistory: false
    };
  },
  checked: (appState) => appState.viewModeEnabled,
  predicate: (layers, appState, appProps) =>
    typeof appProps.viewModeEnabled === "undefined",
  contextItemLabel: "labels.viewMode",
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.R
});
