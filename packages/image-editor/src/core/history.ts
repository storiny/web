import { deepCopyLayer } from "./layer/newLayer";
import { isLinearLayer } from "./layer/typeChecks";
import { ExcalidrawLayer } from "./layer/types";
import { AppState } from "./types";
import { Mutable } from "./utility-types";

export interface HistoryEntry {
  appState: ReturnType<typeof clearAppStatePropertiesForHistory>;
  layers: ExcalidrawLayer[];
}

interface DehydratedExcalidrawLayer {
  id: string;
  versionNonce: number;
}

interface DehydratedHistoryEntry {
  appState: string;
  layers: DehydratedExcalidrawLayer[];
}

const clearAppStatePropertiesForHistory = (appState: AppState) => ({
  selectedLayerIds: appState.selectedLayerIds,
  selectedGroupIds: appState.selectedGroupIds,
  viewBackgroundColor: appState.viewBackgroundColor,
  editingLinearLayer: appState.editingLinearLayer,
  editingGroupId: appState.editingGroupId,
  name: appState.name
});

class History {
  private layerCache = new Map<string, Map<number, ExcalidrawLayer>>();
  private recording: boolean = true;
  private stateHistory: DehydratedHistoryEntry[] = [];
  private redoStack: DehydratedHistoryEntry[] = [];
  private lastEntry: HistoryEntry | null = null;

  private hydrateHistoryEntry({
    appState,
    layers
  }: DehydratedHistoryEntry): HistoryEntry {
    return {
      appState: JSON.parse(appState),
      layers: layers.map((dehydratedExcalidrawLayer) => {
        const layer = this.layerCache
          .get(dehydratedExcalidrawLayer.id)
          ?.get(dehydratedExcalidrawLayer.versionNonce);
        if (!layer) {
          throw new Error(
            `Layer not found: ${dehydratedExcalidrawLayer.id}:${dehydratedExcalidrawLayer.versionNonce}`
          );
        }
        return layer;
      })
    };
  }

  private dehydrateHistoryEntry({
    appState,
    layers
  }: HistoryEntry): DehydratedHistoryEntry {
    return {
      appState: JSON.stringify(appState),
      layers: layers.map((layer: ExcalidrawLayer) => {
        if (!this.layerCache.has(layer.id)) {
          this.layerCache.set(layer.id, new Map());
        }
        const versions = this.layerCache.get(layer.id)!;
        if (!versions.has(layer.versionNonce)) {
          versions.set(layer.versionNonce, deepCopyLayer(layer));
        }
        return {
          id: layer.id,
          versionNonce: layer.versionNonce
        };
      })
    };
  }

  getSnapshotForTest() {
    return {
      recording: this.recording,
      stateHistory: this.stateHistory.map((dehydratedHistoryEntry) =>
        this.hydrateHistoryEntry(dehydratedHistoryEntry)
      ),
      redoStack: this.redoStack.map((dehydratedHistoryEntry) =>
        this.hydrateHistoryEntry(dehydratedHistoryEntry)
      )
    };
  }

  clear() {
    this.stateHistory.length = 0;
    this.redoStack.length = 0;
    this.lastEntry = null;
    this.layerCache.clear();
  }

  private generateEntry = (
    appState: AppState,
    layers: readonly ExcalidrawLayer[]
  ): DehydratedHistoryEntry =>
    this.dehydrateHistoryEntry({
      appState: clearAppStatePropertiesForHistory(appState),
      layers: layers.reduce((layers, layer) => {
        if (
          isLinearLayer(layer) &&
          appState.multiLayer &&
          appState.multiLayer.id === layer.id
        ) {
          // don't store multi-point arrow if still has only one point
          if (
            appState.multiLayer &&
            appState.multiLayer.id === layer.id &&
            layer.points.length < 2
          ) {
            return layers;
          }

          layers.push({
            ...layer,
            // don't store last point if not committed
            points:
              layer.lastCommittedPoint !== layer.points[layer.points.length - 1]
                ? layer.points.slice(0, -1)
                : layer.points
          });
        } else {
          layers.push(layer);
        }
        return layers;
      }, [] as Mutable<typeof layers>)
    });

  shouldCreateEntry(nextEntry: HistoryEntry): boolean {
    const { lastEntry } = this;

    if (!lastEntry) {
      return true;
    }

    if (nextEntry.layers.length !== lastEntry.layers.length) {
      return true;
    }

    // loop from right to left as changes are likelier to happen on new layers
    for (let i = nextEntry.layers.length - 1; i > -1; i--) {
      const prev = nextEntry.layers[i];
      const next = lastEntry.layers[i];
      if (
        !prev ||
        !next ||
        prev.id !== next.id ||
        prev.versionNonce !== next.versionNonce
      ) {
        return true;
      }
    }

    // note: this is safe because entry's appState is guaranteed no excess props
    let key: keyof typeof nextEntry.appState;
    for (key in nextEntry.appState) {
      if (key === "editingLinearLayer") {
        if (
          nextEntry.appState[key]?.layerId === lastEntry.appState[key]?.layerId
        ) {
          continue;
        }
      }
      if (key === "selectedLayerIds" || key === "selectedGroupIds") {
        continue;
      }
      if (nextEntry.appState[key] !== lastEntry.appState[key]) {
        return true;
      }
    }

    return false;
  }

  pushEntry(appState: AppState, layers: readonly ExcalidrawLayer[]) {
    const newEntryDehydrated = this.generateEntry(appState, layers);
    const newEntry: HistoryEntry = this.hydrateHistoryEntry(newEntryDehydrated);

    if (newEntry) {
      if (!this.shouldCreateEntry(newEntry)) {
        return;
      }

      this.stateHistory.push(newEntryDehydrated);
      this.lastEntry = newEntry;
      // As a new entry was pushed, we invalidate the redo stack
      this.clearRedoStack();
    }
  }

  clearRedoStack() {
    this.redoStack.splice(0, this.redoStack.length);
  }

  redoOnce(): HistoryEntry | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const entryToRestore = this.redoStack.pop();

    if (entryToRestore !== undefined) {
      this.stateHistory.push(entryToRestore);
      return this.hydrateHistoryEntry(entryToRestore);
    }

    return null;
  }

  undoOnce(): HistoryEntry | null {
    if (this.stateHistory.length === 1) {
      return null;
    }

    const currentEntry = this.stateHistory.pop();

    const entryToRestore = this.stateHistory[this.stateHistory.length - 1];

    if (currentEntry !== undefined) {
      this.redoStack.push(currentEntry);
      return this.hydrateHistoryEntry(entryToRestore);
    }

    return null;
  }

  /**
   * Updates history's `lastEntry` to latest app state. This is necessary
   *  when doing undo/redo which itself doesn't commit to history, but updates
   *  app state in a way that would break `shouldCreateEntry` which relies on
   *  `lastEntry` to reflect last comittable history state.
   * We can't update `lastEntry` from within history when calling undo/redo
   *  because the action potentially mutates appState/layers before storing
   *  it.
   */
  setCurrentState(appState: AppState, layers: readonly ExcalidrawLayer[]) {
    this.lastEntry = this.hydrateHistoryEntry(
      this.generateEntry(appState, layers)
    );
  }

  // Suspicious that this is called so many places. Seems error-prone.
  resumeRecording() {
    this.recording = true;
  }

  record(state: AppState, layers: readonly ExcalidrawLayer[]) {
    if (this.recording) {
      this.pushEntry(state, layers);
      this.recording = false;
    }
  }
}

export default History;
