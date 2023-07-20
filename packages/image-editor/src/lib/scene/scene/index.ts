import { Layer, NonDeleted, NonDeletedLayer } from "../../../types";
import {
  getNonDeletedLayers,
  isNonDeletedLayer,
  LinearLayerEditor
} from "../../layer";

type LayerIdKey = InstanceType<typeof LinearLayerEditor>["layerId"];
type LayerKey = Layer | LayerIdKey;
type SceneStateCallback = () => void;
type SceneStateCallbackRemover = () => void;

export type LayersIncludingDeleted = readonly Layer[];

const hashSelectionOpts = (
  opts: Parameters<InstanceType<typeof Scene>["getSelectedElements"]>[0]
): string => {
  const keys = ["includeBoundTextElement", "includeElementsInFrames"] as const;

  type HashableKeys = Omit<typeof opts, "selectedElementIds" | "elements">;

  // just to ensure we're hashing all expected keys
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type _ = Assert<
    SameType<
      Required<HashableKeys>,
      Pick<Required<HashableKeys>, (typeof keys)[number]>
    >
  >;

  let hash = "";
  for (const key of keys) {
    hash += `${key}:${opts[key] ? "1" : "0"}`;
  }
  return hash;
};

/**
 * Predicate function for determining valid layer keys
 * @param layerKey Layer key
 */
const isIdKey = (layerKey: LayerKey): layerKey is LayerIdKey =>
  typeof layerKey === "string";

export class Scene {
  private static sceneMapByLayer = new WeakMap<Layer, Scene>();
  private static sceneMapById = new Map<string, Scene>();
  private callbacks: Set<SceneStateCallback> = new Set();
  private nonDeletedLayers: readonly NonDeletedLayer[] = [];
  private layers: readonly Layer[] = [];
  private layersMap = new Map<Layer["id"], Layer>();

  /**
   * Maps layer to scene
   * @param layerKey Layer key
   * @param scene Scene
   */
  static mapLayerToScene(layerKey: LayerKey, scene: Scene): void {
    if (isIdKey(layerKey)) {
      // For cases where we don't have access to the layer object
      // (e.g., restore serialized editorState with id references)
      this.sceneMapById.set(layerKey, scene);
    } else {
      this.sceneMapByLayer.set(layerKey, scene);
      // If mapping layer objects, also cache the id string when later
      // looking up by id alone
      this.sceneMapById.set(layerKey.id, scene);
    }
  }

  /**
   * Returns scene
   * @param layerKey Layer key
   */
  static getScene(layerKey: LayerKey): Scene | null {
    if (isIdKey(layerKey)) {
      return this.sceneMapById.get(layerKey) || null;
    }

    return this.sceneMapByLayer.get(layerKey) || null;
  }

  getSelectedLayers(opts: {
    /**
     * for specific cases where you need to use elements not from current
     * scene state. This in effect will likely result in cache-miss, and
     * the cache won't be updated in this case.
     */
    elements?: readonly Layer[];
    // selection-related options
    includeBoundTextElement?: boolean;
    includeElementsInFrames?: boolean;
    // NOTE can be ommitted by making Scene constructor require App instance
    selectedElementIds: AppState["selectedElementIds"];
  }): NonDeleted<ExcalidrawElement>[] {
    const hash = hashSelectionOpts(opts);

    const elements = opts?.elements || this.nonDeletedElements;
    if (
      this.selectedElementsCache.elements === elements &&
      this.selectedElementsCache.selectedElementIds === opts.selectedElementIds
    ) {
      const cached = this.selectedElementsCache.cache.get(hash);
      if (cached) {
        return cached;
      }
    } else if (opts?.elements == null) {
      // if we're operating on latest scene elements and the cache is not
      //  storing the latest elements, clear the cache
      this.selectedElementsCache.cache.clear();
    }

    const selectedElements = getSelectedElements(
      elements,
      { selectedElementIds: opts.selectedElementIds },
      opts
    );

    // cache only if we're not using custom elements
    if (opts?.elements == null) {
      this.selectedElementsCache.selectedElementIds = opts.selectedElementIds;
      this.selectedElementsCache.elements = this.nonDeletedElements;
      this.selectedElementsCache.cache.set(hash, selectedElements);
    }

    return selectedElements;
  }

  /**
   * Returns all the layers (including deleted layers)
   */
  getLayersIncludingDeleted(): readonly Layer[] {
    return this.layers;
  }

  /**
   * Returns all the non-deleted layers
   */
  getNonDeletedLayers(): readonly NonDeletedLayer[] {
    return this.nonDeletedLayers;
  }

  /**
   * Returns a single layer by ID
   * @param id Layer ID
   */
  getLayer<T extends Layer>(id: T["id"]): T | null {
    return (this.layersMap.get(id) as T | undefined) || null;
  }

  /**
   * Returns a single non-deleted layer by ID
   * @param id Layer ID
   */
  getNonDeletedLayer(id: Layer["id"]): NonDeleted<Layer> | null {
    const layer = this.getLayer(id);

    if (layer && isNonDeletedLayer(layer)) {
      return layer;
    }

    return null;
  }

  /**
   * Utility method to help with updating all the scene layers, with the added
   * performance optimization of not renewing the array if no change in made.
   *
   * Maps all current layers, invoking the callback for each layer. The callback
   * should either return a new mapped layer, or the original layer if no changes
   * are made. If no changes are made to any layer, this results in a no-op. Otherwise,
   * the newly mapped layers are set as the next scene's layers
   * @param iteratee Callback function
   */
  mapLayers(iteratee: (layer: Layer) => Layer): boolean {
    let didChange = false;

    const newLayers = this.layers.map((layer) => {
      const nextLayer = iteratee(layer);

      if (nextLayer !== layer) {
        didChange = true;
      }

      return nextLayer;
    });

    if (didChange) {
      this.replaceAllLayers(newLayers);
    }

    return didChange;
  }

  /**
   * Replaces current layers with new layers
   * @param nextLayers New layers
   */
  replaceAllLayers(nextLayers: readonly Layer[]): void {
    this.layers = nextLayers;
    this.layersMap.clear();

    nextLayers.forEach((layer) => {
      this.layersMap.set(layer.id, layer);
      Scene.mapLayerToScene(layer, this);
    });

    this.nonDeletedLayers = getNonDeletedLayers(this.layers);
    this.informMutation();
  }

  /**
   * Informs layer mutation
   */
  informMutation(): void {
    for (const callback of Array.from(this.callbacks)) {
      callback();
    }
  }

  /**
   * Attaches a scene state callback
   * @param cb Callback to add
   */
  addCallback(cb: SceneStateCallback): SceneStateCallbackRemover {
    if (this.callbacks.has(cb)) {
      throw new Error();
    }

    this.callbacks.add(cb);

    return () => {
      if (!this.callbacks.has(cb)) {
        throw new Error();
      }

      this.callbacks.delete(cb);
    };
  }

  /**
   * Destroys the instance and clears all the scene maps
   */
  destroy(): void {
    Scene.sceneMapById.forEach((scene, layerKey) => {
      if (scene === this) {
        Scene.sceneMapById.delete(layerKey);
      }
    });

    // Guard against possible late fires
    this.callbacks.clear();
  }

  /**
   * Inserts a layer at the specified index
   * @param layer Layer to insert
   * @param index Index at which the layer is desired to be inserted
   */
  insertLayerAtIndex(layer: Layer, index: number): void {
    if (!Number.isFinite(index) || index < 0) {
      throw new Error("insertLayerAtIndex: Can only be called with index >= 0");
    }

    const nextLayers = [
      ...this.layers.slice(0, index),
      layer,
      ...this.layers.slice(index)
    ];

    this.replaceAllLayers(nextLayers);
  }

  /**
   * Inserts multiple layers at the specified index
   * @param layers Layers to insert
   * @param index Index at which the layers are desired to be inserted
   */
  insertLayersAtIndex(layers: Layer[], index: number): void {
    if (!Number.isFinite(index) || index < 0) {
      throw new Error(
        "insertLayersAtIndex: can only be called with index >= 0"
      );
    }

    const nextLayers = [
      ...this.layers.slice(0, index),
      ...layers,
      ...this.layers.slice(index)
    ];

    this.replaceAllLayers(nextLayers);
  }

  /**
   * Adds a new layer to the end
   * @param layer Layer to add
   */
  addNewLayer(layer: Layer): void {
    this.replaceAllLayers([...this.layers, layer]);
  }

  /**
   * Returns the index of a layer by its ID
   * @param layerId Id of the layer
   */
  getLayerIndex(layerId: string): number {
    return this.layers.findIndex(({ id }) => id === layerId);
  }
}
