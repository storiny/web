import "./ImageExportDialog.scss";

import React, { useEffect, useRef, useState } from "react";

import {
  actionChangeExportBackground,
  actionChangeExportEmbedScene,
  actionChangeExportScale,
  actionChangeProjectName,
  actionExportWithDarkMode
} from "../../core/actions/actionExport";
import type { ActionManager } from "../../core/actions/manager";
import {
  DEFAULT_EXPORT_PADDING,
  EXPORT_IMAGE_TYPES,
  EXPORT_SCALES,
  isFirefox
} from "../../core/constants";
import type {
  AppClassProperties,
  BinaryFiles,
  UIAppState
} from "../../core/types";
import { probablySupportsClipboardBlob } from "../../lib/clipboard/clipboard";
import { canvasToBlob } from "../../lib/data/blob/blob";
import { nativeFileSystemSupported } from "../../lib/data/fs/filesystem";
import { exportToCanvas } from "../../lib/packages/utils";
import { getSelectedLayers, isSomeLayerSelected } from "../../lib/scene";
import { t } from "../i18n";
import { NonDeletedExcalidrawLayer } from "../layer/types";
import { useAppProps } from "./App";
import { Dialog } from "./Dialog";
import { FilledButton } from "./FilledButton";
import { copyIcon, downloadIcon, helpIcon } from "./icons";
import { RadioGroup } from "./RadioGroup";
import { Switch } from "./Switch";
import { Tooltip } from "./Tooltip";

const supportsContextFilters =
  "filter" in document.createLayer("canvas").getContext("2d")!;

export const ErrorCanvasPreview = () => (
  <div>
    <h3>{t("canvasError.cannotShowPreview")}</h3>
    <p>
      <span>{t("canvasError.canvasTooBig")}</span>
    </p>
    <em>({t("canvasError.canvasTooBigTip")})</em>
  </div>
);

type ImageExportModalProps = {
  actionManager: ActionManager;
  editorState: UIAppState;
  files: BinaryFiles;
  layers: readonly NonDeletedExcalidrawLayer[];
  onExportImage: AppClassProperties["onExportImage"];
};

const ImageExportModal = ({
  editorState,
  layers,
  files,
  actionManager,
  onExportImage
}: ImageExportModalProps) => {
  const appProps = useAppProps();
  const [projectName, setProjectName] = useState(editorState.name);

  const someLayerIsSelected = isSomeLayerSelected(layers, editorState);

  const [exportSelected, setExportSelected] = useState(someLayerIsSelected);
  const [exportWithBackground, setExportWithBackground] = useState(
    editorState.exportBackground
  );
  const [exportDarkMode, setExportDarkMode] = useState(
    editorState.exportWithDarkMode
  );
  const [embedScene, setEmbedScene] = useState(editorState.exportEmbedScene);
  const [exportScale, setExportScale] = useState(editorState.exportScale);

  const previewRef = useRef<HTMLDivLayer>(null);
  const [renderError, setRenderError] = useState<Error | null>(null);

  const exportedLayers = exportSelected
    ? getSelectedLayers(layers, editorState, {
        includeBoundTextLayer: true,
        includeLayersInFrames: true
      })
    : layers;

  useEffect(() => {
    const previewNode = previewRef.current;
    if (!previewNode) {
      return;
    }
    const maxWidth = previewNode.offsetWidth;
    const maxHeight = previewNode.offsetHeight;
    if (!maxWidth) {
      return;
    }
    exportToCanvas({
      layers: exportedLayers,
      editorState,
      files,
      exportPadding: DEFAULT_EXPORT_PADDING,
      maxWidthOrHeight: Math.max(maxWidth, maxHeight)
    })
      .then((canvas) => {
        setRenderError(null);
        // if converting to blob fails, there's some problem that will
        // likely prevent preview and export (e.g. canvas too big)
        return canvasToBlob(canvas).then(() => {
          previewNode.replaceChildren(canvas);
        });
      })
      .catch((error) => {
        console.error(error);
        setRenderError(error);
      });
  }, [editorState, files, exportedLayers]);

  return (
    <div className="ImageExportModal">
      <h3>{t("imageExportDialog.header")}</h3>
      <div className="ImageExportModal__preview">
        <div className="ImageExportModal__preview__canvas" ref={previewRef}>
          {renderError && <ErrorCanvasPreview />}
        </div>
        <div className="ImageExportModal__preview__filename">
          {!nativeFileSystemSupported && (
            <input
              className="TextInput"
              disabled={
                typeof appProps.name !== "undefined" ||
                editorState.viewModeEnabled
              }
              onChange={(event) => {
                setProjectName(event.target.value);
                actionManager.executeAction(
                  actionChangeProjectName,
                  "ui",
                  event.target.value
                );
              }}
              style={{ width: "30ch" }}
              type="text"
              value={projectName}
            />
          )}
        </div>
      </div>
      <div className="ImageExportModal__settings">
        <h3>{t("imageExportDialog.header")}</h3>
        {someLayerIsSelected && (
          <ExportSetting
            label={t("imageExportDialog.label.onlySelected")}
            name="exportOnlySelected"
          >
            <Switch
              checked={exportSelected}
              name="exportOnlySelected"
              onChange={(checked) => {
                setExportSelected(checked);
              }}
            />
          </ExportSetting>
        )}
        <ExportSetting
          label={t("imageExportDialog.label.withBackground")}
          name="exportBackgroundSwitch"
        >
          <Switch
            checked={exportWithBackground}
            name="exportBackgroundSwitch"
            onChange={(checked) => {
              setExportWithBackground(checked);
              actionManager.executeAction(
                actionChangeExportBackground,
                "ui",
                checked
              );
            }}
          />
        </ExportSetting>
        {supportsContextFilters && (
          <ExportSetting
            label={t("imageExportDialog.label.darkMode")}
            name="exportDarkModeSwitch"
          >
            <Switch
              checked={exportDarkMode}
              name="exportDarkModeSwitch"
              onChange={(checked) => {
                setExportDarkMode(checked);
                actionManager.executeAction(
                  actionExportWithDarkMode,
                  "ui",
                  checked
                );
              }}
            />
          </ExportSetting>
        )}
        <ExportSetting
          label={t("imageExportDialog.label.embedScene")}
          name="exportEmbedSwitch"
          tooltip={t("imageExportDialog.tooltip.embedScene")}
        >
          <Switch
            checked={embedScene}
            name="exportEmbedSwitch"
            onChange={(checked) => {
              setEmbedScene(checked);
              actionManager.executeAction(
                actionChangeExportEmbedScene,
                "ui",
                checked
              );
            }}
          />
        </ExportSetting>
        <ExportSetting
          label={t("imageExportDialog.label.scale")}
          name="exportScale"
        >
          <RadioGroup
            choices={EXPORT_SCALES.map((scale) => ({
              value: scale,
              label: `${scale}\u00d7`
            }))}
            name="exportScale"
            onChange={(scale) => {
              setExportScale(scale);
              actionManager.executeAction(actionChangeExportScale, "ui", scale);
            }}
            value={exportScale}
          />
        </ExportSetting>

        <div className="ImageExportModal__settings__buttons">
          <FilledButton
            className="ImageExportModal__settings__buttons__button"
            label={t("imageExportDialog.title.exportToPng")}
            onClick={() =>
              onExportImage(EXPORT_IMAGE_TYPES.png, exportedLayers)
            }
            startIcon={downloadIcon}
          >
            {t("imageExportDialog.button.exportToPng")}
          </FilledButton>
          <FilledButton
            className="ImageExportModal__settings__buttons__button"
            label={t("imageExportDialog.title.exportToSvg")}
            onClick={() =>
              onExportImage(EXPORT_IMAGE_TYPES.svg, exportedLayers)
            }
            startIcon={downloadIcon}
          >
            {t("imageExportDialog.button.exportToSvg")}
          </FilledButton>
          {(probablySupportsClipboardBlob || isFirefox) && (
            <FilledButton
              className="ImageExportModal__settings__buttons__button"
              label={t("imageExportDialog.title.copyPngToClipboard")}
              onClick={() =>
                onExportImage(EXPORT_IMAGE_TYPES.clipboard, exportedLayers)
              }
              startIcon={copyIcon}
            >
              {t("imageExportDialog.button.copyPngToClipboard")}
            </FilledButton>
          )}
        </div>
      </div>
    </div>
  );
};

type ExportSettingProps = {
  children: React.ReactNode;
  label: string;
  name?: string;
  tooltip?: string;
};

const ExportSetting = ({
  label,
  children,
  tooltip,
  name
}: ExportSettingProps) => (
  <div className="ImageExportModal__settings__setting" title={label}>
    <label
      className="ImageExportModal__settings__setting__label"
      htmlFor={name}
    >
      {label}
      {tooltip && (
        <Tooltip label={tooltip} long={true}>
          {helpIcon}
        </Tooltip>
      )}
    </label>
    <div className="ImageExportModal__settings__setting__content">
      {children}
    </div>
  </div>
);

export const ImageExportDialog = ({
  layers,
  editorState,
  files,
  actionManager,
  onExportImage,
  onCloseRequest
}: {
  actionManager: ActionManager;
  editorState: UIAppState;
  files: BinaryFiles;
  layers: readonly NonDeletedExcalidrawLayer[];
  onCloseRequest: () => void;
  onExportImage: AppClassProperties["onExportImage"];
}) => {
  if (editorState.openDialog !== "imageExport") {
    return null;
  }

  return (
    <Dialog onCloseRequest={onCloseRequest} size="wide" title={false}>
      <ImageExportModal
        actionManager={actionManager}
        editorState={editorState}
        files={files}
        layers={layers}
        onExportImage={onExportImage}
      />
    </Dialog>
  );
};
