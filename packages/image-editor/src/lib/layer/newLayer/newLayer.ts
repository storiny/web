import { MarkOptional, Merge, Mutable } from "@storiny/types";

import {
  Arrowhead,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_LAYER_PROPS,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN,
  LayerType,
  TextAlign,
  VerticalAlign
} from "../../../constants";
import {
  EditorState,
  FreeDrawLayer,
  GenericLayer,
  GroupId,
  ImageLayer,
  Layer,
  LinearLayer,
  NonDeleted,
  TextContainerLayer,
  TextLayer
} from "../../../types";
import { getNewGroupIdsForDuplication } from "../../group";
import { adjustXYWithRotation } from "../../math";
import { randomId, randomInteger } from "../../random";
import {
  arrayToMap,
  getFontString,
  getUpdatedTimestamp,
  isTestEnv
} from "../../utils";
import { getResizedLayerAbsoluteCoords } from "../bounds";
import {
  getBoundTextMaxWidth,
  getContainerLayer,
  getLayerAbsoluteCoords,
  measureText,
  normalizeText,
  wrapText
} from "../index";
import { bumpUpdate, newLayerWith } from "../mutate";

type LayerConstructorOpts = MarkOptional<
  Omit<GenericLayer, "id" | "type" | "isDeleted" | "updated">,
  | "width"
  | "height"
  | "angle"
  | "groupIds"
  | "boundLayers"
  | "seed"
  | "name"
  | "link"
  | "strokeStyle"
  | "fillStyle"
  | "strokeColor"
  | "backgroundColor"
  | "roughness"
  | "strokeWidth"
  | "roundness"
  | "locked"
  | "hidden"
  | "opacity"
>;

const newLayerBase = <T extends Layer>(
  type: T["type"],
  {
    x,
    y,
    strokeColor = DEFAULT_LAYER_PROPS.strokeColor,
    backgroundColor = DEFAULT_LAYER_PROPS.backgroundColor,
    fillStyle = DEFAULT_LAYER_PROPS.fillStyle,
    strokeWidth = DEFAULT_LAYER_PROPS.strokeWidth,
    strokeStyle = DEFAULT_LAYER_PROPS.strokeStyle,
    roughness = DEFAULT_LAYER_PROPS.roughness,
    opacity = DEFAULT_LAYER_PROPS.opacity,
    width = 0,
    height = 0,
    angle = 0,
    groupIds = [],
    roundness = null,
    boundLayers = null,
    link = null,
    locked = DEFAULT_LAYER_PROPS.locked,
    hidden = DEFAULT_LAYER_PROPS.hidden,
    ...rest
  }: LayerConstructorOpts & Omit<Partial<GenericLayer>, "type">
): Merge<GenericLayer, { type: T["type"] }> =>
  ({
    angle,
    backgroundColor,
    boundLayers,
    fillStyle,
    groupIds,
    height,
    hidden,
    id: rest.id || randomId(),
    isDeleted: false as false,
    link,
    locked,
    name: "",
    opacity,
    roughness,
    roundness,
    seed: rest.seed ?? randomInteger(),
    strokeColor,
    strokeStyle,
    strokeWidth,
    type,
    updated: getUpdatedTimestamp(),
    width,
    x,
    y
    // Assign a type to guard against excess properties
  } as Merge<GenericLayer, { type: T["type"] }>);

export const newLayer = (
  opts: {
    type: GenericLayer["type"];
  } & LayerConstructorOpts
): NonDeleted<GenericLayer> => newLayerBase<GenericLayer>(opts.type, opts);

/**
 * Computes layers X and Y offsets based on textAlign and verticalAlign
 * @param opts Options
 * @param metrics Metrics
 */
const getTextLayerPositionOffsets = (
  opts: {
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
  },
  metrics: {
    height: number;
    width: number;
  }
): { x: number; y: number } => ({
  x:
    opts.textAlign === "center"
      ? metrics.width / 2
      : opts.textAlign === "right"
      ? metrics.width
      : 0,
  y: opts.verticalAlign === "middle" ? metrics.height / 2 : 0
});

/**
 * Creates a new text layer
 * @param opts Options
 */
export const newTextLayer = (
  opts: {
    containerId?: TextContainerLayer["id"];
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: TextLayer["lineHeight"];
    strokeWidth?: TextLayer["strokeWidth"];
    text: string;
    textAlign?: TextAlign;
    verticalAlign?: VerticalAlign;
  } & LayerConstructorOpts
): NonDeleted<TextLayer> => {
  const fontFamily = opts.fontFamily || DEFAULT_FONT_FAMILY;
  const fontSize = opts.fontSize || DEFAULT_FONT_SIZE;
  const lineHeight = opts.lineHeight || 1.2;
  const text = normalizeText(opts.text);
  const metrics = measureText(
    text,
    getFontString({ fontFamily, fontSize }),
    lineHeight
  );
  const textAlign = opts.textAlign || DEFAULT_TEXT_ALIGN;
  const verticalAlign = opts.verticalAlign || DEFAULT_VERTICAL_ALIGN;
  const offsets = getTextLayerPositionOffsets(
    { textAlign, verticalAlign },
    metrics
  );

  return newLayerWith(
    {
      ...newLayerBase<TextLayer>(LayerType.TEXT, opts),
      text,
      fontSize,
      fontFamily,
      textAlign,
      verticalAlign,
      x: opts.x - offsets.x,
      y: opts.y - offsets.y,
      width: metrics.width,
      height: metrics.height,
      baseline: metrics.baseline,
      containerId: opts.containerId || null,
      originalText: text,
      lineHeight
    },
    {}
  );
};

/**
 * Computes the new adjusted dimensions for a text layer
 * @param layer Text layer
 * @param nextText New text
 */
const getAdjustedDimensions = (
  layer: TextLayer,
  nextText: string
): {
  baseline: number;
  height: number;
  width: number;
  x: number;
  y: number;
} => {
  const {
    width: nextWidth,
    height: nextHeight,
    baseline: nextBaseline
  } = measureText(nextText, getFontString(layer), layer.lineHeight);
  const { textAlign, verticalAlign } = layer;
  let x: number;
  let y: number;

  if (
    textAlign === TextAlign.CENTER &&
    verticalAlign === VerticalAlign.MIDDLE &&
    !layer.containerId
  ) {
    const prevMetrics = measureText(
      layer.text,
      getFontString(layer),
      layer.lineHeight
    );
    const offsets = getTextLayerPositionOffsets(layer, {
      width: nextWidth - prevMetrics.width,
      height: nextHeight - prevMetrics.height
    });

    x = layer.x - offsets.x;
    y = layer.y - offsets.y;
  } else {
    const [x1, y1, x2, y2] = getLayerAbsoluteCoords(layer);
    const [nextX1, nextY1, nextX2, nextY2] = getResizedLayerAbsoluteCoords(
      layer,
      nextWidth,
      nextHeight,
      false
    );
    const deltaX1 = (x1 - nextX1) / 2;
    const deltaY1 = (y1 - nextY1) / 2;
    const deltaX2 = (x2 - nextX2) / 2;
    const deltaY2 = (y2 - nextY2) / 2;

    [x, y] = adjustXYWithRotation(
      {
        s: true,
        e: textAlign === TextAlign.CENTER || textAlign === TextAlign.LEFT,
        w: textAlign === TextAlign.CENTER || textAlign === TextAlign.RIGHT
      },
      layer.x,
      layer.y,
      layer.angle,
      deltaX1,
      deltaY1,
      deltaX2,
      deltaY2
    );
  }

  return {
    width: nextWidth,
    height: nextHeight,
    baseline: nextBaseline,
    x: Number.isFinite(x) ? x : layer.x,
    y: Number.isFinite(y) ? y : layer.y
  };
};

/**
 * Refreshes text dimensions
 * @param textLayer Text layer
 * @param text Layer text
 */
export const refreshTextDimensions = (
  textLayer: TextLayer,
  text = textLayer.text
):
  | ({ text: string } & ReturnType<typeof getAdjustedDimensions>)
  | undefined => {
  if (textLayer.isDeleted) {
    return;
  }

  const container = getContainerLayer(textLayer);

  if (container) {
    text = wrapText(
      text,
      getFontString(textLayer),
      getBoundTextMaxWidth(container)
    );
  }

  const dimensions = getAdjustedDimensions(textLayer, text);

  return { text, ...dimensions };
};

/**
 * Updates a text layer
 * @param textLayer Text layer to update
 * @param isDeleted Deleted prop
 * @param originalText Original layer text
 */
export const updateTextLayer = (
  textLayer: TextLayer,
  {
    isDeleted,
    originalText
  }: {
    isDeleted?: boolean;
    originalText: string;
  }
): TextLayer =>
  newLayerWith(textLayer, {
    originalText,
    isDeleted: isDeleted ?? textLayer.isDeleted,
    ...refreshTextDimensions(textLayer, originalText)
  });

/**
 * Creates a new free draw layer
 * @param opts Options
 */
export const newFreeDrawLayer = (
  opts: {
    points?: FreeDrawLayer["points"];
    simulatePressure: boolean;
    type: LayerType.FREE_DRAW;
  } & LayerConstructorOpts
): NonDeleted<FreeDrawLayer> => ({
  ...newLayerBase<FreeDrawLayer>(opts.type, opts),
  points: opts.points || [],
  pressures: [],
  simulatePressure: opts.simulatePressure,
  lastCommittedPoint: null
});

/**
 * Creates a new linear layer
 * @param opts Options
 */
export const newLinearLayer = (
  opts: {
    endArrowhead: Arrowhead | null;
    points?: LinearLayer["points"];
    startArrowhead: Arrowhead | null;
    type: LinearLayer["type"];
  } & LayerConstructorOpts
): NonDeleted<LinearLayer> => ({
  ...newLayerBase<LinearLayer>(opts.type, opts),
  points: opts.points || [],
  lastCommittedPoint: null,
  startBinding: null,
  endBinding: null,
  startArrowhead: opts.startArrowhead,
  endArrowhead: opts.endArrowhead
});

/**
 * Creates a new image layer
 * @param opts Options
 */
export const newImageLayer = (
  opts: {
    fileId?: ImageLayer["fileId"];
    scale?: ImageLayer["scale"];
    status?: ImageLayer["status"];
    type: LayerType.IMAGE;
  } & LayerConstructorOpts
): NonDeleted<ImageLayer> => ({
  ...newLayerBase<ImageLayer>(LayerType.IMAGE, opts),
  strokeColor: "transparent",
  status: opts.status ?? "pending",
  fileId: opts.fileId ?? null,
  scale: opts.scale ?? [1, 1]
});

/**
 * Deep clones a layer, only clones plain objects and arrays. Does not clone Date,
 * RegExp, Map, Set, typed arrays and other non-null objects
 * @see https://github.com/lukeed/klona
 * @param val Value
 * @param depth Clone deptch
 */
const deepCopyLayerImpl = (val: any, depth: number = 0): any => {
  // Only clone non-primitives
  if (val == null || typeof val !== "object") {
    return val;
  }

  const objectType = Object.prototype.toString.call(val);

  if (objectType === "[object Object]") {
    const tmp =
      typeof val.constructor === "function"
        ? Object.create(Object.getPrototypeOf(val))
        : {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        // Don't copy non-serializable objects like these caches. They'll be
        // populated when the layer is rendered.
        if (depth === 0 && (key === "shape" || key === "canvas")) {
          continue;
        }

        tmp[key] = deepCopyLayerImpl(val[key], depth + 1);
      }
    }
    return tmp;
  }

  if (Array.isArray(val)) {
    let k = val.length;
    const arr = new Array(k);

    while (k--) {
      arr[k] = deepCopyLayerImpl(val[k], depth + 1);
    }

    return arr;
  }

  // We're not cloning non-array and non-plain-object objects because we
  // don't support them on layers yet.
  if (process.env.NODE_ENV === "development") {
    if (
      objectType !== "[object Object]" &&
      objectType !== "[object Array]" &&
      objectType.startsWith("[object ")
    ) {
      console.warn(
        `deepCloneLayer: Unexpected object type ${objectType}. This value will not be cloned`
      );
    }
  }

  return val;
};

/**
 * Clones layer data structure. Does not regenerate id or any other value. The
 * purpose is to break object references for immutability reasons, whenever we want
 * to keep the original layer, but ensure it's not mutated.
 * @param val
 */
export const deepCopyLayer = <T extends Layer>(val: T): Mutable<T> =>
  deepCopyLayerImpl(val);

/**
 * Utility wrapper to generate a new id. In testing environment, it reuses the
 * old id with a postfix for test assertions
 * @param previousId Old ID, supply null if no previous ID exists
 */
const regenerateId = (previousId: string | null): string => {
  if (isTestEnv() && previousId) {
    let nextId = `${previousId}:copy`;

    // `window.h` may not be defined in some unit tests
    if (
      window.h?.app
        ?.getSceneLayersIncludingDeleted()
        .find(({ id }: { id: string }) => id === nextId)
    ) {
      nextId += ":copy";
    }

    return nextId;
  }

  return randomId();
};

/**
 * Duplicates a layer, often used in alt-drag operation
 * @param editingGroupId Current group being edited, new layer will inherit this group
 * and its parents
 * @param groupIdMapForOperation A Map that maps old group IDs to duplicated ones. If
 * we are duplicating multiple layers at once, share this map amongst all of them
 * @param layer Layer to duplicate
 * @param overrides Layer properties to override
 */
export const duplicateLayer = <TLayer extends Layer>(
  editingGroupId: EditorState["editingGroupId"],
  groupIdMapForOperation: Map<GroupId, GroupId>,
  layer: TLayer,
  overrides?: Partial<TLayer>
): Readonly<TLayer> => {
  let copy = deepCopyLayer(layer);

  copy.id = regenerateId(copy.id);
  copy.boundLayers = null;
  copy.updated = getUpdatedTimestamp();
  copy.seed = randomInteger();
  copy.groupIds = getNewGroupIdsForDuplication(
    copy.groupIds,
    editingGroupId,
    (groupId) => {
      if (!groupIdMapForOperation.has(groupId)) {
        groupIdMapForOperation.set(groupId, regenerateId(groupId));
      }

      return groupIdMapForOperation.get(groupId)!;
    }
  );

  if (overrides) {
    copy = Object.assign(copy, overrides);
  }

  return copy;
};

/**
 * Clones layers, regenerating their IDs (including bindings) are group IDs.
 * If bindings are missing from the layer's array, they are removed. Therefore,
 * the whole layer array is supplied
 * @param layers Layers
 * @param opts Options
 */
export const duplicateLayers = (
  layers: readonly Layer[],
  opts?: {
    randomizeSeed: boolean;
  }
): Layer[] => {
  const clonedLayers: Layer[] = [];
  const origLayersMap = arrayToMap(layers);

  // Used for migrating old ids to new ids
  const layerNewIdsMap = new Map<
    /* original */ Layer["id"],
    /* new */ Layer["id"]
  >();

  const maybeGetNewId = (id: Layer["id"]): string | null => {
    // If we've already migrated the layer id, return the new one directly
    if (layerNewIdsMap.has(id)) {
      return layerNewIdsMap.get(id)!;
    }

    // If we haven't migrated the layer id, but an old layer with the same
    // id exists, generate a new id for it and return it
    if (origLayersMap.has(id)) {
      const newId = regenerateId(id);
      layerNewIdsMap.set(id, newId);
      return newId;
    }

    // If old layer doesn't exist, return `null` to mark it for removal
    return null;
  };

  const groupNewIdsMap = new Map</* original */ GroupId, /* new */ GroupId>();

  for (const layer of layers) {
    const clonedLayer: Mutable<Layer> = deepCopyLayerImpl(layer);

    clonedLayer.id = maybeGetNewId(layer.id)!;

    if (opts?.randomizeSeed) {
      clonedLayer.seed = randomInteger();
      bumpUpdate(clonedLayer);
    }

    if (clonedLayer.groupIds) {
      clonedLayer.groupIds = clonedLayer.groupIds.map((groupId) => {
        if (!groupNewIdsMap.has(groupId)) {
          groupNewIdsMap.set(groupId, regenerateId(groupId));
        }

        return groupNewIdsMap.get(groupId)!;
      });
    }

    if ("containerId" in clonedLayer && clonedLayer.containerId) {
      clonedLayer.containerId = maybeGetNewId(clonedLayer.containerId);
    }

    if ("boundLayers" in clonedLayer && clonedLayer.boundLayers) {
      clonedLayer.boundLayers = clonedLayer.boundLayers.reduce(
        (acc: Mutable<NonNullable<Layer["boundLayers"]>>, binding) => {
          const newBindingId = maybeGetNewId(binding.id);

          if (newBindingId) {
            acc.push({ ...binding, id: newBindingId });
          }

          return acc;
        },
        []
      );
    }

    if ("endBinding" in clonedLayer && clonedLayer.endBinding) {
      const newEndBindingId = maybeGetNewId(clonedLayer.endBinding.layerId);
      clonedLayer.endBinding = newEndBindingId
        ? {
            ...clonedLayer.endBinding,
            layerId: newEndBindingId
          }
        : null;
    }

    if ("startBinding" in clonedLayer && clonedLayer.startBinding) {
      const newEndBindingId = maybeGetNewId(clonedLayer.startBinding.layerId);
      clonedLayer.startBinding = newEndBindingId
        ? {
            ...clonedLayer.startBinding,
            layerId: newEndBindingId
          }
        : null;
    }

    clonedLayers.push(clonedLayer);
  }

  return clonedLayers;
};
