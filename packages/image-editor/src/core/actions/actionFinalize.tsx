import { done } from "../../components/core/icons";
import { ToolButton } from "../../components/core/ToolButton";
import { isPathALoop } from "../../lib/math/math";
import Scene from "../../lib/scene/scene/Scene";
import { resetCursor, updateActiveTool } from "../../lib/utils/utils";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { isInvisiblySmallLayer } from "../layer";
import {
  bindOrUnbindLinearLayer,
  maybeBindLinearLayer
} from "../layer/binding";
import { LinearLayerEditor } from "../layer/linearLayerEditor";
import { mutateLayer } from "../layer/mutateLayer";
import { isBindingLayer, isLinearLayer } from "../layer/typeChecks";
import { AppState } from "../types";
import { register } from "./register";

export const actionFinalize = register({
  name: "finalize",
  trackEvent: false,
  perform: (layers, editorState, _, { canvas, focusContainer, scene }) => {
    if (editorState.editingLinearLayer) {
      const { layerId, startBindingLayer, endBindingLayer } =
        editorState.editingLinearLayer;
      const layer = LinearLayerEditor.getLayer(layerId);

      if (layer) {
        if (isBindingLayer(layer)) {
          bindOrUnbindLinearLayer(layer, startBindingLayer, endBindingLayer);
        }
        return {
          layers:
            layer.points.length < 2 || isInvisiblySmallLayer(layer)
              ? layers.filter((el) => el.id !== layer.id)
              : undefined,
          editorState: {
            ...editorState,
            cursorButton: "up",
            editingLinearLayer: null
          },
          commitToHistory: true
        };
      }
    }

    let newLayers = layers;

    const pendingImageLayer =
      editorState.pendingImageLayerId &&
      scene.getLayer(editorState.pendingImageLayerId);

    if (pendingImageLayer) {
      mutateLayer(pendingImageLayer, { isDeleted: true }, false);
    }

    if (window.document.activeLayer instanceof HTMLLayer) {
      focusContainer();
    }

    const multiPointLayer = editorState.multiLayer
      ? editorState.multiLayer
      : editorState.editingLayer?.type === "freedraw"
      ? editorState.editingLayer
      : null;

    if (multiPointLayer) {
      // pen and mouse have hover
      if (
        multiPointLayer.type !== "freedraw" &&
        editorState.lastPointerDownWith !== "touch"
      ) {
        const { points, lastCommittedPoint } = multiPointLayer;
        if (
          !lastCommittedPoint ||
          points[points.length - 1] !== lastCommittedPoint
        ) {
          mutateLayer(multiPointLayer, {
            points: multiPointLayer.points.slice(0, -1)
          });
        }
      }
      if (isInvisiblySmallLayer(multiPointLayer)) {
        newLayers = newLayers.slice(0, -1);
      }

      // If the multi point line closes the loop,
      // set the last point to first point.
      // This ensures that loop remains closed at different scales.
      const isLoop = isPathALoop(
        multiPointLayer.points,
        editorState.zoom.value
      );
      if (
        multiPointLayer.type === "line" ||
        multiPointLayer.type === "freedraw"
      ) {
        if (isLoop) {
          const linePoints = multiPointLayer.points;
          const firstPoint = linePoints[0];
          mutateLayer(multiPointLayer, {
            points: linePoints.map((point, index) =>
              index === linePoints.length - 1
                ? ([firstPoint[0], firstPoint[1]] as const)
                : point
            )
          });
        }
      }

      if (
        isBindingLayer(multiPointLayer) &&
        !isLoop &&
        multiPointLayer.points.length > 1
      ) {
        const [x, y] = LinearLayerEditor.getPointAtIndexGlobalCoordinates(
          multiPointLayer,
          -1
        );
        maybeBindLinearLayer(
          multiPointLayer,
          editorState,
          Scene.getScene(multiPointLayer)!,
          { x, y }
        );
      }
    }

    if (
      (!editorState.activeTool.locked &&
        editorState.activeTool.type !== "freedraw") ||
      !multiPointLayer
    ) {
      resetCursor(canvas);
    }

    let activeTool: AppState["activeTool"];
    if (editorState.activeTool.type === "eraser") {
      activeTool = updateActiveTool(editorState, {
        ...(editorState.activeTool.lastActiveTool || {
          type: "selection"
        }),
        lastActiveToolBeforeEraser: null
      });
    } else {
      activeTool = updateActiveTool(editorState, {
        type: "selection"
      });
    }

    return {
      layers: newLayers,
      editorState: {
        ...editorState,
        cursorButton: "up",
        activeTool:
          (editorState.activeTool.locked ||
            editorState.activeTool.type === "freedraw") &&
          multiPointLayer
            ? editorState.activeTool
            : activeTool,
        draggingLayer: null,
        multiLayer: null,
        editingLayer: null,
        startBoundLayer: null,
        suggestedBindings: [],
        selectedLayerIds:
          multiPointLayer &&
          !editorState.activeTool.locked &&
          editorState.activeTool.type !== "freedraw"
            ? {
                ...editorState.selectedLayerIds,
                [multiPointLayer.id]: true
              }
            : editorState.selectedLayerIds,
        // To select the linear layer when user has finished mutipoint editing
        selectedLinearLayer:
          multiPointLayer && isLinearLayer(multiPointLayer)
            ? new LinearLayerEditor(multiPointLayer, scene)
            : editorState.selectedLinearLayer,
        pendingImageLayerId: null
      },
      commitToHistory: editorState.activeTool.type === "freedraw"
    };
  },
  keyTest: (event, editorState) =>
    (event.key === KEYS.ESCAPE &&
      (editorState.editingLinearLayer !== null ||
        (!editorState.draggingLayer && editorState.multiLayer === null))) ||
    ((event.key === KEYS.ESCAPE || event.key === KEYS.ENTER) &&
      editorState.multiLayer !== null),
  PanelComponent: ({ editorState, updateData, data }) => (
    <ToolButton
      aria-label={t("buttons.done")}
      icon={done}
      onClick={updateData}
      size={data?.size || "medium"}
      title={t("buttons.done")}
      type="button"
      visible={editorState.multiLayer != null}
    />
  )
});
