import {
  copyTextToSystemClipboard,
  copyToClipboard,
  probablySupportsClipboardBlob,
  probablySupportsClipboardWriteText
} from "../../lib/clipboard/clipboard";
import { exportCanvas } from "../../lib/data/export";
import { getSelectedLayers } from "../../lib/scene/selection/selection";
import { t } from "../i18n";
import { CODES, KEYS } from "../keys";
import { getNonDeletedLayers, isTextLayer } from "../layer";
import { actionDeleteSelected } from "./actionDeleteSelected";
import { register } from "./register";

export const actionCopy = register({
  name: "copy",
  trackEvent: { category: "layer" },
  perform: (layers, editorState, _, app) => {
    const layersToCopy = getSelectedLayers(layers, editorState, {
      includeBoundTextLayer: true,
      includeLayersInFrames: true
    });

    copyToClipboard(layersToCopy, app.files);

    return {
      commitToHistory: false
    };
  },
  predicate: (layers, editorState, appProps, app) =>
    app.device.isMobile && !!navigator.clipboard,
  contextItemLabel: "labels.copy",
  // don't supply a shortcut since we handle this conditionally via onCopy event
  keyTest: undefined
});

export const actionPaste = register({
  name: "paste",
  trackEvent: { category: "layer" },
  perform: (layers: any, editorStates: any, data, app) => {
    app.pasteFromClipboard(null);
    return {
      commitToHistory: false
    };
  },
  predicate: (layers, editorState, appProps, app) =>
    app.device.isMobile && !!navigator.clipboard,
  contextItemLabel: "labels.paste",
  // don't supply a shortcut since we handle this conditionally via onCopy event
  keyTest: undefined
});

export const actionCut = register({
  name: "cut",
  trackEvent: { category: "layer" },
  perform: (layers, editorState, data, app) => {
    actionCopy.perform(layers, editorState, data, app);
    return actionDeleteSelected.perform(layers, editorState);
  },
  predicate: (layers, editorState, appProps, app) =>
    app.device.isMobile && !!navigator.clipboard,
  contextItemLabel: "labels.cut",
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.X
});

export const actionCopyAsSvg = register({
  name: "copyAsSvg",
  trackEvent: { category: "layer" },
  perform: async (layers, editorState, _data, app) => {
    if (!app.canvas) {
      return {
        commitToHistory: false
      };
    }
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState,
      {
        includeBoundTextLayer: true,
        includeLayersInFrames: true
      }
    );
    try {
      await exportCanvas(
        "clipboard-svg",
        selectedLayers.length ? selectedLayers : getNonDeletedLayers(layers),
        editorState,
        app.files,
        editorState
      );
      return {
        commitToHistory: false
      };
    } catch (error: any) {
      console.error(error);
      return {
        editorState: {
          ...editorState,
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
  perform: async (layers, editorState, _data, app) => {
    if (!app.canvas) {
      return {
        commitToHistory: false
      };
    }
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState,
      {
        includeBoundTextLayer: true,
        includeLayersInFrames: true
      }
    );
    try {
      await exportCanvas(
        "clipboard",
        selectedLayers.length ? selectedLayers : getNonDeletedLayers(layers),
        editorState,
        app.files,
        editorState
      );
      return {
        editorState: {
          ...editorState,
          toast: {
            message: t("toast.copyToClipboardAsPng", {
              exportSelection: selectedLayers.length
                ? t("toast.selection")
                : t("toast.canvas"),
              exportColorScheme: editorState.exportWithDarkMode
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
        editorState: {
          ...editorState,
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
  perform: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState,
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
  predicate: (layers, editorState) =>
    probablySupportsClipboardWriteText &&
    getSelectedLayers(layers, editorState, {
      includeBoundTextLayer: true
    }).some(isTextLayer),
  contextItemLabel: "labels.copyText"
});
