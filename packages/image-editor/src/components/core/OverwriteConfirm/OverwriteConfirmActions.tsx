import React from "react";

import { actionSaveFileToDisk } from "../../../core/actions";
import { actionChangeExportEmbedScene } from "../../../core/actions/actionExport";
import { useI18n } from "../../i18n";
import { useExcalidrawActionManager, useExcalidrawSetAppState } from "../App";
import { FilledButton } from "../FilledButton";

export type ActionProps = {
  actionLabel: string;
  children: React.ReactNode;
  onClick: () => void;
  title: string;
};

export const Action = ({
  title,
  children,
  actionLabel,
  onClick
}: ActionProps) => (
  <div className="OverwriteConfirm__Actions__Action">
    <h4>{title}</h4>
    <div className="OverwriteConfirm__Actions__Action__content">{children}</div>
    <FilledButton
      color="muted"
      fullWidth
      label={actionLabel}
      onClick={onClick}
      size="large"
      variant="outlined"
    />
  </div>
);

export const ExportToImage = () => {
  const { t } = useI18n();
  const actionManager = useExcalidrawActionManager();
  const setAppState = useExcalidrawSetAppState();

  return (
    <Action
      actionLabel={t("overwriteConfirm.action.exportToImage.button")}
      onClick={() => {
        actionManager.executeAction(actionChangeExportEmbedScene, "ui", true);
        setAppState({ openDialog: "imageExport" });
      }}
      title={t("overwriteConfirm.action.exportToImage.title")}
    >
      {t("overwriteConfirm.action.exportToImage.description")}
    </Action>
  );
};

export const SaveToDisk = () => {
  const { t } = useI18n();
  const actionManager = useExcalidrawActionManager();

  return (
    <Action
      actionLabel={t("overwriteConfirm.action.saveToDisk.button")}
      onClick={() => {
        actionManager.executeAction(actionSaveFileToDisk, "ui");
      }}
      title={t("overwriteConfirm.action.saveToDisk.title")}
    >
      {t("overwriteConfirm.action.saveToDisk.description")}
    </Action>
  );
};

const Actions = Object.assign(
  ({ children }: { children: React.ReactNode }) => (
    <div className="OverwriteConfirm__Actions">{children}</div>
  ),
  {
    ExportToImage,
    SaveToDisk
  }
);

export { Actions };
