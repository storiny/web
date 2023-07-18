import { CODES, KEYS } from "../keys";
import { register } from "./register";

export const actionToggleStats = register({
  name: "stats",
  viewMode: true,
  trackEvent: { category: "menu" },
  perform(layers, editorState) {
    return {
      editorState: {
        ...editorState,
        showStats: !this.checked!(editorState)
      },
      commitToHistory: false
    };
  },
  checked: (editorState) => editorState.showStats,
  contextItemLabel: "stats.title",
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.SLASH
});
