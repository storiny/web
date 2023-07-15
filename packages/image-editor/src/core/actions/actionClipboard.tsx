import { exportCanvas } from "../../lib/data/export";
import { getSelectedLayers } from "../../lib/scene/selection";
import {
  copyTextToSystemClipboard,
  copyToClipboard,
  probablySupportsClipboardBlob,
  probablySupportsClipboardWriteText
} from "../clipboard";
import { t } from "../i18n";
import { CODES, KEYS } from "../keys";
import { getNonDeletedLayers, isTextLayer } from "../layer";
import { actionDeleteSelected } from "./actionDeleteSelected";
import { register } from "./register";

export const actionCopy = register({
  name: "copy",
  trackEvent: { category: "layer" },
  perform: (layers, appState, _, app) => {
    const layersToCopy = getSelectedLayers(layers, appState, {
      includeBoundTextLayer: true,
      includeLayersInFrames: true
    });

    copyToClipboard(layersToCopy, app.files);

    return {
      commitToHistory: false
    };
  },
  predicate: (layers, appState, appProps, app) =>
    app.device.isMobile && !!navigator.clipboard,
  contextItemLabel: "labels.copy",
  // don't supply a shortcut since we handle this conditionally via onCopy event
  keyTest: undefined
});

export const actionPaste = register({
  name: "paste",
  trackEvent: { category: "layer" },
  perform: (layers: any, appStates: any, data, app) => {
    app.pasteFromClipboard(null);
    return {
      commitToHistory: false
    };
  },
  predicate: (layers, appState, appProps, app) =>
    app.device.isMobile && !!navigator.clipboard,
  contextItemLabel: "labels.paste",
  // don't supply a shortcut since we handle this conditionally via onCopy event
  keyTest: undefined
});

export const actionCut = register({
  name: "cut",
  trackEvent: { category: "layer" },
  perform: (layers, appState, data, app) => {
    actionCopy.perform(layers, appState, data, app);
    return actionDeleteSelected.perform(layers, appState);
  },
  predicate: (layers, appState, appProps, app) =>
    app.device.isMobile && !!navigator.clipboard,
  contextItemLabel: "labels.cut",
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.X
});

export const actionCopyAsSvg = register({
  name: "copyAsSvg",
  trackEvent: { category: "layer" },
  perform: async (layers, appState, _data, app) => {
    if (!app.canvas) {
      return {
        commitToHistory: false
      };
    }
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      appState,
      {
        includeBoundTextLayer: true,
        includeLayersInFrames: true
      }
    );
    try {
      await exportCanvas(
        "clipboard-svg",
        selectedLayers.length ? selectedLayers : getNonDeletedLayers(layers),
        appState,
        app.files,
        appState
      );
      return {
        commitToHistory: false
      };
    } catch (error: any) {
      console.error(error);
      return {
        appState: {
          ...appState,
          errorMessage: error.message
        },
        commitToHistory: false
      };
    }
  },
  predicate: (layers) =>
    probablySupportsClipboardWriteText && layers.length > 0,
  contextItemLabel: "labels.copyAsSvg"
});

export const actionCopyAsPng = register({
  name: "copyAsPng",
  trackEvent: { category: "layer" },
  perform: async (layers, appState, _data, app) => {
    if (!app.canvas) {
      return {
        commitToHistory: false
      };
    }
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      appState,
      {
        includeBoundTextLayer: true,
        includeLayersInFrames: true
      }
    );
    try {
      await exportCanvas(
        "clipboard",
        selectedLayers.length ? selectedLayers : getNonDeletedLayers(layers),
        appState,
        app.files,
        appState
      );
      return {
        appState: {
          ...appState,
          toast: {
            message: t("toast.copyToClipboardAsPng", {
              exportSelection: selectedLayers.length
                ? t("toast.selection")
                : t("toast.canvas"),
              exportColorScheme: appState.exportWithDarkMode
                ? t("buttons.darkMode")
                : t("buttons.lightMode")
            })
          }
        },
        commitToHistory: false
      };
    } catch (error: any) {
      console.error(error);
      return {
        appState: {
          ...appState,
          errorMessage: error.message
        },
        commitToHistory: false
      };
    }
  },
  predicate: (layers) => probablySupportsClipboardBlob && layers.length > 0,
  contextItemLabel: "labels.copyAsPng",
  keyTest: (event) => event.code === CODES.C && event.altKey && event.shiftKey
});

export const copyText = register({
  name: "copyText",
  trackEvent: { category: "layer" },
  perform: (layers, appState) => {
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      appState,
      {
        includeBoundTextLayer: true
      }
    );

    const text = selectedLayers
      .reduce((acc: string[], layer) => {
        if (isTextLayer(layer)) {
          acc.push(layer.text);
        }
        return acc;
      }, [])
      .join("\n\n");
    copyTextToSystemClipboard(text);
    return {
      commitToHistory: false
    };
  },
  predicate: (layers, appState) =>
    probablySupportsClipboardWriteText &&
    getSelectedLayers(layers, appState, {
      includeBoundTextLayer: true
    }).some(isTextLayer),
  contextItemLabel: "labels.copyText"
});
