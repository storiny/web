import {
  allowFullScreen,
  exitFullScreen,
  isFullScreen
} from "../../lib/utils/utils";
import { HamburgerMenuIcon, palette } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { getNonDeletedLayers, showSelectedShapeActions } from "../layer";
import { register } from "./register";

export const actionToggleCanvasMenu = register({
  name: "toggleCanvasMenu",
  trackEvent: { category: "menu" },
  perform: (_, editorState) => ({
    editorState: {
      ...editorState,
      openMenu: editorState.openMenu === "canvas" ? null : "canvas"
    },
    commitToHistory: false
  }),
  PanelComponent: ({ editorState, updateData }) => (
    <ToolButton
      aria-label={t("buttons.menu")}
      icon={HamburgerMenuIcon}
      onClick={updateData}
      selected={editorState.openMenu === "canvas"}
      type="button"
    />
  )
});

export const actionToggleEditMenu = register({
  name: "toggleEditMenu",
  trackEvent: { category: "menu" },
  perform: (_layers, editorState) => ({
    editorState: {
      ...editorState,
      openMenu: editorState.openMenu === "shape" ? null : "shape"
    },
    commitToHistory: false
  }),
  PanelComponent: ({ layers, editorState, updateData }) => (
    <ToolButton
      aria-label={t("buttons.edit")}
      icon={palette}
      onClick={updateData}
      selected={editorState.openMenu === "shape"}
      type="button"
      visible={showSelectedShapeActions(
        editorState,
        getNonDeletedLayers(layers)
      )}
    />
  )
});

export const actionFullScreen = register({
  name: "toggleFullScreen",
  viewMode: true,
  trackEvent: {
    category: "canvas",
    predicate: (editorState) => !isFullScreen()
  },
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
  perform: (_layers, editorState, _, { focusContainer }) => {
    if (editorState.openDialog === "help") {
      focusContainer();
    }
    return {
      editorState: {
        ...editorState,
        openDialog: editorState.openDialog === "help" ? null : "help"
      },
      commitToHistory: false
    };
  },
  keyTest: (event) => event.key === KEYS.QUESTION_MARK
});
