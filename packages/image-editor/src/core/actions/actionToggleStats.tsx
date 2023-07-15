import { CODES, KEYS } from "../keys";
import { register } from "./register";

export const actionToggleStats = register({
  name: "stats",
  viewMode: true,
  trackEvent: { category: "menu" },
  perform(layers, appState) {
    return {
      appState: {
        ...appState,
        showStats: !this.checked!(appState)
      },
      commitToHistory: false
    };
  },
  checked: (appState) => appState.showStats,
  contextItemLabel: "stats.title",
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.SLASH
});
