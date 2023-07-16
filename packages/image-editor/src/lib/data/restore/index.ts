/* eslint-disable no-case-declarations */
import {
  Arrowhead,
  FillStyle,
  LayerType,
  Shape,
  StrokeStyle
} from "../../../constants";
import { getDefaultAppState } from "../../../core/appState";
import {
  DEFAULT_SIDEBAR,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN
} from "../../../core/constants";
import {
  getNonDeletedLayers,
  getNormalizedDimensions,
  isInvisiblySmallLayer,
  isTextLayer,
  refreshTextDimensions
} from "../../../core/layer";
import { LinearLayerEditor } from "../../../core/layer/linearLayerEditor";
import { bumpUpdate } from "../../../core/layer/mutateLayer";
import {
  detectLineHeight,
  getDefaultLineHeight,
  measureBaseline
} from "../../../core/layer/textLayer";
import { randomId } from "../../../core/random";
import { MarkOptional, Mutable } from "../../../core/utility-types";
import {
  arrayToMap,
  getFontString,
  getUpdatedTimestamp,
  updateActiveTool
} from "../../../core/utils";
import {
  BinaryFiles,
  EditorState,
  ImportedDataState,
  Layer,
  SelectionLayer,
  TextLayer
} from "../../../types";
import { LegacyAppState } from "../types";
import { normalizeLink } from "../url/url";

type RestoredEditorState = Omit<
  EditorState,
  "offsetTop" | "offsetLeft" | "width" | "height"
>;

export const AllowedActiveTools: Record<Shape, boolean> = {
  selection: true,
  text: true,
  rectangle: true,
  diamond: true,
  ellipse: true,
  line: true,
  image: true,
  arrow: true,
  freedraw: true,
  eraser: false,
  hand: true
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

const restoreLayer = (
  layer: Exclude<Layer, SelectionLayer>,
  refreshDimensions = false
  // @ts-ignore
): typeof layer | null => {
  switch (layer.type) {
    case "text":
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
          : // No layer height likely means programmatic use, so default
            // to a fixed line height
            getDefaultLineHeight(layer.fontFamily));
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
    case "freedraw": {
      return restoreLayerWithProperties(layer, {
        points: layer.points,
        lastCommittedPoint: null,
        simulatePressure: layer.simulatePressure,
        pressures: layer.pressures
      });
    }
    case "image":
      return restoreLayerWithProperties(layer, {
        status: layer.status || "pending",
        fileId: layer.fileId,
        scale: layer.scale || [1, 1]
      });
    case "line":
    case "arrow": {
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
    case "ellipse":
      return restoreLayerWithProperties(layer, {});
    case "rectangle":
      return restoreLayerWithProperties(layer, {});
    case "diamond":
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
  const localLayersMap = localLayers ? arrayToMap(localLayers) : null;
  const restoredLayers = (layers || []).reduce((layers, layer) => {
    if (layer.type !== LayerType.SELECTION && !isInvisiblySmallLayer(layer)) {
      let migratedLayer: Layer | null = restoreLayer(
        layer,
        opts?.refreshDimensions
      );

      if (migratedLayer) {
        const localLayer = localLayersMap?.get(layer.id);
        if (localLayer && localLayer.version > migratedLayer.version) {
          migratedLayer = bumpUpdate(migratedLayer, localLayer.version);
        }
        if (existingIds.has(migratedLayer.id)) {
          migratedLayer = { ...migratedLayer, id: randomId() };
        }
        existingIds.add(migratedLayer.id);
        layers.push(migratedLayer);
      }
    }
    return layers;
  }, [] as ExcalidrawLayer[]);

  if (!opts?.repairBindings) {
    return restoredLayers;
  }

  // repair binding. Mutates layers.
  const restoredLayersMap = arrayToMap(restoredLayers);
  for (const layer of restoredLayers) {
    if (layer.frameId) {
      repairFrameMembership(layer, restoredLayersMap);
    }

    if (isTextLayer(layer) && layer.containerId) {
      repairBoundLayer(layer, restoredLayersMap);
    } else if (layer.boundLayers) {
      repairContainerLayer(layer, restoredLayersMap);
    }
  }

  return restoredLayers;
};

const coalesceAppStateValue = <
  T extends keyof ReturnType<typeof getDefaultAppState>
>(
  key: T,
  appState: Exclude<ImportedDataState["appState"], null | undefined>,
  defaultAppState: ReturnType<typeof getDefaultAppState>
) => {
  const value = appState[key];
  // NOTE the value! assertion is needed in TS 4.5.5 (fixed in newer versions)
  return value !== undefined ? value! : defaultAppState[key];
};

const LegacyAppStateMigrations: {
  [K in keyof LegacyAppState]: (
    ImportedDataState: Exclude<ImportedDataState["appState"], null | undefined>,
    defaultAppState: ReturnType<typeof getDefaultAppState>
  ) => [LegacyAppState[K][1], AppState[LegacyAppState[K][1]]];
} = {
  isSidebarDocked: (appState, defaultAppState) => [
    "defaultSidebarDockedPreference",
    appState.isSidebarDocked ??
      coalesceAppStateValue(
        "defaultSidebarDockedPreference",
        appState,
        defaultAppState
      )
  ]
};

export const restoreAppState = (
  appState: ImportedDataState["appState"],
  localAppState: Partial<AppState> | null | undefined
): RestoredAppState => {
  appState = appState || {};
  const defaultAppState = getDefaultAppState();
  const nextAppState = {} as typeof defaultAppState;

  // first, migrate all legacy AppState properties to new ones. We do it
  // in one go before migrate the rest of the properties in case the new ones
  // depend on checking any other key (i.e. they are coupled)
  for (const legacyKey of Object.keys(
    LegacyAppStateMigrations
  ) as (keyof typeof LegacyAppStateMigrations)[]) {
    if (legacyKey in appState) {
      const [nextKey, nextValue] = LegacyAppStateMigrations[legacyKey](
        appState,
        defaultAppState
      );
      (nextAppState as any)[nextKey] = nextValue;
    }
  }

  for (const [key, defaultValue] of Object.entries(defaultAppState) as [
    keyof typeof defaultAppState,
    any
  ][]) {
    // if AppState contains a legacy key, prefer that one and migrate its
    // value to the new one
    const suppliedValue = appState[key];

    const localValue = localAppState ? localAppState[key] : undefined;
    (nextAppState as any)[key] =
      suppliedValue !== undefined
        ? suppliedValue
        : localValue !== undefined
        ? localValue
        : defaultValue;
  }

  return {
    ...nextAppState,
    cursorButton: localAppState?.cursorButton || "up",
    // reset on fresh restore so as to hide the UI button if penMode not active
    penDetected:
      localAppState?.penDetected ??
      (appState.penMode ? appState.penDetected ?? false : false),
    activeTool: {
      ...updateActiveTool(
        defaultAppState,
        nextAppState.activeTool.type &&
          AllowedExcalidrawActiveTools[nextAppState.activeTool.type]
          ? nextAppState.activeTool
          : { type: "selection" }
      ),
      lastActiveTool: null,
      locked: nextAppState.activeTool.locked ?? false
    },
    // Migrates from previous version where appState.zoom was a number
    zoom:
      typeof appState.zoom === "number"
        ? {
            value: appState.zoom as NormalizedZoomValue
          }
        : appState.zoom?.value
        ? appState.zoom
        : defaultAppState.zoom,
    openSidebar:
      // string (legacy)
      typeof (appState.openSidebar as any as string) === "string"
        ? { name: DEFAULT_SIDEBAR.name }
        : nextAppState.openSidebar
  };
};

export const restore = (
  data: Pick<ImportedDataState, "appState" | "layers" | "files"> | null,
  localAppState: Partial<AppState> | null | undefined,
  localLayers: readonly ExcalidrawLayer[] | null | undefined,
  layersConfig?: { refreshDimensions?: boolean; repairBindings?: boolean }
): RestoredDataState => ({
  layers: restoreLayers(data?.layers, localLayers, layersConfig),
  appState: restoreAppState(data?.appState, localAppState || null),
  files: data?.files || {}
});

const restoreLibraryItem = (libraryItem: LibraryItem) => {
  const layers = restoreLayers(getNonDeletedLayers(libraryItem.layers), null);
  return layers.length ? { ...libraryItem, layers } : null;
};

export const restoreLibraryItems = (
  libraryItems: ImportedDataState["libraryItems"] = [],
  defaultStatus: LibraryItem["status"]
) => {
  const restoredItems: LibraryItem[] = [];
  for (const item of libraryItems) {
    // migrate older libraries
    if (Array.isArray(item)) {
      const restoredItem = restoreLibraryItem({
        status: defaultStatus,
        layers: item,
        id: randomId(),
        created: Date.now()
      });
      if (restoredItem) {
        restoredItems.push(restoredItem);
      }
    } else {
      const _item = item as MarkOptional<
        LibraryItem,
        "id" | "status" | "created"
      >;
      const restoredItem = restoreLibraryItem({
        ..._item,
        id: _item.id || randomId(),
        status: _item.status || defaultStatus,
        created: _item.created || Date.now()
      });
      if (restoredItem) {
        restoredItems.push(restoredItem);
      }
    }
  }
  return restoredItems;
};
