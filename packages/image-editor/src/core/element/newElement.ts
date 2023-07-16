import { adjustXYWithRotation } from "../../lib/math/math";
import {
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_VERTICAL_ALIGN,
  VERTICAL_ALIGN
} from "../constants";
import { getNewGroupIdsForDuplication } from "../groups";
import {
  Arrowhead,
  ExcalidrawFrameLayer,
  ExcalidrawFreeDrawLayer,
  ExcalidrawGenericLayer,
  ExcalidrawImageLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextContainer,
  ExcalidrawTextLayer,
  FontFamilyValues,
  GroupId,
  NonDeleted,
  TextAlign,
  VerticalAlign
} from "../layer/types";
import { randomId, randomInteger } from "../random";
import { AppState } from "../types";
import { MarkOptional, Merge, Mutable } from "../utility-types";
import {
  arrayToMap,
  getFontString,
  getUpdatedTimestamp,
  isTestEnv
} from "../utils";
import { getLayerAbsoluteCoords } from ".";
import { getResizedLayerAbsoluteCoords } from "./bounds";
import { bumpUpdate, newLayerWith } from "./mutateLayer";
import {
  getBoundTextMaxWidth,
  getContainerLayer,
  getDefaultLineHeight,
  measureText,
  normalizeText,
  wrapText
} from "./textLayer";

type LayerConstructorOpts = MarkOptional<
  Omit<ExcalidrawGenericLayer, "id" | "type" | "isDeleted" | "updated">,
  | "width"
  | "height"
  | "angle"
  | "groupIds"
  | "frameId"
  | "boundLayers"
  | "seed"
  | "version"
  | "versionNonce"
  | "link"
  | "strokeStyle"
  | "fillStyle"
  | "strokeColor"
  | "backgroundColor"
  | "roughness"
  | "strokeWidth"
  | "roundness"
  | "locked"
  | "opacity"
>;

const _newLayerBase = <T extends ExcalidrawLayer>(
  type: T["type"],
  {
    x,
    y,
    strokeColor = DEFAULT_ELEMENT_PROPS.strokeColor,
    backgroundColor = DEFAULT_ELEMENT_PROPS.backgroundColor,
    fillStyle = DEFAULT_ELEMENT_PROPS.fillStyle,
    strokeWidth = DEFAULT_ELEMENT_PROPS.strokeWidth,
    strokeStyle = DEFAULT_ELEMENT_PROPS.strokeStyle,
    roughness = DEFAULT_ELEMENT_PROPS.roughness,
    opacity = DEFAULT_ELEMENT_PROPS.opacity,
    width = 0,
    height = 0,
    angle = 0,
    groupIds = [],
    frameId = null,
    roundness = null,
    boundLayers = null,
    link = null,
    locked = DEFAULT_ELEMENT_PROPS.locked,
    ...rest
  }: LayerConstructorOpts & Omit<Partial<ExcalidrawGenericLayer>, "type">
) => {
  // assign type to guard against excess properties
  const layer: Merge<ExcalidrawGenericLayer, { type: T["type"] }> = {
    id: rest.id || randomId(),
    type,
    x,
    y,
    width,
    height,
    angle,
    strokeColor,
    backgroundColor,
    fillStyle,
    strokeWidth,
    strokeStyle,
    roughness,
    opacity,
    groupIds,
    frameId,
    roundness,
    seed: rest.seed ?? randomInteger(),
    version: rest.version || 1,
    versionNonce: rest.versionNonce ?? 0,
    isDeleted: false as false,
    boundLayers,
    updated: getUpdatedTimestamp(),
    link,
    locked
  };
  return layer;
};

export const newLayer = (
  opts: {
    type: ExcalidrawGenericLayer["type"];
  } & LayerConstructorOpts
): NonDeleted<ExcalidrawGenericLayer> =>
  _newLayerBase<ExcalidrawGenericLayer>(opts.type, opts);

export const newFrameLayer = (
  opts: LayerConstructorOpts
): NonDeleted<ExcalidrawFrameLayer> => {
  const frameLayer = newLayerWith(
    {
      ..._newLayerBase<ExcalidrawFrameLayer>("frame", opts),
      type: "frame",
      name: null
    },
    {}
  );

  return frameLayer;
};

/** computes layer x/y offset based on textAlign/verticalAlign */
const getTextLayerPositionOffsets = (
  opts: {
    textAlign: ExcalidrawTextLayer["textAlign"];
    verticalAlign: ExcalidrawTextLayer["verticalAlign"];
  },
  metrics: {
    height: number;
    width: number;
  }
) => ({
  x:
    opts.textAlign === "center"
      ? metrics.width / 2
      : opts.textAlign === "right"
      ? metrics.width
      : 0,
  y: opts.verticalAlign === "middle" ? metrics.height / 2 : 0
});

export const newTextLayer = (
  opts: {
    containerId?: ExcalidrawTextContainer["id"];
    fontFamily?: FontFamilyValues;
    fontSize?: number;
    isFrameName?: boolean;
    lineHeight?: ExcalidrawTextLayer["lineHeight"];
    strokeWidth?: ExcalidrawTextLayer["strokeWidth"];
    text: string;
    textAlign?: TextAlign;
    verticalAlign?: VerticalAlign;
  } & LayerConstructorOpts
): NonDeleted<ExcalidrawTextLayer> => {
  const fontFamily = opts.fontFamily || DEFAULT_FONT_FAMILY;
  const fontSize = opts.fontSize || DEFAULT_FONT_SIZE;
  const lineHeight = opts.lineHeight || getDefaultLineHeight(fontFamily);
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

  const textLayer = newLayerWith(
    {
      ..._newLayerBase<ExcalidrawTextLayer>("text", opts),
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
      lineHeight,
      isFrameName: opts.isFrameName || false
    },
    {}
  );
  return textLayer;
};

const getAdjustedDimensions = (
  layer: ExcalidrawTextLayer,
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
    textAlign === "center" &&
    verticalAlign === VERTICAL_ALIGN.MIDDLE &&
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
        e: textAlign === "center" || textAlign === "left",
        w: textAlign === "center" || textAlign === "right"
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

export const refreshTextDimensions = (
  textLayer: ExcalidrawTextLayer,
  text = textLayer.text
) => {
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

export const updateTextLayer = (
  textLayer: ExcalidrawTextLayer,
  {
    text,
    isDeleted,
    originalText
  }: {
    isDeleted?: boolean;
    originalText: string;
    text: string;
  }
): ExcalidrawTextLayer =>
  newLayerWith(textLayer, {
    originalText,
    isDeleted: isDeleted ?? textLayer.isDeleted,
    ...refreshTextDimensions(textLayer, originalText)
  });

export const newFreeDrawLayer = (
  opts: {
    points?: ExcalidrawFreeDrawLayer["points"];
    simulatePressure: boolean;
    type: "freedraw";
  } & LayerConstructorOpts
): NonDeleted<ExcalidrawFreeDrawLayer> => ({
  ..._newLayerBase<ExcalidrawFreeDrawLayer>(opts.type, opts),
  points: opts.points || [],
  pressures: [],
  simulatePressure: opts.simulatePressure,
  lastCommittedPoint: null
});

export const newLinearLayer = (
  opts: {
    endArrowhead: Arrowhead | null;
    points?: ExcalidrawLinearLayer["points"];
    startArrowhead: Arrowhead | null;
    type: ExcalidrawLinearLayer["type"];
  } & LayerConstructorOpts
): NonDeleted<ExcalidrawLinearLayer> => ({
  ..._newLayerBase<ExcalidrawLinearLayer>(opts.type, opts),
  points: opts.points || [],
  lastCommittedPoint: null,
  startBinding: null,
  endBinding: null,
  startArrowhead: opts.startArrowhead,
  endArrowhead: opts.endArrowhead
});

export const newImageLayer = (
  opts: {
    fileId?: ExcalidrawImageLayer["fileId"];
    scale?: ExcalidrawImageLayer["scale"];
    status?: ExcalidrawImageLayer["status"];
    type: ExcalidrawImageLayer["type"];
  } & LayerConstructorOpts
): NonDeleted<ExcalidrawImageLayer> => ({
  ..._newLayerBase<ExcalidrawImageLayer>("image", opts),
  // in the future we'll support changing stroke color for some SVG layers,
  // and `transparent` will likely mean "use original colors of the image"
  strokeColor: "transparent",
  status: opts.status ?? "pending",
  fileId: opts.fileId ?? null,
  scale: opts.scale ?? [1, 1]
});

// Simplified deep clone for the purpose of cloning ExcalidrawLayer.
//
// Only clones plain objects and arrays. Doesn't clone Date, RegExp, Map, Set,
// Typed arrays and other non-null objects.
//
// Adapted from https://github.com/lukeed/klona
//
// The reason for `deepCopyLayer()` wrapper is type safety (only allow
// passing ExcalidrawLayer as the top-level argument).
const deepCopyLayerImpl = (val: any, depth: number = 0) => {
  // only clone non-primitives
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
      if (val.hasOwnProperty(key)) {
        // don't copy non-serializable objects like these caches. They'll be
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

  // we're not cloning non-array & non-plain-object objects because we
  // don't support them on excalidraw layers yet. If we do, we need to make
  // sure we start cloning them, so let's warn about it.
  if (process.env.NODE_ENV === "development") {
    if (
      objectType !== "[object Object]" &&
      objectType !== "[object Array]" &&
      objectType.startsWith("[object ")
    ) {
      console.warn(
        `_deepCloneLayer: unexpected object type ${objectType}. This value will not be cloned!`
      );
    }
  }

  return val;
};

/**
 * Clones ExcalidrawLayer data structure. Does not regenerate id, nonce, or
 * any value. The purpose is to to break object references for immutability
 * reasons, whenever we want to keep the original layer, but ensure it's not
 * mutated.
 *
 * Only clones plain objects and arrays. Doesn't clone Date, RegExp, Map, Set,
 * Typed arrays and other non-null objects.
 */
export const deepCopyLayer = <T extends ExcalidrawLayer>(val: T): Mutable<T> =>
  deepCopyLayerImpl(val);

/**
 * utility wrapper to generate new id. In test env it reuses the old + postfix
 * for test assertions.
 */
const regenerateId = (
  /** supply null if no previous id exists */
  previousId: string | null
) => {
  if (isTestEnv() && previousId) {
    let nextId = `${previousId}_copy`;
    // `window.h` may not be defined in some unit tests
    if (
      window.h?.app
        ?.getSceneLayersIncludingDeleted()
        .find((el) => el.id === nextId)
    ) {
      nextId += "_copy";
    }
    return nextId;
  }
  return randomId();
};

/**
 * Duplicate an layer, often used in the alt-drag operation.
 * Note that this method has gotten a bit complicated since the
 * introduction of gruoping/ungrouping layers.
 * @param editingGroupId The current group being edited. The new
 *                       layer will inherit this group and its
 *                       parents.
 * @param groupIdMapForOperation A Map that maps old group IDs to
 *                               duplicated ones. If you are duplicating
 *                               multiple layers at once, share this map
 *                               amongst all of them
 * @param layer Layer to duplicate
 * @param overrides Any layer properties to override
 */
export const duplicateLayer = <TLayer extends ExcalidrawLayer>(
  editingGroupId: AppState["editingGroupId"],
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
 * Clones layers, regenerating their ids (including bindings) and group ids.
 *
 * If bindings don't exist in the layers array, they are removed. Therefore,
 * it's advised to supply the whole layers array, or sets of layers that
 * are encapsulated (such as library items), if the purpose is to retain
 * bindings to the cloned layers intact.
 *
 * NOTE by default does not randomize or regenerate anything except the id.
 */
export const duplicateLayers = (
  layers: readonly ExcalidrawLayer[],
  opts?: {
    /** NOTE also updates version flags and `updated` */
    randomizeSeed: boolean;
  }
) => {
  const clonedLayers: ExcalidrawLayer[] = [];

  const origLayersMap = arrayToMap(layers);

  // used for for migrating old ids to new ids
  const layerNewIdsMap = new Map<
    /* orig */ ExcalidrawLayer["id"],
    /* new */ ExcalidrawLayer["id"]
  >();

  const maybeGetNewId = (id: ExcalidrawLayer["id"]) => {
    // if we've already migrated the layer id, return the new one directly
    if (layerNewIdsMap.has(id)) {
      return layerNewIdsMap.get(id)!;
    }
    // if we haven't migrated the layer id, but an old layer with the same
    // id exists, generate a new id for it and return it
    if (origLayersMap.has(id)) {
      const newId = regenerateId(id);
      layerNewIdsMap.set(id, newId);
      return newId;
    }
    // if old layer doesn't exist, return null to mark it for removal
    return null;
  };

  const groupNewIdsMap = new Map</* orig */ GroupId, /* new */ GroupId>();

  for (const layer of layers) {
    const clonedLayer: Mutable<ExcalidrawLayer> = deepCopyLayerImpl(layer);

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
      const newContainerId = maybeGetNewId(clonedLayer.containerId);
      clonedLayer.containerId = newContainerId;
    }

    if ("boundLayers" in clonedLayer && clonedLayer.boundLayers) {
      clonedLayer.boundLayers = clonedLayer.boundLayers.reduce(
        (
          acc: Mutable<NonNullable<ExcalidrawLayer["boundLayers"]>>,
          binding
        ) => {
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

    if (clonedLayer.frameId) {
      clonedLayer.frameId = maybeGetNewId(clonedLayer.frameId);
    }

    clonedLayers.push(clonedLayer);
  }

  return clonedLayers;
};
