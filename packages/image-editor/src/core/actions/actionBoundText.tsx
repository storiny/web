import { getSelectedLayers } from "../../lib/scene";
import { getFontString } from "../../lib/utils/utils";
import {
  BOUND_TEXT_PADDING,
  ROUNDNESS,
  TEXT_ALIGN,
  VERTICAL_ALIGN
} from "../constants";
import { getNonDeletedLayers, isTextLayer, newLayer } from "../layer";
import { mutateLayer } from "../layer/mutateLayer";
import {
  computeBoundTextPosition,
  computeContainerDimensionForBoundText,
  getBoundTextLayer,
  measureText,
  redrawTextBoundingBox
} from "../layer/textLayer";
import {
  getOriginalContainerHeightFromCache,
  resetOriginalContainerCache,
  updateOriginalContainerCache
} from "../layer/textWysiwyg";
import {
  hasBoundTextLayer,
  isTextBindableContainer,
  isUsingAdaptiveRadius
} from "../layer/typeChecks";
import {
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextContainer,
  ExcalidrawTextLayer
} from "../layer/types";
import { AppState } from "../types";
import { Mutable } from "../utility-types";
import { register } from "./register";

export const actionUnbindText = register({
  name: "unbindText",
  contextItemLabel: "labels.unbindText",
  trackEvent: { category: "layer" },
  predicate: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(layers, editorState);

    return selectedLayers.some((layer) => hasBoundTextLayer(layer));
  },
  perform: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState
    );
    selectedLayers.forEach((layer) => {
      const boundTextLayer = getBoundTextLayer(layer);
      if (boundTextLayer) {
        const { width, height, baseline } = measureText(
          boundTextLayer.originalText,
          getFontString(boundTextLayer),
          boundTextLayer.lineHeight
        );
        const originalContainerHeight = getOriginalContainerHeightFromCache(
          layer.id
        );
        resetOriginalContainerCache(layer.id);
        const { x, y } = computeBoundTextPosition(layer, boundTextLayer);
        mutateLayer(boundTextLayer as ExcalidrawTextLayer, {
          containerId: null,
          width,
          height,
          baseline,
          text: boundTextLayer.originalText,
          x,
          y
        });
        mutateLayer(layer, {
          boundLayers: layer.boundLayers?.filter(
            (ele) => ele.id !== boundTextLayer.id
          ),
          height: originalContainerHeight
            ? originalContainerHeight
            : layer.height
        });
      }
    });
    return {
      layers,
      editorState,
      commitToHistory: true
    };
  }
});

export const actionBindText = register({
  name: "bindText",
  contextItemLabel: "labels.bindText",
  trackEvent: { category: "layer" },
  predicate: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(layers, editorState);

    if (selectedLayers.length === 2) {
      const textLayer =
        isTextLayer(selectedLayers[0]) || isTextLayer(selectedLayers[1]);

      let bindingContainer;
      if (isTextBindableContainer(selectedLayers[0])) {
        bindingContainer = selectedLayers[0];
      } else if (isTextBindableContainer(selectedLayers[1])) {
        bindingContainer = selectedLayers[1];
      }
      if (
        textLayer &&
        bindingContainer &&
        getBoundTextLayer(bindingContainer) === null
      ) {
        return true;
      }
    }
    return false;
  },
  perform: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState
    );

    let textLayer: ExcalidrawTextLayer;
    let container: ExcalidrawTextContainer;

    if (
      isTextLayer(selectedLayers[0]) &&
      isTextBindableContainer(selectedLayers[1])
    ) {
      textLayer = selectedLayers[0];
      container = selectedLayers[1];
    } else {
      textLayer = selectedLayers[1] as ExcalidrawTextLayer;
      container = selectedLayers[0] as ExcalidrawTextContainer;
    }
    mutateLayer(textLayer, {
      containerId: container.id,
      verticalAlign: VERTICAL_ALIGN.MIDDLE,
      textAlign: TEXT_ALIGN.CENTER
    });
    mutateLayer(container, {
      boundLayers: (container.boundLayers || []).concat({
        type: "text",
        id: textLayer.id
      })
    });
    const originalContainerHeight = container.height;
    redrawTextBoundingBox(textLayer, container);
    // overwritting the cache with original container height so
    // it can be restored when unbind
    updateOriginalContainerCache(container.id, originalContainerHeight);

    return {
      layers: pushTextAboveContainer(layers, container, textLayer),
      editorState: {
        ...editorState,
        selectedLayerIds: { [container.id]: true }
      },
      commitToHistory: true
    };
  }
});

const pushTextAboveContainer = (
  layers: readonly ExcalidrawLayer[],
  container: ExcalidrawLayer,
  textLayer: ExcalidrawTextLayer
) => {
  const updatedLayers = layers.slice();
  const textLayerIndex = updatedLayers.findIndex(
    (ele) => ele.id === textLayer.id
  );
  updatedLayers.splice(textLayerIndex, 1);

  const containerIndex = updatedLayers.findIndex(
    (ele) => ele.id === container.id
  );
  updatedLayers.splice(containerIndex + 1, 0, textLayer);
  return updatedLayers;
};

const pushContainerBelowText = (
  layers: readonly ExcalidrawLayer[],
  container: ExcalidrawLayer,
  textLayer: ExcalidrawTextLayer
) => {
  const updatedLayers = layers.slice();
  const containerIndex = updatedLayers.findIndex(
    (ele) => ele.id === container.id
  );
  updatedLayers.splice(containerIndex, 1);

  const textLayerIndex = updatedLayers.findIndex(
    (ele) => ele.id === textLayer.id
  );
  updatedLayers.splice(textLayerIndex, 0, container);
  return updatedLayers;
};

export const actionWrapTextInContainer = register({
  name: "wrapTextInContainer",
  contextItemLabel: "labels.createContainerFromText",
  trackEvent: { category: "layer" },
  predicate: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(layers, editorState);
    const areTextLayers = selectedLayers.every((el) => isTextLayer(el));
    return selectedLayers.length > 0 && areTextLayers;
  },
  perform: (layers, editorState) => {
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState
    );
    let updatedLayers: readonly ExcalidrawLayer[] = layers.slice();
    const containerIds: Mutable<AppState["selectedLayerIds"]> = {};

    for (const textLayer of selectedLayers) {
      if (isTextLayer(textLayer)) {
        const container = newLayer({
          type: "rectangle",
          backgroundColor: editorState.currentItemBackgroundColor,
          boundLayers: [
            ...(textLayer.boundLayers || []),
            { id: textLayer.id, type: "text" }
          ],
          angle: textLayer.angle,
          fillStyle: editorState.currentItemFillStyle,
          strokeColor: editorState.currentItemStrokeColor,
          roughness: editorState.currentItemRoughness,
          strokeWidth: editorState.currentItemStrokeWidth,
          strokeStyle: editorState.currentItemStrokeStyle,
          roundness:
            editorState.currentItemRoundness === "round"
              ? {
                  type: isUsingAdaptiveRadius("rectangle")
                    ? ROUNDNESS.ADAPTIVE_RADIUS
                    : ROUNDNESS.PROPORTIONAL_RADIUS
                }
              : null,
          opacity: 100,
          locked: false,
          x: textLayer.x - BOUND_TEXT_PADDING,
          y: textLayer.y - BOUND_TEXT_PADDING,
          width: computeContainerDimensionForBoundText(
            textLayer.width,
            "rectangle"
          ),
          height: computeContainerDimensionForBoundText(
            textLayer.height,
            "rectangle"
          ),
          groupIds: textLayer.groupIds,
          frameId: textLayer.frameId
        });

        // update bindings
        if (textLayer.boundLayers?.length) {
          const linearLayerIds = textLayer.boundLayers
            .filter((ele) => ele.type === "arrow")
            .map((el) => el.id);
          const linearLayers = updatedLayers.filter((ele) =>
            linearLayerIds.includes(ele.id)
          ) as ExcalidrawLinearLayer[];
          linearLayers.forEach((ele) => {
            let startBinding = ele.startBinding;
            let endBinding = ele.endBinding;

            if (startBinding?.layerId === textLayer.id) {
              startBinding = {
                ...startBinding,
                layerId: container.id
              };
            }

            if (endBinding?.layerId === textLayer.id) {
              endBinding = { ...endBinding, layerId: container.id };
            }

            if (startBinding || endBinding) {
              mutateLayer(ele, { startBinding, endBinding }, false);
            }
          });
        }

        mutateLayer(
          textLayer,
          {
            containerId: container.id,
            verticalAlign: VERTICAL_ALIGN.MIDDLE,
            boundLayers: null,
            textAlign: TEXT_ALIGN.CENTER
          },
          false
        );
        redrawTextBoundingBox(textLayer, container);

        updatedLayers = pushContainerBelowText(
          [...updatedLayers, container],
          container,
          textLayer
        );
        containerIds[container.id] = true;
      }
    }

    return {
      layers: updatedLayers,
      editorState: {
        ...editorState,
        selectedLayerIds: containerIds
      },
      commitToHistory: true
    };
  }
});
