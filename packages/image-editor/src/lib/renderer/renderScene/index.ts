import "canvas-roundrect-polyfill";

import { devConsole } from "@storiny/shared/src/utils/devLog";
import { RoughCanvas } from "roughjs/bin/canvas";

import { LayerType, PointerType } from "../../../constants";
import {
  BindableLayer,
  EditorState,
  GroupId,
  Layer,
  LinearLayer,
  NonDeleted,
  NonDeletedLayer,
  Point,
  RootState,
  Zoom
} from "../../../types";
import {
  getLayersInGroup,
  getSelectedGroupIds,
  isSelectedViaGroup,
  selectGroupsFromGivenLayers
} from "../../group";
import {
  getCommonBounds,
  getLayerAbsoluteCoords,
  getLayerBounds,
  getTransformHandles,
  getTransformHandlesFromCoords,
  isBindingEnabled,
  isLinearLayer,
  LinearLayerEditor,
  maxBindingGap,
  OMIT_SIDES_FOR_MULTIPLE_ELEMENTS,
  shouldShowBoundingBox,
  SuggestedBinding,
  SuggestedPointBinding,
  TransformHandles,
  TransformHandleType
} from "../../layer";
import {
  getScrollBars,
  getSelectedLayers,
  RenderConfig,
  SCROLLBAR_COLOR,
  SCROLLBAR_SIZE,
  ScrollBars
} from "../../scene";
import { throttleRAF, viewportCoordsToSceneCoords } from "../../utils";
import { renderLayer } from "../renderLayer";
import { roundRect } from "../roundRect";

export const DEFAULT_SPACING = 2;

/**
 * Strokes a rect with rotation
 * @param context Context
 * @param x X
 * @param y Y
 * @param width Width
 * @param height Height
 * @param cx CX
 * @param cy CY
 * @param angle Angle
 * @param fill Fill
 * @param radius Corner radius
 */
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
  // Should account for zoom
  radius: number = 0
): void => {
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

/**
 * Strokes a diamond with rotation
 * @param context Context
 * @param width Width
 * @param height Height
 * @param cx CX
 * @param cy CY
 * @param angle Angle
 */
const strokeDiamondWithRotation = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  angle: number
): void => {
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

/**
 * Strokes an ellipse with rotation
 * @param context Context
 * @param width Width
 * @param height Height
 * @param cx CX
 * @param cy CY
 * @param angle Angle
 */
const strokeEllipseWithRotation = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  angle: number
): void => {
  context.beginPath();
  context.ellipse(cx, cy, width / 2, height / 2, angle, 0, Math.PI * 2);
  context.stroke();
};

/**
 * Fills a circle
 * @param context Context
 * @param cx CX
 * @param cy CY
 * @param radius Radius
 * @param stroke Stroke
 */
const fillCircle = (
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  stroke = true
): void => {
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.fill();

  if (stroke) {
    context.stroke();
  }
};

/**
 * Strokes a grid
 * @param context Context
 * @param gridSize Grid size
 * @param offsetX Offset X
 * @param offsetY Offset Y
 * @param width Width
 * @param height Height
 */
const strokeGrid = (
  context: CanvasRenderingContext2D,
  gridSize: number,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number
): void => {
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

/**
 * Renders a single linear point
 * @param context Context
 * @param renderConfig Render config
 * @param point Point
 * @param radius Radius
 * @param isSelected Selected flag
 * @param isPhantomPoint Phantom point flag
 */
const renderSingleLinearPoint = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  point: Point,
  radius: number,
  isSelected: boolean,
  isPhantomPoint = false
): void => {
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

/**
 * Renders linear point handles
 * @param context Context
 * @param editorState Editor state
 * @param renderConfig Render config
 * @param layer Layer
 */
const renderLinearPointHandles = (
  context: CanvasRenderingContext2D,
  editorState: EditorState,
  renderConfig: RenderConfig,
  layer: NonDeleted<LinearLayer>
): void => {
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

  // Rendering segment mid points
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
      // The order of renderingSingleLinearPoint and highlight points differs
      // inside and outside the editor, as their hover states are different.
      // Inside the editor, when hovered, the original point is not visible,
      // as the hover state fully covers it. On the other hand, outside the
      // editor, the original point is visible, and the hover state is just
      // an outer circle
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

/**
 * Highlights a point
 * @param point Point
 * @param context Context
 * @param renderConfig Render config
 */
const highlightPoint = (
  point: Point,
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig
): void => {
  context.fillStyle = "rgba(105, 101, 219, 0.4)";

  fillCircle(
    context,
    point[0],
    point[1],
    LinearLayerEditor.POINT_HANDLE_SIZE / renderConfig.zoom.value,
    false
  );
};

/**
 * Renders a linear layer point highlight
 * @param context Context
 * @param editorState Editor state
 * @param renderConfig Render config
 */
const renderLinearLayerPointHighlight = (
  context: CanvasRenderingContext2D,
  editorState: EditorState,
  renderConfig: RenderConfig
): void => {
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

/**
 * Renders a scene
 * @param layers Layers
 * @param editorState Editor state
 * @param scale Scale
 * @param rc Rough canvas
 * @param canvas Canvas element
 * @param renderConfig Render config
 */
export const _renderScene = ({
  layers,
  editorState,
  scale,
  rc,
  canvas,
  renderConfig
}: {
  canvas: HTMLCanvasElement;
  editorState: RootState;
  layers: readonly NonDeletedLayer[];
  rc: RoughCanvas;
  renderConfig: RenderConfig;
  scale: number;
}): { atLeastOneVisibleLayer: boolean; scrollBars?: ScrollBars | undefined } =>
  // Extra options passed to the renderer
  {
    if (canvas === null) {
      return { atLeastOneVisibleLayer: false };
    }

    const {
      renderScrollbars = false,
      renderSelection = true,
      renderGrid = true
    } = renderConfig;
    const selectionColor = renderConfig.selectionColor || "#000";
    const context = canvas.getContext("2d")!;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.save();
    context.scale(scale, scale);

    // When doing calculations based on the canvas width, we should used normalized one
    const normalizedCanvasWidth = canvas.width / scale;
    const normalizedCanvasHeight = canvas.height / scale;

    // if (isExporting && renderConfig.theme === "dark") {
    //   context.filter = THEME_FILTER;
    // }

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
    let editingLinearLayer: NonDeleted<LinearLayer> | undefined = undefined;

    visibleLayers.forEach((layer) => {
      try {
        renderLayer(layer, rc, context, renderConfig, editorState);

        // Getting the layer using `LinearLayerEditor` during collab mismatches version - being one head of visible layers due to
        // ShapeCache returns empty hence making sure that we get the
        // correct layer from visible layers
        if (editorState.editingLinearLayer?.layerId === layer.id) {
          if (layer) {
            editingLinearLayer = layer as NonDeleted<LinearLayer>;
          }
        }
      } catch (error: any) {
        devConsole.error(error);
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
        devConsole.error(error);
      }
    }

    if (isBindingEnabled(editorState)) {
      editorState.suggestedBindings
        .filter((binding) => binding != null)
        .forEach((suggestedBinding) => {
          renderBindingHighlight(context, renderConfig, suggestedBinding!);
        });
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
        locallySelectedLayers[0] as NonDeleted<LinearLayer>
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

      // Render selected linear layer points
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
          locallySelectedLayers[0] as LinearLayer
        );
      }

      if (showBoundingBox) {
        const selections = layers.reduce((acc, layer) => {
          const selectionColors: string[] = [];

          // Local user
          if (
            locallySelectedIds.includes(layer.id) &&
            !isSelectedViaGroup(editorState, layer)
          ) {
            selectionColors.push(selectionColor);
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
              dashed: false,
              cx,
              cy
            });
          }

          return acc;
        }, [] as { angle: number; cx: number; cy: number; dashed?: boolean; layerX1: number; layerX2: number; layerY1: number; layerY2: number; selectionColors: string[] }[]);

        /**
         * Adds selection for group
         * @param groupId Group ID
         */
        const addSelectionForGroupId = (groupId: GroupId): void => {
          const groupLayers = getLayersInGroup(layers, groupId);
          const [layerX1, layerY1, layerX2, layerY2] =
            getCommonBounds(groupLayers);

          selections.push({
            angle: 0,
            layerX1,
            layerX2,
            layerY1,
            layerY2,
            selectionColors: ["#000"],
            dashed: true,
            cx: layerX1 + (layerX2 - layerX1) / 2,
            cy: layerY1 + (layerY2 - layerY1) / 2
          });
        };

        for (const groupId of getSelectedGroupIds(editorState)) {
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
        context.fillStyle = "#fff";

        const transformHandles = getTransformHandles(
          locallySelectedLayers[0],
          renderConfig.zoom,
          PointerType.MOUSE // Initial type
        );

        if (showBoundingBox) {
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

        context.fillStyle = "#fff";

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
          PointerType.MOUSE,
          OMIT_SIDES_FOR_MULTIPLE_ELEMENTS
        );

        if (locallySelectedLayers.some((layer) => !layer.locked)) {
          renderTransformHandles(context, renderConfig, transformHandles, 0);
        }
      }

      context.restore();
    }

    // Reset zoom
    context.restore();

    // Paint scrollbars
    let scrollBars: ScrollBars | undefined;

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
            SCROLLBAR_SIZE / 2
          );
        }
      });

      context.restore();
    }

    context.restore();

    return { atLeastOneVisibleLayer: visibleLayers.length > 0, scrollBars };
  };

/**
 * Throttled renderer
 */
const renderSceneThrottled = throttleRAF(
  (config: {
    callback?: (data: ReturnType<typeof _renderScene>) => void;
    canvas: HTMLCanvasElement;
    editorState: RootState;
    layers: readonly NonDeletedLayer[];
    rc: RoughCanvas;
    renderConfig: RenderConfig;
    scale: number;
  }) => {
    const ret = _renderScene(config);
    config.callback?.(ret);
  },
  { trailing: true }
);

/**
 * Renders scene throttled to animation framerate
 * @param config Config
 * @param throttle Whether to throttle rendering
 */
export const renderScene = <T extends boolean = false>(
  config: {
    callback?: (data: ReturnType<typeof _renderScene>) => void;
    canvas: HTMLCanvasElement;
    editorState: RootState;
    layers: readonly NonDeletedLayer[];
    rc: RoughCanvas;
    renderConfig: RenderConfig;
    scale: number;
  },
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

/**
 * Renders transform handles
 * @param context Context
 * @param renderConfig Render config
 * @param transformHandles Transform handles
 * @param angle Angle
 */
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
        // Prefer round corners if roundRect API is available
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
          true // Fill before stroke
        );
      }

      context.restore();
    }
  });
};

/**
 * Renders selection border
 * @param context Context
 * @param renderConfig Render config
 * @param layerProperties Layer props
 * @param padding Padding
 */
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
): void => {
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

/**
 * Renders binding highlight
 * @param context Context
 * @param renderConfig Render config
 * @param suggestedBinding Suggested binding
 */
const renderBindingHighlight = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  suggestedBinding: SuggestedBinding
): void => {
  const renderHighlight = Array.isArray(suggestedBinding)
    ? renderBindingHighlightForSuggestedPointBinding
    : renderBindingHighlightForBindableLayer;

  context.save();
  context.translate(renderConfig.scrollX, renderConfig.scrollY);
  renderHighlight(context, suggestedBinding as any);
  context.restore();
};

/**
 * Renders binding highlight for binding layer
 * @param context Context
 * @param layer Layer
 */
const renderBindingHighlightForBindableLayer = (
  context: CanvasRenderingContext2D,
  layer: BindableLayer
): void => {
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
    case LayerType.RECTANGLE:
    case LayerType.TEXT:
    case LayerType.IMAGE:
    case LayerType.DIAMOND: {
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
    }
    case LayerType.ELLIPSE:
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

/**
 * Renders layers box highlight
 * @param context Context
 * @param renderConfig Render config
 * @param layers Layers
 * @param editorState Editor state
 */
const renderLayersBoxHighlight = (
  context: CanvasRenderingContext2D,
  renderConfig: RenderConfig,
  layers: NonDeleted<Layer>[],
  editorState: EditorState
): void => {
  const individualLayers = layers.filter(
    (layer) => layer.groupIds.length === 0
  );
  const layersInGroups = layers.filter((layer) => layer.groupIds.length > 0);
  const getSelectionFromLayers = (
    layers: Layer[]
  ): {
    angle: number;
    cx: number;
    cy: number;
    dashed: boolean;
    layerX1: number;
    layerX2: number;
    layerY1: number;
    layerY2: number;
    selectionColors: string[];
  } => {
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
  const getSelectionForGroupId = (
    groupId: GroupId
  ): ReturnType<typeof getSelectionFromLayers> => {
    const groupLayers = getLayersInGroup(layers, groupId);
    return getSelectionFromLayers(groupLayers);
  };

  Object.entries(selectGroupsFromGivenLayers(layersInGroups, editorState))
    .filter(([, isSelected]) => isSelected)
    .map(([id]) => id)
    .map((groupId) => getSelectionForGroupId(groupId))
    .concat(individualLayers.map((layer) => getSelectionFromLayers([layer])))
    .forEach((selection) =>
      renderSelectionBorder(context, renderConfig, selection)
    );
};

/**
 * Renders binding highlight for suggested point binding
 * @param context Context
 * @param suggestedBinding Suggested binding
 */
const renderBindingHighlightForSuggestedPointBinding = (
  context: CanvasRenderingContext2D,
  suggestedBinding: SuggestedPointBinding
): void => {
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

/**
 * Predicate function for determining visible layers
 * @param layer Layer
 * @param canvasWidth Canvas width
 * @param canvasHeight Canvas height
 * @param viewTransformations View transformations
 */
export const isVisibleLayer = (
  layer: Layer,
  canvasWidth: number,
  canvasHeight: number,
  viewTransformations: {
    offsetLeft: number;
    offsetTop: number;
    scrollX: number;
    scrollY: number;
    zoom: Zoom;
  }
): boolean => {
  const [x1, y1, x2, y2] = getLayerBounds(layer); // Scene coordinates
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

// // This should be only called for exporting purposes
// export const renderSceneToSvg = (
//   layers: readonly NonDeletedExcalidrawLayer[],
//   rsvg: RoughSVG,
//   svgRoot: SVGLayer,
//   files: BinaryFiles,
//   {
//     offsetX = 0,
//     offsetY = 0,
//     exportWithDarkMode = false,
//     exportingFrameId = null
//   }: {
//     exportWithDarkMode?: boolean;
//     exportingFrameId?: string | null;
//     offsetX?: number;
//     offsetY?: number;
//   } = {}
// ) => {
//   if (!svgRoot) {
//     return;
//   }
//
//   // render layers
//   layers.forEach((layer) => {
//     if (!layer.isDeleted) {
//       try {
//         renderLayerToSvg(
//           layer,
//           rsvg,
//           svgRoot,
//           files,
//           layer.x + offsetX,
//           layer.y + offsetY,
//           exportWithDarkMode,
//           exportingFrameId
//         );
//       } catch (error: any) {
//         console.error(error);
//       }
//     }
//   });
// };
