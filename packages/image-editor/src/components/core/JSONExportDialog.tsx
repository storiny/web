import "./ExportDialog.scss";

import React from "react";

import { actionSaveFileToDisk } from "../../core/actions/actionExport";
import { ActionManager } from "../../core/actions/manager";
import { BinaryFiles, ExportOpts, UIAppState } from "../../core/types";
import { nativeFileSystemSupported } from "../../lib/data/fs/filesystem";
import { getFrame } from "../../lib/utils/utils";
import { trackEvent } from "../analytics";
import { t } from "../i18n";
import { NonDeletedExcalidrawLayer } from "../layer/types";
import { Card } from "./Card";
import { Dialog } from "./Dialog";
import { exportToFileIcon, LinkIcon } from "./icons";
import { ToolButton } from "./ToolButton";

export type ExportCB = (
  layers: readonly NonDeletedExcalidrawLayer[],
  scale?: number
) => void;

const JSONExportModal = ({
  layers,
  editorState,
  files,
  actionManager,
  exportOpts,
  canvas
}: {
  actionManager: ActionManager;
  canvas: HTMLCanvasLayer | null;
  editorState: UIAppState;
  exportOpts: ExportOpts;
  files: BinaryFiles;
  layers: readonly NonDeletedExcalidrawLayer[];
  onCloseRequest: () => void;
}) => {
  const { onExportToBackend } = exportOpts;
  return (
    <div className="ExportDialog ExportDialog--json">
      <div className="ExportDialog-cards">
        {exportOpts.saveFileToDisk && (
          <Card color="lime">
            <div className="Card-icon">{exportToFileIcon}</div>
            <h2>{t("exportDialog.disk_title")}</h2>
            <div className="Card-details">
              {t("exportDialog.disk_details")}
              {!nativeFileSystemSupported &&
                actionManager.renderAction("changeProjectName")}
            </div>
            <ToolButton
              aria-label={t("exportDialog.disk_button")}
              className="Card-button"
              onClick={() => {
                actionManager.executeAction(actionSaveFileToDisk, "ui");
              }}
              showAriaLabel={true}
              title={t("exportDialog.disk_button")}
              type="button"
            />
          </Card>
        )}
        {onExportToBackend && (
          <Card color="pink">
            <div className="Card-icon">{LinkIcon}</div>
            <h2>{t("exportDialog.link_title")}</h2>
            <div className="Card-details">{t("exportDialog.link_details")}</div>
            <ToolButton
              aria-label={t("exportDialog.link_button")}
              className="Card-button"
              onClick={() => {
                onExportToBackend(layers, editorState, files, canvas);
                trackEvent("export", "link", `ui (${getFrame()})`);
              }}
              showAriaLabel={true}
              title={t("exportDialog.link_button")}
              type="button"
            />
          </Card>
        )}
        {exportOpts.renderCustomUI &&
          exportOpts.renderCustomUI(layers, editorState, files, canvas)}
      </div>
    </div>
  );
};

export const JSONExportDialog = ({
  layers,
  editorState,
  files,
  actionManager,
  exportOpts,
  canvas,
  setAppState
}: {
  actionManager: ActionManager;
  canvas: HTMLCanvasLayer | null;
  editorState: UIAppState;
  exportOpts: ExportOpts;
  files: BinaryFiles;
  layers: readonly NonDeletedExcalidrawLayer[];
  setAppState: React.Component<any, UIAppState>["setState"];
}) => {
  const handleClose = React.useCallback(() => {
    setAppState({ openDialog: null });
  }, [setAppState]);

  return (
    <>
      {editorState.openDialog === "jsonExport" && (
        <Dialog onCloseRequest={handleClose} title={t("buttons.export")}>
          <JSONExportModal
            actionManager={actionManager}
            canvas={canvas}
            editorState={editorState}
            exportOpts={exportOpts}
            files={files}
            layers={layers}
            onCloseRequest={handleClose}
          />
        </Dialog>
      )}
    </>
  );
};
