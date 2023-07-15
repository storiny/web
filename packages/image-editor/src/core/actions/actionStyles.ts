import { getSelectedLayers } from "../../lib/scene";
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_ALIGN
} from "../constants";
import { t } from "../i18n";
import { CODES, KEYS } from "../keys";
import { isCanvasLayer, isTextLayer, redrawTextBoundingBox } from "../layer";
import { newLayerWith } from "../layer/mutateLayer";
import { getBoundTextLayer, getDefaultLineHeight } from "../layer/textLayer";
import {
  canApplyRoundnessTypeToLayer,
  getDefaultRoundnessTypeForLayer,
  hasBoundTextLayer,
  isFrameLayer
} from "../layer/typeChecks";
import { register } from "./register";

// `copiedStyles` is exported only for tests.
export let copiedStyles: string = "{}";

export const actionCopyStyles = register({
  name: "copyStyles",
  trackEvent: { category: "layer" },
  perform: (layers, appState) => {
    const layersCopied = [];
    const layer = layers.find((el) => appState.selectedLayerIds[el.id]);
    layersCopied.push(layer);
    if (layer && hasBoundTextLayer(layer)) {
      const boundTextLayer = getBoundTextLayer(layer);
      layersCopied.push(boundTextLayer);
    }
    if (layer) {
      copiedStyles = JSON.stringify(layersCopied);
    }
    return {
      appState: {
        ...appState,
        toast: { message: t("toast.copyStyles") }
      },
      commitToHistory: false
    };
  },
  contextItemLabel: "labels.copyStyles",
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.C
});

export const actionPasteStyles = register({
  name: "pasteStyles",
  trackEvent: { category: "layer" },
  perform: (layers, appState) => {
    const layersCopied = JSON.parse(copiedStyles);
    const pastedLayer = layersCopied[0];
    const boundTextLayer = layersCopied[1];
    if (!isCanvasLayer(pastedLayer)) {
      return { layers, commitToHistory: false };
    }

    const selectedLayers = getSelectedLayers(layers, appState, {
      includeBoundTextLayer: true
    });
    const selectedLayerIds = selectedLayers.map((layer) => layer.id);
    return {
      layers: layers.map((layer) => {
        if (selectedLayerIds.includes(layer.id)) {
          let layerStylesToCopyFrom = pastedLayer;
          if (isTextLayer(layer) && layer.containerId) {
            layerStylesToCopyFrom = boundTextLayer;
          }
          if (!layerStylesToCopyFrom) {
            return layer;
          }
          let newLayer = newLayerWith(layer, {
            backgroundColor: layerStylesToCopyFrom?.backgroundColor,
            strokeWidth: layerStylesToCopyFrom?.strokeWidth,
            strokeColor: layerStylesToCopyFrom?.strokeColor,
            strokeStyle: layerStylesToCopyFrom?.strokeStyle,
            fillStyle: layerStylesToCopyFrom?.fillStyle,
            opacity: layerStylesToCopyFrom?.opacity,
            roughness: layerStylesToCopyFrom?.roughness,
            roundness: layerStylesToCopyFrom.roundness
              ? canApplyRoundnessTypeToLayer(
                  layerStylesToCopyFrom.roundness.type,
                  layer
                )
                ? layerStylesToCopyFrom.roundness
                : getDefaultRoundnessTypeForLayer(layer)
              : null
          });

          if (isTextLayer(newLayer)) {
            const fontSize =
              layerStylesToCopyFrom?.fontSize || DEFAULT_FONT_SIZE;
            const fontFamily =
              layerStylesToCopyFrom?.fontFamily || DEFAULT_FONT_FAMILY;
            newLayer = newLayerWith(newLayer, {
              fontSize,
              fontFamily,
              textAlign: layerStylesToCopyFrom?.textAlign || DEFAULT_TEXT_ALIGN,
              lineHeight:
                layerStylesToCopyFrom.lineHeight ||
                getDefaultLineHeight(fontFamily)
            });
            let container = null;
            if (newLayer.containerId) {
              container =
                selectedLayers.find(
                  (layer) =>
                    isTextLayer(newLayer) && layer.id === newLayer.containerId
                ) || null;
            }
            redrawTextBoundingBox(newLayer, container);
          }

          if (newLayer.type === "arrow") {
            newLayer = newLayerWith(newLayer, {
              startArrowhead: layerStylesToCopyFrom.startArrowhead,
              endArrowhead: layerStylesToCopyFrom.endArrowhead
            });
          }

          if (isFrameLayer(layer)) {
            newLayer = newLayerWith(newLayer, {
              roundness: null,
              backgroundColor: "transparent"
            });
          }

          return newLayer;
        }
        return layer;
      }),
      commitToHistory: true
    };
  },
  contextItemLabel: "labels.pasteStyles",
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.V
});
