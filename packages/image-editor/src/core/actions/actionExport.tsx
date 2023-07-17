import "../components/ToolIcon.scss";

import { isImageFileHandle } from "../../lib/data/blob/blob";
import { loadFromJSON, saveAsJSON } from "../../lib/data/export";
import { nativeFileSystemSupported } from "../../lib/data/fs/filesystem";
import { resaveAsImageWithScene } from "../../lib/data/resave/resave";
import { getSelectedLayers, isSomeLayerSelected } from "../../lib/scene";
import { getExportSize } from "../../lib/scene/export/export";
import { useDevice } from "../components/App";
import { CheckboxItem } from "../components/CheckboxItem";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { questionCircle, saveAs } from "../components/icons";
import { ProjectName } from "../components/ProjectName";
import { ToolButton } from "../components/ToolButton";
import { Tooltip } from "../components/Tooltip";
import { DEFAULT_EXPORT_PADDING, EXPORT_SCALES, THEME } from "../constants";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { getNonDeletedLayers } from "../layer";
import { Theme } from "../layer/types";
import { register } from "./register";

export const actionChangeProjectName = register({
  name: "changeProjectName",
  trackEvent: false,
  perform: (_layers, appState, value) => ({
    appState: { ...appState, name: value },
    commitToHistory: false
  }),
  PanelComponent: ({ appState, updateData, appProps, data }) => (
    <ProjectName
      ignoreFocus={data?.ignoreFocus ?? false}
      isNameEditable={
        typeof appProps.name === "undefined" && !appState.viewModeEnabled
      }
      label={t("labels.fileTitle")}
      onChange={(name: string) => updateData(name)}
      value={appState.name || "Unnamed"}
    />
  )
});

export const actionChangeExportScale = register({
  name: "changeExportScale",
  trackEvent: { category: "export", action: "scale" },
  perform: (_layers, appState, value) => ({
    appState: { ...appState, exportScale: value },
    commitToHistory: false
  }),
  PanelComponent: ({ layers: allLayers, appState, updateData }) => {
    const layers = getNonDeletedLayers(allLayers);
    const exportSelected = isSomeLayerSelected(layers, appState);
    const exportedLayers = exportSelected
      ? getSelectedLayers(layers, appState)
      : layers;

    return (
      <>
        {EXPORT_SCALES.map((s) => {
          const [width, height] = getExportSize(
            exportedLayers,
            DEFAULT_EXPORT_PADDING,
            s
          );

          const scaleButtonTitle = `${t(
            "buttons.scale"
          )} ${s}x (${width}x${height})`;

          return (
            <ToolButton
              aria-label={scaleButtonTitle}
              checked={s === appState.exportScale}
              icon={`${s}x`}
              id="export-canvas-scale"
              key={s}
              name="export-canvas-scale"
              onChange={() => updateData(s)}
              size="small"
              title={scaleButtonTitle}
              type="radio"
            />
          );
        })}
      </>
    );
  }
});

export const actionChangeExportBackground = register({
  name: "changeExportBackground",
  trackEvent: { category: "export", action: "toggleBackground" },
  perform: (_layers, appState, value) => ({
    appState: { ...appState, exportBackground: value },
    commitToHistory: false
  }),
  PanelComponent: ({ appState, updateData }) => (
    <CheckboxItem
      checked={appState.exportBackground}
      onChange={(checked) => updateData(checked)}
    >
      {t("labels.withBackground")}
    </CheckboxItem>
  )
});

export const actionChangeExportEmbedScene = register({
  name: "changeExportEmbedScene",
  trackEvent: { category: "export", action: "embedScene" },
  perform: (_layers, appState, value) => ({
    appState: { ...appState, exportEmbedScene: value },
    commitToHistory: false
  }),
  PanelComponent: ({ appState, updateData }) => (
    <CheckboxItem
      checked={appState.exportEmbedScene}
      onChange={(checked) => updateData(checked)}
    >
      {t("labels.exportEmbedScene")}
      <Tooltip label={t("labels.exportEmbedScene_details")} long={true}>
        <div className="excalidraw-tooltip-icon">{questionCircle}</div>
      </Tooltip>
    </CheckboxItem>
  )
});

export const actionSaveToActiveFile = register({
  name: "saveToActiveFile",
  trackEvent: { category: "export" },
  predicate: (layers, appState, props, app) =>
    !!app.props.UIOptions.canvasActions.saveToActiveFile &&
    !!appState.fileHandle &&
    !appState.viewModeEnabled,
  perform: async (layers, appState, value, app) => {
    const fileHandleExists = !!appState.fileHandle;

    try {
      const { fileHandle } = isImageFileHandle(appState.fileHandle)
        ? await resaveAsImageWithScene(layers, appState, app.files)
        : await saveAsJSON(layers, appState, app.files);

      return {
        commitToHistory: false,
        appState: {
          ...appState,
          fileHandle,
          toast: fileHandleExists
            ? {
                message: fileHandle?.name
                  ? t("toast.fileSavedToFilename").replace(
                      "{filename}",
                      `"${fileHandle.name}"`
                    )
                  : t("toast.fileSaved")
              }
            : null
        }
      };
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error(error);
      } else {
        console.warn(error);
      }
      return { commitToHistory: false };
    }
  },
  keyTest: (event) =>
    event.key === KEYS.S && event[KEYS.CTRL_OR_CMD] && !event.shiftKey
});

export const actionSaveFileToDisk = register({
  name: "saveFileToDisk",
  viewMode: true,
  trackEvent: { category: "export" },
  perform: async (layers, appState, value, app) => {
    try {
      const { fileHandle } = await saveAsJSON(
        layers,
        {
          ...appState,
          fileHandle: null
        },
        app.files
      );
      return { commitToHistory: false, appState: { ...appState, fileHandle } };
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error(error);
      } else {
        console.warn(error);
      }
      return { commitToHistory: false };
    }
  },
  keyTest: (event) =>
    event.key === KEYS.S && event.shiftKey && event[KEYS.CTRL_OR_CMD],
  PanelComponent: ({ updateData }) => (
    <ToolButton
      aria-label={t("buttons.saveAs")}
      data-testid="save-as-button"
      hidden={!nativeFileSystemSupported}
      icon={saveAs}
      onClick={() => updateData(null)}
      showAriaLabel={useDevice().isMobile}
      title={t("buttons.saveAs")}
      type="button"
    />
  )
});

export const actionLoadScene = register({
  name: "loadScene",
  trackEvent: { category: "export" },
  predicate: (layers, appState, props, app) =>
    !!app.props.UIOptions.canvasActions.loadScene && !appState.viewModeEnabled,
  perform: async (layers, appState, _, app) => {
    try {
      const {
        layers: loadedLayers,
        appState: loadedAppState,
        files
      } = await loadFromJSON(appState, layers);
      return {
        layers: loadedLayers,
        appState: loadedAppState,
        files,
        commitToHistory: true
      };
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.warn(error);
        return false;
      }
      return {
        layers,
        appState: { ...appState, errorMessage: error.message },
        files: app.files,
        commitToHistory: false
      };
    }
  },
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.O
});

export const actionExportWithDarkMode = register({
  name: "exportWithDarkMode",
  trackEvent: { category: "export", action: "toggleTheme" },
  perform: (_layers, appState, value) => ({
    appState: { ...appState, exportWithDarkMode: value },
    commitToHistory: false
  }),
  PanelComponent: ({ appState, updateData }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "-45px",
        marginBottom: "10px"
      }}
    >
      <DarkModeToggle
        onChange={(theme: Theme) => {
          updateData(theme === THEME.DARK);
        }}
        title={t("labels.toggleExportColorScheme")}
        value={appState.exportWithDarkMode ? THEME.DARK : THEME.LIGHT}
      />
    </div>
  )
});
