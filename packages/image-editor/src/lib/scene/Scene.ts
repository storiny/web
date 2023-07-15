import {
  getNonDeletedFrames,
  getNonDeletedLayers,
  isNonDeletedLayer
} from "../../core/layer";
import { LinearLayerEditor } from "../../core/layer/linearLayerEditor";
import { isFrameLayer } from "../../core/layer/typeChecks";
import {
  ExcalidrawFrameLayer,
  ExcalidrawLayer,
  NonDeleted,
  NonDeletedExcalidrawLayer
} from "../../core/layer/types";

type LayerIdKey = InstanceType<typeof LinearLayerEditor>["layerId"];
type LayerKey = ExcalidrawLayer | LayerIdKey;

type SceneStateCallback = () => void;
type SceneStateCallbackRemover = () => void;

// ideally this would be a branded type but it'd be insanely hard to work with
// in our codebase
export type ExcalidrawLayersIncludingDeleted = readonly ExcalidrawLayer[];

const isIdKey = (layerKey: LayerKey): layerKey is LayerIdKey => {
  if (typeof layerKey === "string") {
    return true;
  }
  return false;
};

class Scene {
  // ---------------------------------------------------------------------------
  // static methods/props
  // ---------------------------------------------------------------------------

  private static sceneMapByLayer = new WeakMap<ExcalidrawLayer, Scene>();
  private static sceneMapById = new Map<string, Scene>();

  static mapLayerToScene(layerKey: LayerKey, scene: Scene) {
    if (isIdKey(layerKey)) {
      // for cases where we don't have access to the layer object
      // (e.g. restore serialized appState with id references)
      this.sceneMapById.set(layerKey, scene);
    } else {
      this.sceneMapByLayer.set(layerKey, scene);
      // if mapping layer objects, also cache the id string when later
      // looking up by id alone
      this.sceneMapById.set(layerKey.id, scene);
    }
  }

  static getScene(layerKey: LayerKey): Scene | null {
    if (isIdKey(layerKey)) {
      return this.sceneMapById.get(layerKey) || null;
    }
    return this.sceneMapByLayer.get(layerKey) || null;
  }

  // ---------------------------------------------------------------------------
  // instance methods/props
  // ---------------------------------------------------------------------------

  private callbacks: Set<SceneStateCallback> = new Set();

  private nonDeletedLayers: readonly NonDeletedExcalidrawLayer[] = [];
  private layers: readonly ExcalidrawLayer[] = [];
  private nonDeletedFrames: readonly NonDeleted<ExcalidrawFrameLayer>[] = [];
  private frames: readonly ExcalidrawFrameLayer[] = [];
  private layersMap = new Map<ExcalidrawLayer["id"], ExcalidrawLayer>();

  getLayersIncludingDeleted() {
    return this.layers;
  }

  getNonDeletedLayers(): readonly NonDeletedExcalidrawLayer[] {
    return this.nonDeletedLayers;
  }

  getFramesIncludingDeleted() {
    return this.frames;
  }

  getNonDeletedFrames(): readonly NonDeleted<ExcalidrawFrameLayer>[] {
    return this.nonDeletedFrames;
  }

  getLayer<T extends ExcalidrawLayer>(id: T["id"]): T | null {
    return (this.layersMap.get(id) as T | undefined) || null;
  }

  getNonDeletedLayer(
    id: ExcalidrawLayer["id"]
  ): NonDeleted<ExcalidrawLayer> | null {
    const layer = this.getLayer(id);
    if (layer && isNonDeletedLayer(layer)) {
      return layer;
    }
    return null;
  }

  /**
   * A utility method to help with updating all scene layers, with the added
   * performance optimization of not renewing the array if no change is made.
   *
   * Maps all current excalidraw layers, invoking the callback for each
   * layer. The callback should either return a new mapped layer, or the
   * original layer if no changes are made. If no changes are made to any
   * layer, this results in a no-op. Otherwise, the newly mapped layers
   * are set as the next scene's layers.
   *
   * @returns whether a change was made
   */
  mapLayers(iteratee: (layer: ExcalidrawLayer) => ExcalidrawLayer): boolean {
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

  replaceAllLayers(nextLayers: readonly ExcalidrawLayer[]) {
    this.layers = nextLayers;
    const nextFrames: ExcalidrawFrameLayer[] = [];
    this.layersMap.clear();
    nextLayers.forEach((layer) => {
      if (isFrameLayer(layer)) {
        nextFrames.push(layer);
      }
      this.layersMap.set(layer.id, layer);
      Scene.mapLayerToScene(layer, this);
    });
    this.nonDeletedLayers = getNonDeletedLayers(this.layers);
    this.frames = nextFrames;
    this.nonDeletedFrames = getNonDeletedFrames(this.frames);

    this.informMutation();
  }

  informMutation() {
    for (const callback of Array.from(this.callbacks)) {
      callback();
    }
  }

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

  destroy() {
    Scene.sceneMapById.forEach((scene, layerKey) => {
      if (scene === this) {
        Scene.sceneMapById.delete(layerKey);
      }
    });
    // done not for memory leaks, but to guard against possible late fires
    // (I guess?)
    this.callbacks.clear();
  }

  insertLayerAtIndex(layer: ExcalidrawLayer, index: number) {
    if (!Number.isFinite(index) || index < 0) {
      throw new Error("insertLayerAtIndex can only be called with index >= 0");
    }
    const nextLayers = [
      ...this.layers.slice(0, index),
      layer,
      ...this.layers.slice(index)
    ];
    this.replaceAllLayers(nextLayers);
  }

  insertLayersAtIndex(layers: ExcalidrawLayer[], index: number) {
    if (!Number.isFinite(index) || index < 0) {
      throw new Error("insertLayerAtIndex can only be called with index >= 0");
    }
    const nextLayers = [
      ...this.layers.slice(0, index),
      ...layers,
      ...this.layers.slice(index)
    ];

    this.replaceAllLayers(nextLayers);
  }

  addNewLayer = (layer: ExcalidrawLayer) => {
    if (layer.frameId) {
      this.insertLayerAtIndex(layer, this.getLayerIndex(layer.frameId));
    } else {
      this.replaceAllLayers([...this.layers, layer]);
    }
  };

  getLayerIndex(layerId: string) {
    return this.layers.findIndex((layer) => layer.id === layerId);
  }
}

export default Scene;
