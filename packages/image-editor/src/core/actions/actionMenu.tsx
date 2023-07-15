import { HamburgerMenuIcon, palette } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { getNonDeletedLayers, showSelectedShapeActions } from "../layer";
import { allowFullScreen, exitFullScreen, isFullScreen } from "../utils";
import { register } from "./register";

export const actionToggleCanvasMenu = register({
  name: "toggleCanvasMenu",
  trackEvent: { category: "menu" },
  perform: (_, appState) => ({
    appState: {
      ...appState,
      openMenu: appState.openMenu === "canvas" ? null : "canvas"
    },
    commitToHistory: false
  }),
  PanelComponent: ({ appState, updateData }) => (
    <ToolButton
      aria-label={t("buttons.menu")}
      icon={HamburgerMenuIcon}
      onClick={updateData}
      selected={appState.openMenu === "canvas"}
      type="button"
    />
  )
});

export const actionToggleEditMenu = register({
  name: "toggleEditMenu",
  trackEvent: { category: "menu" },
  perform: (_layers, appState) => ({
    appState: {
      ...appState,
      openMenu: appState.openMenu === "shape" ? null : "shape"
    },
    commitToHistory: false
  }),
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("buttons.edit")}
      icon={palette}
      onClick={updateData}
      selected={appState.openMenu === "shape"}
      type="button"
      visible={showSelectedShapeActions(appState, getNonDeletedLayers(layers))}
    />
  )
});

export const actionFullScreen = register({
  name: "toggleFullScreen",
  viewMode: true,
  trackEvent: { category: "canvas", predicate: (appState) => !isFullScreen() },
  perform: () => {
    if (!isFullScreen()) {
      allowFullScreen();
    }
    if (isFullScreen()) {
      exitFullScreen();
    }
    return {
      commitToHistory: false
    };
  }
});

export const actionShortcuts = register({
  name: "toggleShortcuts",
  viewMode: true,
  trackEvent: { category: "menu", action: "toggleHelpDialog" },
  perform: (_layers, appState, _, { focusContainer }) => {
    if (appState.openDialog === "help") {
      focusContainer();
    }
    return {
      appState: {
        ...appState,
        openDialog: appState.openDialog === "help" ? null : "help"
      },
      commitToHistory: false
    };
  },
  keyTest: (event) => event.key === KEYS.QUESTION_MARK
});
