import "canvas-roundrect-polyfill";

import oc from "open-color";
import { RoughCanvas } from "roughjs/bin/canvas";
import { RoughSVG } from "roughjs/bin/svg";

import {
  getScrollBars,
  SCROLLBAR_COLOR,
  SCROLLBAR_WIDTH
} from "../../lib/scene/scrollbars/scrollbars";
import { getSelectedLayers } from "../../lib/scene/selection/selection";
import { RenderConfig } from "../../lib/scene/types";
import {
  isOnlyExportingSingleFrame,
  throttleRAF,
  viewportCoordsToSceneCoords
} from "../../lib/utils/utils";
import { getClientColor } from "../clients";
import { FRAME_STYLE, THEME_FILTER } from "../constants";
import {
  getTargetFrame,
  isLayerInFrame,
  layerOverlapsWithFrame
} from "../frame";
import {
  getLayersInGroup,
  getSelectedGroupIds,
  isSelectedViaGroup,
  selectGroupsFromGivenLayers
} from "../groups";
import {
  getCommonBounds,
  getLayerAbsoluteCoords,
  getLayerBounds,
  getTransformHandles,
  getTransformHandlesFromCoords,
  OMIT_SIDES_FOR_MULTIPLE_ELEMENTS
} from "../layer";
import {
  isBindingEnabled,
  SuggestedBinding,
  SuggestedPointBinding
} from "../layer/binding";
import { maxBindingGap } from "../layer/collision";
import { EXTERNAL_LINK_IMG, getLinkHandleFromCoords } from "../layer/Hyperlink";
import { LinearLayerEditor } from "../layer/linearLayerEditor";
import {
  OMIT_SIDES_FOR_FRAME,
  shouldShowBoundingBox,
  TransformHandles,
  TransformHandleType
} from "../layer/transformHandles";
import { isFrameLayer, isLinearLayer } from "../layer/typeChecks";
import {
  ExcalidrawBindableLayer,
  ExcalidrawFrameLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  GroupId,
  NonDeleted,
  NonDeletedExcalidrawLayer
} from "../layer/types";
import { AppState, BinaryFiles, Point, Zoom } from "../types";
import { UserIdleState } from "../types";
import { renderLayer, renderLayerToSvg } from "./renderLayer";
import { roundRect } from "./roundRect";

export const DEFAULT_SPACING = 2;

const strokeRectWithRotation = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  cx: number,
  cy: number,
  angle: number,
  fill: boolean = false,
  /** should account for zoom */
  radius: number = 0
) => {
  context.save();
  context.translate(cx, cy);
  context.rotate(angle);
  if (fill) {
    context.fillRect(x - cx, y - cy, width, height);
  }
  if (radius && context.roundRect) {
    context.beginPath();
    context.roundRect(x - cx, y - cy, width, height, radius);
    context.stroke();
    context.closePath();
  } else {
    context.strokeRect(x - cx, y - cy, width, height);
  }
  context.restore();
};

const strokeDiamondWithRotation = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  angle: number
) => {
  context.save();
  context.translate(cx, cy);
  context.rotate(angle);
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width / 2, 0);
  context.lineTo(0, -height / 2);
  context.lineTo(-width / 2, 0);
  context.closePath();
  context.stroke();
  context.restore();
};

const strokeEllipseWithRotation = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  angle: number
) => {
  context.beginPath();
  context.ellipse(cx, cy, width / 2, height / 2, angle, 0, Math.PI * 2);
  context.stroke();
};

const fillCircle = (
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  stroke = true
) => {
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.fill();
  if (stroke) {
    context.stroke();
  }
};

const strokeGrid = (
  context: CanvasRenderingContext2D,
  gridSize: number,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number
) => {
  context.save();
  context.strokeStyle = "rgba(0,0,0,0.1)";
  context.beginPath();
  for (let x = offsetX; x < offsetX + width + gridSize * 2; x += gridSize) {
    context.moveTo(x, offsetY - gridSize);
    context.lineTo(x, offsetY + height + gridSize * 2);
  }
  for (let y = offsetY; y < offsetY + height + gridSize * 2; y += gridSize) {
    context.moveTo(offsetX - gridSize, y);
    context.lineTo(offsetX + width + gridSize * 2, y);
  }
  context.stroke();
  context.restore();
};

const renderSingleLinearPoint = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  point: Point,
  radius: number,
  isSelected: boolean,
  isPhantomPoint = false
) => {
  context.strokeStyle = "#5e5ad8";
  context.setLineDash([]);
  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  if (isSelected) {
    context.fillStyle = "rgba(134, 131, 226, 0.9)";
  } else if (isPhantomPoint) {
    context.fillStyle = "rgba(177, 151, 252, 0.7)";
  }

  fillCircle(
    context,
    point[0],
    point[1],
    radius / renderConfig.zoom.value,
    !isPhantomPoint
  );
};

const renderLinearPointHandles = (
  context: CanvasRenderingContext2D,
  editorState: AppState,
  renderConfig: RenderConfig,
  layer: NonDeleted<ExcalidrawLinearLayer>
) => {
  if (!editorState.selectedLinearLayer) {
    return;
  }
  context.save();
  context.translate(renderConfig.scrollX, renderConfig.scrollY);
  context.lineWidth = 1 / renderConfig.zoom.value;
  const points = LinearLayerEditor.getPointsGlobalCoordinates(layer);

  const { POINT_HANDLE_SIZE } = LinearLayerEditor;
  const radius = editorState.editingLinearLayer
    ? POINT_HANDLE_SIZE
    : POINT_HANDLE_SIZE / 2;
  points.forEach((point, idx) => {
    const isSelected =
      !!editorState.editingLinearLayer?.selectedPointsIndices?.includes(idx);

    renderSingleLinearPoint(context, renderConfig, point, radius, isSelected);
  });

  //Rendering segment mid points
  const midPoints = LinearLayerEditor.getEditorMidPoints(
    layer,
    editorState
  ).filter((midPoint) => midPoint !== null) as Point[];

  midPoints.forEach((segmentMidPoint) => {
    if (
      editorState?.selectedLinearLayer?.segmentMidPointHoveredCoords &&
      LinearLayerEditor.arePointsEqual(
        segmentMidPoint,
        editorState.selectedLinearLayer.segmentMidPointHoveredCoords
      )
    ) {
      // The order of renderingSingleLinearPoint and highLight points is different
      // inside vs outside editor as hover states are different,
      // in editor when hovered the original point is not visible as hover state fully covers it whereas outside the
      // editor original point is visible and hover state is just an outer circle.
      if (editorState.editingLinearLayer) {
        renderSingleLinearPoint(
          context,
          renderConfig,
          segmentMidPoint,
          radius,
          false
        );
        highlightPoint(segmentMidPoint, context, renderConfig);
      } else {
        highlightPoint(segmentMidPoint, context, renderConfig);
        renderSingleLinearPoint(
          context,
          renderConfig,
          segmentMidPoint,
          radius,
          false
        );
      }
    } else if (editorState.editingLinearLayer || points.length === 2) {
      renderSingleLinearPoint(
        context,
        renderConfig,
        segmentMidPoint,
        POINT_HANDLE_SIZE / 2,
        false,
        true
      );
    }
  });

  context.restore();
};

const highlightPoint = (
  point: Point,
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig
) => {
  context.fillStyle = "rgba(105, 101, 219, 0.4)";

  fillCircle(
    context,
    point[0],
    point[1],
    LinearLayerEditor.POINT_HANDLE_SIZE / renderConfig.zoom.value,
    false
  );
};
const renderLinearLayerPointHighlight = (
  context: CanvasRenderingContext2D,
  editorState: AppState,
  renderConfig: RenderConfig
) => {
  const { layerId, hoverPointIndex } = editorState.selectedLinearLayer!;
  if (
    editorState.editingLinearLayer?.selectedPointsIndices?.includes(
      hoverPointIndex
    )
  ) {
    return;
  }
  const layer = LinearLayerEditor.getLayer(layerId);
  if (!layer) {
    return;
  }
  const point = LinearLayerEditor.getPointAtIndexGlobalCoordinates(
    layer,
    hoverPointIndex
  );
  context.save();
  context.translate(renderConfig.scrollX, renderConfig.scrollY);

  highlightPoint(point, context, renderConfig);
  context.restore();
};

const frameClip = (
  frame: ExcalidrawFrameLayer,
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig
) => {
  context.translate(
    frame.x + renderConfig.scrollX,
    frame.y + renderConfig.scrollY
  );
  context.beginPath();
  if (context.roundRect && !renderConfig.isExporting) {
    context.roundRect(
      0,
      0,
      frame.width,
      frame.height,
      FRAME_STYLE.radius / renderConfig.zoom.value
    );
  } else {
    context.rect(0, 0, frame.width, frame.height);
  }
  context.clip();
  context.translate(
    -(frame.x + renderConfig.scrollX),
    -(frame.y + renderConfig.scrollY)
  );
};

export const _renderScene = ({
  layers,
  editorState,
  scale,
  rc,
  canvas,
  renderConfig
}: {
  canvas: HTMLCanvasLayer;
  editorState: AppState;
  layers: readonly NonDeletedExcalidrawLayer[];
  rc: RoughCanvas;
  renderConfig: RenderConfig;
  scale: number;
}) =>
  // extra options passed to the renderer
  {
    if (canvas === null) {
      return { atLeastOneVisibleLayer: false };
    }
    const {
      renderScrollbars = false,
      renderSelection = true,
      renderGrid = true,
      isExporting
    } = renderConfig;

    const selectionColor = renderConfig.selectionColor || oc.black;

    const context = canvas.getContext("2d")!;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.save();
    context.scale(scale, scale);
    // When doing calculations based on canvas width we should used normalized one
    const normalizedCanvasWidth = canvas.width / scale;
    const normalizedCanvasHeight = canvas.height / scale;

    if (isExporting && renderConfig.theme === "dark") {
      context.filter = THEME_FILTER;
    }

    // Paint background
    if (typeof renderConfig.viewBackgroundColor === "string") {
      const hasTransparence =
        renderConfig.viewBackgroundColor === "transparent" ||
        renderConfig.viewBackgroundColor.length === 5 || // #RGBA
        renderConfig.viewBackgroundColor.length === 9 || // #RRGGBBA
        /(hsla|rgba)\(/.test(renderConfig.viewBackgroundColor);
      if (hasTransparence) {
        context.clearRect(0, 0, normalizedCanvasWidth, normalizedCanvasHeight);
      }
      context.save();
      context.fillStyle = renderConfig.viewBackgroundColor;
      context.fillRect(0, 0, normalizedCanvasWidth, normalizedCanvasHeight);
      context.restore();
    } else {
      context.clearRect(0, 0, normalizedCanvasWidth, normalizedCanvasHeight);
    }

    // Apply zoom
    context.save();
    context.scale(renderConfig.zoom.value, renderConfig.zoom.value);

    // Grid
    if (renderGrid && editorState.gridSize) {
      strokeGrid(
        context,
        editorState.gridSize,
        -Math.ceil(renderConfig.zoom.value / editorState.gridSize) *
          editorState.gridSize +
          (renderConfig.scrollX % editorState.gridSize),
        -Math.ceil(renderConfig.zoom.value / editorState.gridSize) *
          editorState.gridSize +
          (renderConfig.scrollY % editorState.gridSize),
        normalizedCanvasWidth / renderConfig.zoom.value,
        normalizedCanvasHeight / renderConfig.zoom.value
      );
    }

    // Paint visible layers
    const visibleLayers = layers.filter((layer) =>
      isVisibleLayer(layer, normalizedCanvasWidth, normalizedCanvasHeight, {
        zoom: renderConfig.zoom,
        offsetLeft: editorState.offsetLeft,
        offsetTop: editorState.offsetTop,
        scrollX: renderConfig.scrollX,
        scrollY: renderConfig.scrollY
      })
    );

    const groupsToBeAddedToFrame = new Set<string>();

    visibleLayers.forEach((layer) => {
      if (
        layer.groupIds.length > 0 &&
        editorState.frameToHighlight &&
        editorState.selectedLayerIds[layer.id] &&
        (layerOverlapsWithFrame(layer, editorState.frameToHighlight) ||
          layer.groupIds.find((groupId) => groupsToBeAddedToFrame.has(groupId)))
      ) {
        layer.groupIds.forEach((groupId) =>
          groupsToBeAddedToFrame.add(groupId)
        );
      }
    });

    let editingLinearLayer: NonDeleted<ExcalidrawLinearLayer> | undefined =
      undefined;

    visibleLayers.forEach((layer) => {
      try {
        // - when exporting the whole canvas, we DO NOT apply clipping
        // - when we are exporting a particular frame, apply clipping
        //   if the containing frame is not selected, apply clipping
        const frameId = layer.frameId || editorState.frameToHighlight?.id;

        if (
          frameId &&
          ((renderConfig.isExporting && isOnlyExportingSingleFrame(layers)) ||
            (!renderConfig.isExporting &&
              editorState.frameRendering.enabled &&
              editorState.frameRendering.clip))
        ) {
          context.save();

          const frame = getTargetFrame(layer, editorState);

          if (frame && isLayerInFrame(layer, layers, editorState)) {
            frameClip(frame, context, renderConfig);
          }
          renderLayer(layer, rc, context, renderConfig, editorState);
          context.restore();
        } else {
          renderLayer(layer, rc, context, renderConfig, editorState);
        }
        // Getting the layer using LinearLayerEditor during collab mismatches version - being one head of visible layers due to
        // ShapeCache returns empty hence making sure that we get the
        // correct layer from visible layers
        if (editorState.editingLinearLayer?.layerId === layer.id) {
          if (layer) {
            editingLinearLayer = layer as NonDeleted<ExcalidrawLinearLayer>;
          }
        }
        if (!isExporting) {
          renderLinkIcon(layer, context, editorState);
        }
      } catch (error: any) {
        console.error(error);
      }
    });

    if (editingLinearLayer) {
      renderLinearPointHandles(
        context,
        editorState,
        renderConfig,
        editingLinearLayer
      );
    }

    // Paint selection layer
    if (editorState.selectionLayer) {
      try {
        renderLayer(
          editorState.selectionLayer,
          rc,
          context,
          renderConfig,
          editorState
        );
      } catch (error: any) {
        console.error(error);
      }
    }

    if (isBindingEnabled(editorState)) {
      editorState.suggestedBindings
        .filter((binding) => binding != null)
        .forEach((suggestedBinding) => {
          renderBindingHighlight(context, renderConfig, suggestedBinding!);
        });
    }

    if (editorState.frameToHighlight) {
      renderFrameHighlight(context, renderConfig, editorState.frameToHighlight);
    }

    if (editorState.layersToHighlight) {
      renderLayersBoxHighlight(
        context,
        renderConfig,
        editorState.layersToHighlight,
        editorState
      );
    }

    const locallySelectedLayers = getSelectedLayers(layers, editorState);
    const isFrameSelected = locallySelectedLayers.some((layer) =>
      isFrameLayer(layer)
    );

    // Getting the layer using LinearLayerEditor during collab mismatches version - being one head of visible layers due to
    // ShapeCache returns empty hence making sure that we get the
    // correct layer from visible layers
    if (
      locallySelectedLayers.length === 1 &&
      editorState.editingLinearLayer?.layerId === locallySelectedLayers[0].id
    ) {
      renderLinearPointHandles(
        context,
        editorState,
        renderConfig,
        locallySelectedLayers[0] as NonDeleted<ExcalidrawLinearLayer>
      );
    }

    if (
      editorState.selectedLinearLayer &&
      editorState.selectedLinearLayer.hoverPointIndex >= 0
    ) {
      renderLinearLayerPointHighlight(context, editorState, renderConfig);
    }
    // Paint selected layers
    if (
      renderSelection &&
      !editorState.multiLayer &&
      !editorState.editingLinearLayer
    ) {
      const showBoundingBox = shouldShowBoundingBox(
        locallySelectedLayers,
        editorState
      );

      const locallySelectedIds = locallySelectedLayers.map((layer) => layer.id);
      const isSingleLinearLayerSelected =
        locallySelectedLayers.length === 1 &&
        isLinearLayer(locallySelectedLayers[0]);
      // render selected linear layer points
      if (
        isSingleLinearLayerSelected &&
        editorState.selectedLinearLayer?.layerId ===
          locallySelectedLayers[0].id &&
        !locallySelectedLayers[0].locked
      ) {
        renderLinearPointHandles(
          context,
          editorState,
          renderConfig,
          locallySelectedLayers[0] as ExcalidrawLinearLayer
        );
      }
      if (showBoundingBox) {
        const selections = layers.reduce((acc, layer) => {
          const selectionColors = [];
          // local user
          if (
            locallySelectedIds.includes(layer.id) &&
            !isSelectedViaGroup(editorState, layer)
          ) {
            selectionColors.push(selectionColor);
          }
          // remote users
          if (renderConfig.remoteSelectedLayerIds[layer.id]) {
            selectionColors.push(
              ...renderConfig.remoteSelectedLayerIds[layer.id].map(
                (socketId) => {
                  const background = getClientColor(socketId);
                  return background;
                }
              )
            );
          }

          if (selectionColors.length) {
            const [layerX1, layerY1, layerX2, layerY2, cx, cy] =
              getLayerAbsoluteCoords(layer, true);
            acc.push({
              angle: layer.angle,
              layerX1,
              layerY1,
              layerX2,
              layerY2,
              selectionColors,
              dashed: !!renderConfig.remoteSelectedLayerIds[layer.id],
              cx,
              cy
            });
          }
          return acc;
        }, [] as { angle: number; cx: number; cy: number; dashed?: boolean; layerX1: number; layerX2: number; layerY1: number; layerY2: number; selectionColors: string[] }[]);

        const addSelectionForGroupId = (groupId: GroupId) => {
          const groupLayers = getLayersInGroup(layers, groupId);
          const [layerX1, layerY1, layerX2, layerY2] =
            getCommonBounds(groupLayers);
          selections.push({
            angle: 0,
            layerX1,
            layerX2,
            layerY1,
            layerY2,
            selectionColors: [oc.black],
            dashed: true,
            cx: layerX1 + (layerX2 - layerX1) / 2,
            cy: layerY1 + (layerY2 - layerY1) / 2
          });
        };

        for (const groupId of getSelectedGroupIds(editorState)) {
          // TODO: support multiplayer selected group IDs
          addSelectionForGroupId(groupId);
        }

        if (editorState.editingGroupId) {
          addSelectionForGroupId(editorState.editingGroupId);
        }

        selections.forEach((selection) =>
          renderSelectionBorder(context, renderConfig, selection)
        );
      }
      // Paint resize transformHandles
      context.save();
      context.translate(renderConfig.scrollX, renderConfig.scrollY);

      if (locallySelectedLayers.length === 1) {
        context.fillStyle = oc.white;
        const transformHandles = getTransformHandles(
          locallySelectedLayers[0],
          renderConfig.zoom,
          "mouse" // when we render we don't know which pointer type so use mouse
        );
        if (!editorState.viewModeEnabled && showBoundingBox) {
          renderTransformHandles(
            context,
            renderConfig,
            transformHandles,
            locallySelectedLayers[0].angle
          );
        }
      } else if (locallySelectedLayers.length > 1 && !editorState.isRotating) {
        const dashedLinePadding =
          (DEFAULT_SPACING * 2) / renderConfig.zoom.value;
        context.fillStyle = oc.white;
        const [x1, y1, x2, y2] = getCommonBounds(locallySelectedLayers);
        const initialLineDash = context.getLineDash();
        context.setLineDash([2 / renderConfig.zoom.value]);
        const lineWidth = context.lineWidth;
        context.lineWidth = 1 / renderConfig.zoom.value;
        context.strokeStyle = selectionColor;
        strokeRectWithRotation(
          context,
          x1 - dashedLinePadding,
          y1 - dashedLinePadding,
          x2 - x1 + dashedLinePadding * 2,
          y2 - y1 + dashedLinePadding * 2,
          (x1 + x2) / 2,
          (y1 + y2) / 2,
          0
        );
        context.lineWidth = lineWidth;
        context.setLineDash(initialLineDash);
        const transformHandles = getTransformHandlesFromCoords(
          [x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2],
          0,
          renderConfig.zoom,
          "mouse",
          isFrameSelected
            ? OMIT_SIDES_FOR_FRAME
            : OMIT_SIDES_FOR_MULTIPLE_ELEMENTS
        );
        if (locallySelectedLayers.some((layer) => !layer.locked)) {
          renderTransformHandles(context, renderConfig, transformHandles, 0);
        }
      }
      context.restore();
    }

    // Reset zoom
    context.restore();

    // Paint remote pointers
    for (const clientId in renderConfig.remotePointerViewportCoords) {
      let { x, y } = renderConfig.remotePointerViewportCoords[clientId];

      x -= editorState.offsetLeft;
      y -= editorState.offsetTop;

      const width = 11;
      const height = 14;

      const isOutOfBounds =
        x < 0 ||
        x > normalizedCanvasWidth - width ||
        y < 0 ||
        y > normalizedCanvasHeight - height;

      x = Math.max(x, 0);
      x = Math.min(x, normalizedCanvasWidth - width);
      y = Math.max(y, 0);
      y = Math.min(y, normalizedCanvasHeight - height);

      const background = getClientColor(clientId);

      context.save();
      context.strokeStyle = background;
      context.fillStyle = background;

      const userState = renderConfig.remotePointerUserStates[clientId];
      const isInactive =
        isOutOfBounds ||
        userState === UserIdleState.IDLE ||
        userState === UserIdleState.AWAY;

      if (isInactive) {
        context.globalAlpha = 0.3;
      }

      if (
        renderConfig.remotePointerButton &&
        renderConfig.remotePointerButton[clientId] === "down"
      ) {
        context.beginPath();
        context.arc(x, y, 15, 0, 2 * Math.PI, false);
        context.lineWidth = 3;
        context.strokeStyle = "#ffffff88";
        context.stroke();
        context.closePath();

        context.beginPath();
        context.arc(x, y, 15, 0, 2 * Math.PI, false);
        context.lineWidth = 1;
        context.strokeStyle = background;
        context.stroke();
        context.closePath();
      }

      // Background (white outline) for arrow
      context.fillStyle = oc.white;
      context.strokeStyle = oc.white;
      context.lineWidth = 6;
      context.lineJoin = "round";
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 0, y + 14);
      context.lineTo(x + 4, y + 9);
      context.lineTo(x + 11, y + 8);
      context.closePath();
      context.stroke();
      context.fill();

      // Arrow
      context.fillStyle = background;
      context.strokeStyle = background;
      context.lineWidth = 2;
      context.lineJoin = "round";
      context.beginPath();
      if (isInactive) {
        context.moveTo(x - 1, y - 1);
        context.lineTo(x - 1, y + 15);
        context.lineTo(x + 5, y + 10);
        context.lineTo(x + 12, y + 9);
        context.closePath();
        context.fill();
      } else {
        context.moveTo(x, y);
        context.lineTo(x + 0, y + 14);
        context.lineTo(x + 4, y + 9);
        context.lineTo(x + 11, y + 8);
        context.closePath();
        context.fill();
        context.stroke();
      }

      const username = renderConfig.remotePointerUsernames[clientId] || "";

      if (!isOutOfBounds && username) {
        context.font = "600 12px sans-serif"; // font has to be set before context.measureText()

        const offsetX = x + width / 2;
        const offsetY = y + height + 2;
        const paddingHorizontal = 5;
        const paddingVertical = 3;
        const measure = context.measureText(username);
        const measureHeight =
          measure.actualBoundingBoxDescent + measure.actualBoundingBoxAscent;
        const finalHeight = Math.max(measureHeight, 12);

        const boxX = offsetX - 1;
        const boxY = offsetY - 1;
        const boxWidth = measure.width + 2 + paddingHorizontal * 2 + 2;
        const boxHeight = finalHeight + 2 + paddingVertical * 2 + 2;
        if (context.roundRect) {
          context.beginPath();
          context.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
          context.fillStyle = background;
          context.fill();
          context.strokeStyle = oc.white;
          context.stroke();
        } else {
          roundRect(context, boxX, boxY, boxWidth, boxHeight, 8, oc.white);
        }
        context.fillStyle = oc.black;

        context.fillText(
          username,
          offsetX + paddingHorizontal + 1,
          offsetY +
            paddingVertical +
            measure.actualBoundingBoxAscent +
            Math.floor((finalHeight - measureHeight) / 2) +
            2
        );
      }

      context.restore();
      context.closePath();
    }

    // Paint scrollbars
    let scrollBars;
    if (renderScrollbars) {
      scrollBars = getScrollBars(
        layers,
        normalizedCanvasWidth,
        normalizedCanvasHeight,
        renderConfig
      );

      context.save();
      context.fillStyle = SCROLLBAR_COLOR;
      context.strokeStyle = "rgba(255,255,255,0.8)";
      [scrollBars.horizontal, scrollBars.vertical].forEach((scrollBar) => {
        if (scrollBar) {
          roundRect(
            context,
            scrollBar.x,
            scrollBar.y,
            scrollBar.width,
            scrollBar.height,
            SCROLLBAR_WIDTH / 2
          );
        }
      });
      context.restore();
    }

    context.restore();
    return { atLeastOneVisibleLayer: visibleLayers.length > 0, scrollBars };
  };

const renderSceneThrottled = throttleRAF(
  (config: {
    callback?: (data: ReturnType<typeof _renderScene>) => void;
    canvas: HTMLCanvasLayer;
    editorState: AppState;
    layers: readonly NonDeletedExcalidrawLayer[];
    rc: RoughCanvas;
    renderConfig: RenderConfig;
    scale: number;
  }) => {
    const ret = _renderScene(config);
    config.callback?.(ret);
  },
  { trailing: true }
);

/** renderScene throttled to animation framerate */
export const renderScene = <T extends boolean = false>(
  config: {
    callback?: (data: ReturnType<typeof _renderScene>) => void;
    canvas: HTMLCanvasLayer;
    editorState: AppState;
    layers: readonly NonDeletedExcalidrawLayer[];
    rc: RoughCanvas;
    renderConfig: RenderConfig;
    scale: number;
  },
  /** Whether to throttle rendering. Defaults to false.
   * When throttling, no value is returned. Use the callback instead. */
  throttle?: T
): T extends true ? void : ReturnType<typeof _renderScene> => {
  if (throttle) {
    renderSceneThrottled(config);
    return undefined as T extends true ? void : ReturnType<typeof _renderScene>;
  }
  const ret = _renderScene(config);
  config.callback?.(ret);
  return ret as T extends true ? void : ReturnType<typeof _renderScene>;
};

const renderTransformHandles = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  transformHandles: TransformHandles,
  angle: number
): void => {
  Object.keys(transformHandles).forEach((key) => {
    const transformHandle = transformHandles[key as TransformHandleType];
    if (transformHandle !== undefined) {
      const [x, y, width, height] = transformHandle;

      context.save();
      context.lineWidth = 1 / renderConfig.zoom.value;
      if (renderConfig.selectionColor) {
        context.strokeStyle = renderConfig.selectionColor;
      }
      if (key === "rotation") {
        fillCircle(context, x + width / 2, y + height / 2, width / 2);
        // prefer round corners if roundRect API is available
      } else if (context.roundRect) {
        context.beginPath();
        context.roundRect(x, y, width, height, 2 / renderConfig.zoom.value);
        context.fill();
        context.stroke();
      } else {
        strokeRectWithRotation(
          context,
          x,
          y,
          width,
          height,
          x + width / 2,
          y + height / 2,
          angle,
          true // fill before stroke
        );
      }
      context.restore();
    }
  });
};

const renderSelectionBorder = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  layerProperties: {
    angle: number;
    cx: number;
    cy: number;
    dashed?: boolean;
    layerX1: number;
    layerX2: number;
    layerY1: number;
    layerY2: number;
    selectionColors: string[];
  },
  padding = DEFAULT_SPACING * 2
) => {
  const {
    angle,
    layerX1,
    layerY1,
    layerX2,
    layerY2,
    selectionColors,
    cx,
    cy,
    dashed
  } = layerProperties;
  const layerWidth = layerX2 - layerX1;
  const layerHeight = layerY2 - layerY1;

  const linePadding = padding / renderConfig.zoom.value;
  const lineWidth = 8 / renderConfig.zoom.value;
  const spaceWidth = 4 / renderConfig.zoom.value;

  context.save();
  context.translate(renderConfig.scrollX, renderConfig.scrollY);
  context.lineWidth = 1 / renderConfig.zoom.value;

  const count = selectionColors.length;
  for (let index = 0; index < count; ++index) {
    context.strokeStyle = selectionColors[index];
    if (dashed) {
      context.setLineDash([
        lineWidth,
        spaceWidth + (lineWidth + spaceWidth) * (count - 1)
      ]);
    }
    context.lineDashOffset = (lineWidth + spaceWidth) * index;
    strokeRectWithRotation(
      context,
      layerX1 - linePadding,
      layerY1 - linePadding,
      layerWidth + linePadding * 2,
      layerHeight + linePadding * 2,
      cx,
      cy,
      angle
    );
  }
  context.restore();
};

const renderBindingHighlight = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  suggestedBinding: SuggestedBinding
) => {
  const renderHighlight = Array.isArray(suggestedBinding)
    ? renderBindingHighlightForSuggestedPointBinding
    : renderBindingHighlightForBindableLayer;

  context.save();
  context.translate(renderConfig.scrollX, renderConfig.scrollY);
  renderHighlight(context, suggestedBinding as any);

  context.restore();
};

const renderBindingHighlightForBindableLayer = (
  context: CanvasRenderingContext2D,
  layer: ExcalidrawBindableLayer
) => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
  const width = x2 - x1;
  const height = y2 - y1;
  const threshold = maxBindingGap(layer, width, height);

  // So that we don't overlap the layer itself
  const strokeOffset = 4;
  context.strokeStyle = "rgba(0,0,0,.05)";
  context.lineWidth = threshold - strokeOffset;
  const padding = strokeOffset / 2 + threshold / 2;

  switch (layer.type) {
    case "rectangle":
    case "text":
    case "image":
    case "frame":
      strokeRectWithRotation(
        context,
        x1 - padding,
        y1 - padding,
        width + padding * 2,
        height + padding * 2,
        x1 + width / 2,
        y1 + height / 2,
        layer.angle
      );
      break;
    case "diamond":
      const side = Math.hypot(width, height);
      const wPadding = (padding * side) / height;
      const hPadding = (padding * side) / width;
      strokeDiamondWithRotation(
        context,
        width + wPadding * 2,
        height + hPadding * 2,
        x1 + width / 2,
        y1 + height / 2,
        layer.angle
      );
      break;
    case "ellipse":
      strokeEllipseWithRotation(
        context,
        width + padding * 2,
        height + padding * 2,
        x1 + width / 2,
        y1 + height / 2,
        layer.angle
      );
      break;
  }
};

const renderFrameHighlight = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  frame: NonDeleted<ExcalidrawFrameLayer>
) => {
  const [x1, y1, x2, y2] = getLayerAbsoluteCoords(frame);
  const width = x2 - x1;
  const height = y2 - y1;

  context.strokeStyle = "rgb(0,118,255)";
  context.lineWidth = (FRAME_STYLE.strokeWidth * 2) / renderConfig.zoom.value;

  context.save();
  context.translate(renderConfig.scrollX, renderConfig.scrollY);
  strokeRectWithRotation(
    context,
    x1,
    y1,
    width,
    height,
    x1 + width / 2,
    y1 + height / 2,
    frame.angle,
    false,
    FRAME_STYLE.radius / renderConfig.zoom.value
  );
  context.restore();
};

const renderLayersBoxHighlight = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  layers: NonDeleted<ExcalidrawLayer>[],
  editorState: AppState
) => {
  const individualLayers = layers.filter(
    (layer) => layer.groupIds.length === 0
  );

  const layersInGroups = layers.filter((layer) => layer.groupIds.length > 0);

  const getSelectionFromLayers = (layers: ExcalidrawLayer[]) => {
    const [layerX1, layerY1, layerX2, layerY2] = getCommonBounds(layers);
    return {
      angle: 0,
      layerX1,
      layerX2,
      layerY1,
      layerY2,
      selectionColors: ["rgb(0,118,255)"],
      dashed: false,
      cx: layerX1 + (layerX2 - layerX1) / 2,
      cy: layerY1 + (layerY2 - layerY1) / 2
    };
  };

  const getSelectionForGroupId = (groupId: GroupId) => {
    const groupLayers = getLayersInGroup(layers, groupId);
    return getSelectionFromLayers(groupLayers);
  };

  Object.entries(selectGroupsFromGivenLayers(layersInGroups, editorState))
    .filter(([id, isSelected]) => isSelected)
    .map(([id, isSelected]) => id)
    .map((groupId) => getSelectionForGroupId(groupId))
    .concat(individualLayers.map((layer) => getSelectionFromLayers([layer])))
    .forEach((selection) =>
      renderSelectionBorder(context, renderConfig, selection)
    );
};

const renderBindingHighlightForSuggestedPointBinding = (
  context: CanvasRenderingContext2D,
  suggestedBinding: SuggestedPointBinding
) => {
  const [layer, startOrEnd, bindableLayer] = suggestedBinding;

  const threshold = maxBindingGap(
    bindableLayer,
    bindableLayer.width,
    bindableLayer.height
  );

  context.strokeStyle = "rgba(0,0,0,0)";
  context.fillStyle = "rgba(0,0,0,.05)";

  const pointIndices =
    startOrEnd === "both" ? [0, -1] : startOrEnd === "start" ? [0] : [-1];
  pointIndices.forEach((index) => {
    const [x, y] = LinearLayerEditor.getPointAtIndexGlobalCoordinates(
      layer,
      index
    );
    fillCircle(context, x, y, threshold);
  });
};

let linkCanvasCache: any;
const renderLinkIcon = (
  layer: NonDeletedExcalidrawLayer,
  context: CanvasRenderingContext2D,
  editorState: AppState
) => {
  if (layer.link && !editorState.selectedLayerIds[layer.id]) {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const [x, y, width, height] = getLinkHandleFromCoords(
      [x1, y1, x2, y2],
      layer.angle,
      editorState
    );
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    context.save();
    context.translate(
      editorState.scrollX + centerX,
      editorState.scrollY + centerY
    );
    context.rotate(layer.angle);

    if (!linkCanvasCache || linkCanvasCache.zoom !== editorState.zoom.value) {
      linkCanvasCache = document.createLayer("canvas");
      linkCanvasCache.zoom = editorState.zoom.value;
      linkCanvasCache.width =
        width * window.devicePixelRatio * editorState.zoom.value;
      linkCanvasCache.height =
        height * window.devicePixelRatio * editorState.zoom.value;
      const linkCanvasCacheContext = linkCanvasCache.getContext("2d")!;
      linkCanvasCacheContext.scale(
        window.devicePixelRatio * editorState.zoom.value,
        window.devicePixelRatio * editorState.zoom.value
      );
      linkCanvasCacheContext.fillStyle = "#fff";
      linkCanvasCacheContext.fillRect(0, 0, width, height);
      linkCanvasCacheContext.drawImage(EXTERNAL_LINK_IMG, 0, 0, width, height);
      linkCanvasCacheContext.restore();
      context.drawImage(
        linkCanvasCache,
        x - centerX,
        y - centerY,
        width,
        height
      );
    } else {
      context.drawImage(
        linkCanvasCache,
        x - centerX,
        y - centerY,
        width,
        height
      );
    }
    context.restore();
  }
};

export const isVisibleLayer = (
  layer: ExcalidrawLayer,
  canvasWidth: number,
  canvasHeight: number,
  viewTransformations: {
    offsetLeft: number;
    offsetTop: number;
    scrollX: number;
    scrollY: number;
    zoom: Zoom;
  }
) => {
  const [x1, y1, x2, y2] = getLayerBounds(layer); // scene coordinates
  const topLeftSceneCoords = viewportCoordsToSceneCoords(
    {
      clientX: viewTransformations.offsetLeft,
      clientY: viewTransformations.offsetTop
    },
    viewTransformations
  );
  const bottomRightSceneCoords = viewportCoordsToSceneCoords(
    {
      clientX: viewTransformations.offsetLeft + canvasWidth,
      clientY: viewTransformations.offsetTop + canvasHeight
    },
    viewTransformations
  );

  return (
    topLeftSceneCoords.x <= x2 &&
    topLeftSceneCoords.y <= y2 &&
    bottomRightSceneCoords.x >= x1 &&
    bottomRightSceneCoords.y >= y1
  );
};

// This should be only called for exporting purposes
export const renderSceneToSvg = (
  layers: readonly NonDeletedExcalidrawLayer[],
  rsvg: RoughSVG,
  svgRoot: SVGLayer,
  files: BinaryFiles,
  {
    offsetX = 0,
    offsetY = 0,
    exportWithDarkMode = false,
    exportingFrameId = null
  }: {
    exportWithDarkMode?: boolean;
    exportingFrameId?: string | null;
    offsetX?: number;
    offsetY?: number;
  } = {}
) => {
  if (!svgRoot) {
    return;
  }

  // render layers
  layers.forEach((layer) => {
    if (!layer.isDeleted) {
      try {
        renderLayerToSvg(
          layer,
          rsvg,
          svgRoot,
          files,
          layer.x + offsetX,
          layer.y + offsetY,
          exportWithDarkMode,
          exportingFrameId
        );
      } catch (error: any) {
        console.error(error);
      }
    }
  });
};
