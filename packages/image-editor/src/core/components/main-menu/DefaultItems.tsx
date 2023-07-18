import "./DefaultItems.scss";

import clsx from "clsx";
import { useSetAtom } from "jotai";

import {
  actionClearCanvas,
  actionLoadScene,
  actionSaveToActiveFile,
  actionShortcuts,
  actionToggleTheme
} from "../../actions";
import { getShortcutFromShortcutName } from "../../actions/shortcuts";
import { useUIAppState } from "../../context/ui-editorState";
import { useI18n } from "../../i18n";
import { jotaiScope } from "../../jotai";
import { activeConfirmDialogAtom } from "../ActiveConfirmDialog";
import {
  useExcalidrawActionManager,
  useExcalidrawLayers,
  useExcalidrawSetAppState
} from "../App";
import DropdownMenuItem from "../dropdownMenu/DropdownMenuItem";
import DropdownMenuItemLink from "../dropdownMenu/DropdownMenuItemLink";
import {
  ExportIcon,
  ExportImageIcon,
  HelpIcon,
  LoadIcon,
  MoonIcon,
  save,
  SunIcon,
  TrashIcon,
  usersIcon
} from "../icons";
import { DiscordIcon, GithubIcon, TwitterIcon } from "../icons";
import { openConfirmModal } from "../OverwriteConfirm/OverwriteConfirmState";
import Trans from "../Trans";

export const LoadScene = () => {
  const { t } = useI18n();
  const actionManager = useExcalidrawActionManager();
  const layers = useExcalidrawLayers();

  if (!actionManager.isActionEnabled(actionLoadScene)) {
    return null;
  }

  const handleSelect = async () => {
    if (
      !layers.length ||
      (await openConfirmModal({
        title: t("overwriteConfirm.modal.loadFromFile.title"),
        actionLabel: t("overwriteConfirm.modal.loadFromFile.button"),
        color: "warning",
        description: (
          <Trans
            bold={(text) => <strong>{text}</strong>}
            br={() => <br />}
            i18nKey="overwriteConfirm.modal.loadFromFile.description"
          />
        )
      }))
    ) {
      actionManager.executeAction(actionLoadScene);
    }
  };

  return (
    <DropdownMenuItem
      aria-label={t("buttons.load")}
      data-testid="load-button"
      icon={LoadIcon}
      onSelect={handleSelect}
      shortcut={getShortcutFromShortcutName("loadScene")}
    >
      {t("buttons.load")}
    </DropdownMenuItem>
  );
};
LoadScene.displayName = "LoadScene";

export const SaveToActiveFile = () => {
  const { t } = useI18n();
  const actionManager = useExcalidrawActionManager();

  if (!actionManager.isActionEnabled(actionSaveToActiveFile)) {
    return null;
  }

  return (
    <DropdownMenuItem
      aria-label={`${t("buttons.save")}`}
      data-testid="save-button"
      icon={save}
      onSelect={() => actionManager.executeAction(actionSaveToActiveFile)}
      shortcut={getShortcutFromShortcutName("saveScene")}
    >{`${t("buttons.save")}`}</DropdownMenuItem>
  );
};
SaveToActiveFile.displayName = "SaveToActiveFile";

export const SaveAsImage = () => {
  const setAppState = useExcalidrawSetAppState();
  const { t } = useI18n();
  return (
    <DropdownMenuItem
      aria-label={t("buttons.exportImage")}
      data-testid="image-export-button"
      icon={ExportImageIcon}
      onSelect={() => setAppState({ openDialog: "imageExport" })}
      shortcut={getShortcutFromShortcutName("imageExport")}
    >
      {t("buttons.exportImage")}
    </DropdownMenuItem>
  );
};
SaveAsImage.displayName = "SaveAsImage";

export const Help = () => {
  const { t } = useI18n();

  const actionManager = useExcalidrawActionManager();

  return (
    <DropdownMenuItem
      aria-label={t("helpDialog.title")}
      data-testid="help-menu-item"
      icon={HelpIcon}
      onSelect={() => actionManager.executeAction(actionShortcuts)}
      shortcut="?"
    >
      {t("helpDialog.title")}
    </DropdownMenuItem>
  );
};
Help.displayName = "Help";

export const ClearCanvas = () => {
  const { t } = useI18n();

  const setActiveConfirmDialog = useSetAtom(
    activeConfirmDialogAtom,
    jotaiScope
  );
  const actionManager = useExcalidrawActionManager();

  if (!actionManager.isActionEnabled(actionClearCanvas)) {
    return null;
  }

  return (
    <DropdownMenuItem
      aria-label={t("buttons.clearReset")}
      data-testid="clear-canvas-button"
      icon={TrashIcon}
      onSelect={() => setActiveConfirmDialog("clearCanvas")}
    >
      {t("buttons.clearReset")}
    </DropdownMenuItem>
  );
};
ClearCanvas.displayName = "ClearCanvas";

export const ToggleTheme = () => {
  const { t } = useI18n();
  const editorState = useUIAppState();
  const actionManager = useExcalidrawActionManager();

  if (!actionManager.isActionEnabled(actionToggleTheme)) {
    return null;
  }

  return (
    <DropdownMenuItem
      aria-label={
        editorState.theme === "dark"
          ? t("buttons.lightMode")
          : t("buttons.darkMode")
      }
      data-testid="toggle-dark-mode"
      icon={editorState.theme === "dark" ? SunIcon : MoonIcon}
      onSelect={(event) => {
        // do not close the menu when changing theme
        event.preventDefault();
        return actionManager.executeAction(actionToggleTheme);
      }}
      shortcut={getShortcutFromShortcutName("toggleTheme")}
    >
      {editorState.theme === "dark"
        ? t("buttons.lightMode")
        : t("buttons.darkMode")}
    </DropdownMenuItem>
  );
};
ToggleTheme.displayName = "ToggleTheme";

export const ChangeCanvasBackground = () => {
  const { t } = useI18n();
  const editorState = useUIAppState();
  const actionManager = useExcalidrawActionManager();

  if (editorState.viewModeEnabled) {
    return null;
  }
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ fontSize: ".75rem", marginBottom: ".5rem" }}>
        {t("labels.canvasBackground")}
      </div>
      <div style={{ padding: "0 0.625rem" }}>
        {actionManager.renderAction("changeViewBackgroundColor")}
      </div>
    </div>
  );
};
ChangeCanvasBackground.displayName = "ChangeCanvasBackground";

export const Export = () => {
  const { t } = useI18n();
  const setAppState = useExcalidrawSetAppState();
  return (
    <DropdownMenuItem
      aria-label={t("buttons.export")}
      data-testid="json-export-button"
      icon={ExportIcon}
      onSelect={() => {
        setAppState({ openDialog: "jsonExport" });
      }}
    >
      {t("buttons.export")}
    </DropdownMenuItem>
  );
};
Export.displayName = "Export";

export const Socials = () => (
  <>
    <DropdownMenuItemLink
      aria-label="GitHub"
      href="https://github.com/excalidraw/excalidraw"
      icon={GithubIcon}
    >
      GitHub
    </DropdownMenuItemLink>
    <DropdownMenuItemLink
      aria-label="Discord"
      href="https://discord.gg/UexuTaE"
      icon={DiscordIcon}
    >
      Discord
    </DropdownMenuItemLink>
    <DropdownMenuItemLink
      aria-label="Twitter"
      href="https://twitter.com/excalidraw"
      icon={TwitterIcon}
    >
      Twitter
    </DropdownMenuItemLink>
  </>
);
Socials.displayName = "Socials";

export const LiveCollaborationTrigger = ({
  onSelect,
  isCollaborating
}: {
  isCollaborating: boolean;
  onSelect: () => void;
}) => {
  const { t } = useI18n();
  return (
    <DropdownMenuItem
      className={clsx({
        "active-collab": isCollaborating
      })}
      data-testid="collab-button"
      icon={usersIcon}
      onSelect={onSelect}
    >
      {t("labels.liveCollaboration")}
    </DropdownMenuItem>
  );
};

LiveCollaborationTrigger.displayName = "LiveCollaborationTrigger";
