import { isPathALoop } from "../../lib/math/math";
import Scene from "../../lib/scene/Scene";
import { done } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
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
import { resetCursor, updateActiveTool } from "../utils";
import { register } from "./register";

export const actionFinalize = register({
  name: "finalize",
  trackEvent: false,
  perform: (layers, appState, _, { canvas, focusContainer, scene }) => {
    if (appState.editingLinearLayer) {
      const { layerId, startBindingLayer, endBindingLayer } =
        appState.editingLinearLayer;
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
          appState: {
            ...appState,
            cursorButton: "up",
            editingLinearLayer: null
          },
          commitToHistory: true
        };
      }
    }

    let newLayers = layers;

    const pendingImageLayer =
      appState.pendingImageLayerId &&
      scene.getLayer(appState.pendingImageLayerId);

    if (pendingImageLayer) {
      mutateLayer(pendingImageLayer, { isDeleted: true }, false);
    }

    if (window.document.activeLayer instanceof HTMLLayer) {
      focusContainer();
    }

    const multiPointLayer = appState.multiLayer
      ? appState.multiLayer
      : appState.editingLayer?.type === "freedraw"
      ? appState.editingLayer
      : null;

    if (multiPointLayer) {
      // pen and mouse have hover
      if (
        multiPointLayer.type !== "freedraw" &&
        appState.lastPointerDownWith !== "touch"
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
      const isLoop = isPathALoop(multiPointLayer.points, appState.zoom.value);
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
          appState,
          Scene.getScene(multiPointLayer)!,
          { x, y }
        );
      }
    }

    if (
      (!appState.activeTool.locked &&
        appState.activeTool.type !== "freedraw") ||
      !multiPointLayer
    ) {
      resetCursor(canvas);
    }

    let activeTool: AppState["activeTool"];
    if (appState.activeTool.type === "eraser") {
      activeTool = updateActiveTool(appState, {
        ...(appState.activeTool.lastActiveTool || {
          type: "selection"
        }),
        lastActiveToolBeforeEraser: null
      });
    } else {
      activeTool = updateActiveTool(appState, {
        type: "selection"
      });
    }

    return {
      layers: newLayers,
      appState: {
        ...appState,
        cursorButton: "up",
        activeTool:
          (appState.activeTool.locked ||
            appState.activeTool.type === "freedraw") &&
          multiPointLayer
            ? appState.activeTool
            : activeTool,
        draggingLayer: null,
        multiLayer: null,
        editingLayer: null,
        startBoundLayer: null,
        suggestedBindings: [],
        selectedLayerIds:
          multiPointLayer &&
          !appState.activeTool.locked &&
          appState.activeTool.type !== "freedraw"
            ? {
                ...appState.selectedLayerIds,
                [multiPointLayer.id]: true
              }
            : appState.selectedLayerIds,
        // To select the linear layer when user has finished mutipoint editing
        selectedLinearLayer:
          multiPointLayer && isLinearLayer(multiPointLayer)
            ? new LinearLayerEditor(multiPointLayer, scene)
            : appState.selectedLinearLayer,
        pendingImageLayerId: null
      },
      commitToHistory: appState.activeTool.type === "freedraw"
    };
  },
  keyTest: (event, appState) =>
    (event.key === KEYS.ESCAPE &&
      (appState.editingLinearLayer !== null ||
        (!appState.draggingLayer && appState.multiLayer === null))) ||
    ((event.key === KEYS.ESCAPE || event.key === KEYS.ENTER) &&
      appState.multiLayer !== null),
  PanelComponent: ({ appState, updateData, data }) => (
    <ToolButton
      aria-label={t("buttons.done")}
      icon={done}
      onClick={updateData}
      size={data?.size || "medium"}
      title={t("buttons.done")}
      type="button"
      visible={appState.multiLayer != null}
    />
  )
});
