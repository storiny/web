/* eslint-disable no-case-declarations */

import { Mutable } from "@storiny/types";

import {
  Arrowhead,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN,
  FillStyle,
  LayerType,
  Shape,
  StrokeStyle
} from "../../../constants";
import {
  BinaryFiles,
  EditorState,
  ImportedDataState,
  Layer,
  SelectionLayer,
  TextLayer
} from "../../../types";
import {
  detectLineHeight,
  getNormalizedDimensions,
  isInvisiblySmallLayer,
  isTextLayer,
  LinearLayerEditor,
  measureBaseline,
  refreshTextDimensions
} from "../../layer";
import { randomId } from "../../random";
import { getDefaultEditorState } from "../../state";
import {
  arrayToMap,
  getFontString,
  getUpdatedTimestamp,
  updateActiveTool
} from "../../utils";
import { normalizeLink } from "../url";

type RestoredEditorState = Omit<
  EditorState,
  "offsetTop" | "offsetLeft" | "width" | "height"
>;

export const AllowedActiveTools: Record<Shape, boolean> = {
  [Shape.SELECTION]: true,
  [Shape.TEXT]: true,
  [Shape.RECTANGLE]: true,
  [Shape.DIAMOND]: true,
  [Shape.ELLIPSE]: true,
  [Shape.LINE]: true,
  [Shape.IMAGE]: true,
  [Shape.ARROW]: true,
  [Shape.FREE_DRAW]: true,
  [Shape.ERASER]: false,
  [Shape.HAND]: true
};

export type RestoredDataState = {
  editorState: RestoredEditorState;
  files: BinaryFiles;
  layers: Layer[];
};

/**
 * Restores a layer with properties
 * @param layer Layer
 * @param extra Extra properties
 */
const restoreLayerWithProperties = <
  T extends Required<Layer>,
  K extends Pick<T, keyof Omit<Required<T>, keyof Layer>>
>(
  layer: T,
  extra: Pick<
    T,
    // This extra Pick<T, keyof K> ensures no excess properties are passed.
    // @ts-ignore
    keyof K
  > &
    Partial<Pick<Layer, "type" | "x" | "y">>
): T => {
  const base: Pick<T, keyof Layer> = {
    name: layer.name || "",
    type: extra.type || layer.type,
    isDeleted: layer.isDeleted ?? false,
    id: layer.id || randomId(),
    fillStyle: layer.fillStyle || FillStyle.HACHURE,
    strokeWidth: layer.strokeWidth || 1,
    strokeStyle: layer.strokeStyle ?? StrokeStyle.SOLID,
    roughness: layer.roughness ?? 1,
    opacity: layer.opacity == null ? 100 : layer.opacity,
    angle: layer.angle || 0,
    x: extra.x ?? layer.x ?? 0,
    y: extra.y ?? layer.y ?? 0,
    strokeColor: layer.strokeColor || "#000",
    backgroundColor: layer.backgroundColor || "transparent",
    width: layer.width || 0,
    height: layer.height || 0,
    seed: layer.seed ?? 1,
    groupIds: layer.groupIds ?? [],
    roundness: layer.roundness,
    boundLayers: layer.boundLayers ?? [],
    updated: layer.updated ?? getUpdatedTimestamp(),
    link: layer.link ? normalizeLink(layer.link) : null,
    locked: layer.locked ?? false,
    hidden: layer.hidden ?? false
  };

  return {
    ...base,
    ...getNormalizedDimensions(base),
    ...extra
  } as unknown as T;
};

/**
 * Restores a layer
 * @param layer Layer
 * @param refreshDimensions Whether to refresh dimensions
 */
const restoreLayer = (
  layer: Exclude<Layer, SelectionLayer>,
  refreshDimensions = false
  // @ts-ignore
): typeof layer | null => {
  switch (layer.type) {
    case LayerType.TEXT:
      let fontSize = layer.fontSize;
      let fontFamily = layer.fontFamily;

      if ("font" in layer) {
        const [fontPx, parsedFontFamily]: [string, string] = (
          layer as any
        ).font.split(" ");
        fontSize = parseFloat(fontPx);
        fontFamily = parsedFontFamily;
      }

      const text = layer.text ?? "";

      // `line-height` might not be specified either when creating layers
      // programmatically.
      const lineHeight =
        layer.lineHeight ||
        (layer.height
          ? // Detect line-height from current layer height and font-size
            detectLineHeight(layer)
          : 1.2);
      const baseline = measureBaseline(
        layer.text,
        getFontString(layer),
        lineHeight
      );

      layer = restoreLayerWithProperties(layer, {
        fontSize,
        fontFamily,
        text,
        textAlign: layer.textAlign || DEFAULT_TEXT_ALIGN,
        verticalAlign: layer.verticalAlign || DEFAULT_VERTICAL_ALIGN,
        containerId: layer.containerId ?? null,
        originalText: layer.originalText || text,
        lineHeight,
        baseline
      });

      if (refreshDimensions) {
        layer = { ...layer, ...refreshTextDimensions(layer) };
      }

      return layer;
    case LayerType.FREE_DRAW: {
      return restoreLayerWithProperties(layer, {
        points: layer.points,
        lastCommittedPoint: null,
        simulatePressure: layer.simulatePressure,
        pressures: layer.pressures
      });
    }
    case LayerType.IMAGE:
      return restoreLayerWithProperties(layer, {
        status: layer.status || "pending",
        fileId: layer.fileId,
        scale: layer.scale || [1, 1]
      });
    case LayerType.LINE:
    case LayerType.ARROW: {
      const {
        startArrowhead = null,
        endArrowhead = layer.type === LayerType.ARROW ? Arrowhead.ARROW : null
      } = layer;
      let x = layer.x;
      let y = layer.y;
      let points = layer.points;

      if (points[0][0] !== 0 || points[0][1] !== 0) {
        ({ points, x, y } = LinearLayerEditor.getNormalizedPoints(layer));
      }

      return restoreLayerWithProperties(layer, {
        type: layer.type,
        startBinding: layer.startBinding,
        endBinding: layer.endBinding,
        lastCommittedPoint: null,
        startArrowhead,
        endArrowhead,
        points,
        x,
        y
      });
    }

    // Generic layers
    case LayerType.ELLIPSE:
      return restoreLayerWithProperties(layer, {});
    case LayerType.RECTANGLE:
      return restoreLayerWithProperties(layer, {});
    case LayerType.DIAMOND:
      return restoreLayerWithProperties(layer, {});
    // Default case is not used to catch missing layer type cases
  }
};

/**
 * Repairs contaienr layer's `boundLayers` array by removing duplicates and
 * fixing `containerId` of bound layers if not present. Also removes any
 * bound layers that do not exist in the layer array.
 * @param container Container layer
 * @param layersMap Layer map
 */
const repairContainerLayer = (
  container: Mutable<Layer>,
  layersMap: Map<string, Mutable<Layer>>
): void => {
  if (container.boundLayers) {
    // Copy because we're not cloning on restore, and we don't want to mutate upstream
    const boundLayers = container.boundLayers.slice();
    // Dedupe bindings and fix boundLayer.containerId if not set already
    const boundIds = new Set<Layer["id"]>();

    container.boundLayers = boundLayers.reduce(
      (acc: Mutable<NonNullable<Layer["boundLayers"]>>, binding) => {
        const boundLayer = layersMap.get(binding.id);
        if (boundLayer && !boundIds.has(binding.id)) {
          boundIds.add(binding.id);

          if (boundLayer.isDeleted) {
            return acc;
          }

          acc.push(binding);

          if (
            isTextLayer(boundLayer) &&
            // Being slightly conservative here, preserving existing containerId
            // if defined
            !boundLayer.containerId
          ) {
            (boundLayer as Mutable<TextLayer>).containerId = container.id;
          }
        }

        return acc;
      },
      []
    );
  }
};

/**
 * Repairs target bound layer's container's `boundLayers` array,
 * or removes `containerId` if container does not exist
 * @param boundLayer Bound layer
 * @param layersMap Layers map
 */
const repairBoundLayer = (
  boundLayer: Mutable<TextLayer>,
  layersMap: Map<string, Mutable<Layer>>
): void => {
  const container = boundLayer.containerId
    ? layersMap.get(boundLayer.containerId)
    : null;

  if (!container) {
    boundLayer.containerId = null;
    return;
  }

  if (boundLayer.isDeleted) {
    return;
  }

  if (
    container.boundLayers &&
    !container.boundLayers.find((binding) => binding.id === boundLayer.id)
  ) {
    // Copy because we're not cloning on restore, and we don't want to mutate upstream
    const boundLayers = (
      container.boundLayers || (container.boundLayers = [])
    ).slice();
    boundLayers.push({ type: LayerType.TEXT, id: boundLayer.id });
    container.boundLayers = boundLayers;
  }
};

/**
 * Restores layers
 * @param layers Layers
 * @param localLayers Local layers
 * @param opts Restoration options
 */
export const restoreLayers = (
  layers: ImportedDataState["layers"],
  localLayers: readonly Layer[] | null | undefined,
  opts?: { refreshDimensions?: boolean; repairBindings?: boolean } | undefined
): Layer[] => {
  // Used to detect duplicate top-level layer ids
  const existingIds = new Set<string>();
  // const localLayersMap = localLayers ? arrayToMap(localLayers) : null;
  const restoredLayers = (layers || []).reduce((layers, layer) => {
    if (layer.type !== LayerType.SELECTION && !isInvisiblySmallLayer(layer)) {
      let migratedLayer: Layer | null = restoreLayer(
        layer,
        opts?.refreshDimensions
      );

      if (migratedLayer) {
        // const localLayer = localLayersMap?.get(layer.id);
        // if (localLayer && localLayer.version > migratedLayer.version) {
        //   migratedLayer = bumpUpdate(migratedLayer);
        // }

        if (existingIds.has(migratedLayer.id)) {
          migratedLayer = { ...migratedLayer, id: randomId() };
        }

        existingIds.add(migratedLayer.id);
        layers.push(migratedLayer);
      }
    }
    return layers;
  }, [] as Layer[]);

  if (!opts?.repairBindings) {
    return restoredLayers;
  }

  // repair binding. Mutates layers.
  const restoredLayersMap = arrayToMap(restoredLayers);
  for (const layer of restoredLayers) {
    if (isTextLayer(layer) && layer.containerId) {
      repairBoundLayer(layer, restoredLayersMap);
    } else if (layer.boundLayers) {
      repairContainerLayer(layer, restoredLayersMap);
    }
  }

  return restoredLayers;
};

export const restoreEditorState = (
  editorState: ImportedDataState["editorState"],
  localEditorState: Partial<EditorState> | null | undefined
): RestoredEditorState => {
  editorState = editorState || {};
  const defaultEditorState = getDefaultEditorState();
  const nextEditorState = {} as typeof defaultEditorState;

  for (const [key, defaultValue] of Object.entries(defaultEditorState) as [
    keyof typeof defaultEditorState,
    any
  ][]) {
    const suppliedValue = editorState[key];
    const localValue = localEditorState ? localEditorState[key] : undefined;
    (nextEditorState as any)[key] =
      suppliedValue !== undefined
        ? suppliedValue
        : localValue !== undefined
        ? localValue
        : defaultValue;
  }

  return {
    ...nextEditorState,
    // cursorButton: localEditorState?.cursorButton || "up",
    penDetected:
      localEditorState?.penDetected ??
      (editorState.penMode ? editorState.penDetected ?? false : false),
    activeTool: {
      ...updateActiveTool(
        defaultEditorState,
        nextEditorState.activeTool.type &&
          AllowedActiveTools[nextEditorState.activeTool.type]
          ? nextEditorState.activeTool
          : { type: Shape.SELECTION }
      ),
      lastActiveTool: null,
      locked: nextEditorState.activeTool.locked ?? false
    },
    zoom: editorState.zoom?.value ? editorState.zoom : defaultEditorState.zoom
  };
};

/**
 * Restores editor state
 * @param data Data
 * @param localEditorState Local editor state
 * @param localLayers Local layers
 * @param layersConfig Layers config
 */
export const restore = (
  data: Pick<ImportedDataState, "editorState" | "layers" | "files"> | null,
  localEditorState: Partial<EditorState> | null | undefined,
  localLayers: readonly Layer[] | null | undefined,
  layersConfig?: { refreshDimensions?: boolean; repairBindings?: boolean }
): RestoredDataState => ({
  layers: restoreLayers(data?.layers, localLayers, layersConfig),
  editorState: restoreEditorState(data?.editorState, localEditorState || null),
  files: data?.files || {}
});
