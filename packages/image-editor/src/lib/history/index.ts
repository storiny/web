import { Mutable } from "@storiny/types";

import { EditorState, Layer } from "../../types";
import { deepCopyLayer, isLinearLayer } from "../layer";

export interface HistoryEntry {
  editorState: ReturnType<typeof clearEditorStatePropertiesForHistory>;
  layers: Layer[];
}

interface DehydratedLayer {
  id: string;
}

interface DehydratedHistoryEntry {
  editorState: string;
  layers: DehydratedLayer[];
}

/**
 * Cleanup editor state props for history
 * @param editorState Editor state
 */
const clearEditorStatePropertiesForHistory = (
  editorState: EditorState
): Pick<
  EditorState,
  | "selectedLayerIds"
  | "selectedGroupIds"
  | "viewBackgroundColor"
  | "editingLinearLayer"
  | "editingGroupId"
  | "name"
> => ({
  selectedLayerIds: editorState.selectedLayerIds,
  selectedGroupIds: editorState.selectedGroupIds,
  viewBackgroundColor: editorState.viewBackgroundColor,
  editingLinearLayer: editorState.editingLinearLayer,
  editingGroupId: editorState.editingGroupId,
  name: editorState.name
});

export class History {
  private layerCache = new Map<string, Layer>();
  private recording: boolean = true;
  private stateHistory: DehydratedHistoryEntry[] = [];
  private redoStack: DehydratedHistoryEntry[] = [];
  private lastEntry: HistoryEntry | null = null;

  /**
   * Hudrates history entry
   * @param editorState Editor state
   * @param layers Layers
   * @private
   */
  private hydrateHistoryEntry({
    editorState,
    layers
  }: DehydratedHistoryEntry): HistoryEntry {
    return {
      editorState: JSON.parse(editorState),
      layers: layers.map((dehydratedLayer) => {
        const layer = this.layerCache.get(dehydratedLayer.id);

        if (!layer) {
          throw new Error(`Layer not found: ${dehydratedLayer.id}`);
        }

        return layer;
      })
    };
  }

  /**
   * Dehydrates history entry
   * @param editorState Editor state
   * @param layers Layers
   * @private
   */
  private dehydrateHistoryEntry({
    editorState,
    layers
  }: HistoryEntry): DehydratedHistoryEntry {
    return {
      editorState: JSON.stringify(editorState),
      layers: layers.map((layer: Layer) => {
        if (!this.layerCache.has(layer.id)) {
          this.layerCache.set(layer.id, deepCopyLayer(layer));
        }

        return {
          id: layer.id
        };
      })
    };
  }

  /**
   * Returns snapshot for testing
   */
  getSnapshotForTest(): {
    recording: boolean;
    redoStack: HistoryEntry[];
    stateHistory: HistoryEntry[];
  } {
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

  /**
   * Resets history
   */
  clear(): void {
    this.stateHistory.length = 0;
    this.redoStack.length = 0;
    this.lastEntry = null;
    this.layerCache.clear();
  }

  /**
   * Generates a new entry
   * @param editorState Editor state
   * @param layers Layers
   */
  private generateEntry = (
    editorState: EditorState,
    layers: readonly Layer[]
  ): DehydratedHistoryEntry =>
    this.dehydrateHistoryEntry({
      editorState: clearEditorStatePropertiesForHistory(editorState),
      layers: layers.reduce((layers, layer) => {
        if (
          isLinearLayer(layer) &&
          editorState.multiLayer &&
          editorState.multiLayer.id === layer.id
        ) {
          // Do not store multipoint arrow if it still has only one point
          if (
            editorState.multiLayer &&
            editorState.multiLayer.id === layer.id &&
            layer.points.length < 2
          ) {
            return layers;
          }

          layers.push({
            ...layer,
            // Do not store the last point if not committed
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

  /**
   * Predicate method for determining whether to create an entry
   * @param nextEntry New entry
   */
  shouldCreateEntry(nextEntry: HistoryEntry): boolean {
    const { lastEntry } = this;

    if (!lastEntry) {
      return true;
    }

    if (nextEntry.layers.length !== lastEntry.layers.length) {
      return true;
    }

    // Loop from right to left as changes are likelier to happen on new layers
    for (let i = nextEntry.layers.length - 1; i > -1; i--) {
      const prev = nextEntry.layers[i];
      const next = lastEntry.layers[i];

      if (!prev || !next || prev.id !== next.id) {
        return true;
      }
    }

    // Note: This is safe because entry's `editorState` is guaranteed to have no excess props
    let key: keyof typeof nextEntry.editorState;

    for (key in nextEntry.editorState) {
      if (key === "editingLinearLayer") {
        if (
          nextEntry.editorState[key]?.layerId ===
          lastEntry.editorState[key]?.layerId
        ) {
          continue;
        }
      }

      if (key === "selectedLayerIds" || key === "selectedGroupIds") {
        continue;
      }

      if (nextEntry.editorState[key] !== lastEntry.editorState[key]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Pushes a new entry to the stack
   * @param editorState Editor state
   * @param layers Layers
   */
  pushEntry(editorState: EditorState, layers: readonly Layer[]): void {
    const newEntryDehydrated = this.generateEntry(editorState, layers);
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

  /**
   * Clears redo stack
   */
  clearRedoStack(): void {
    this.redoStack.splice(0, this.redoStack.length);
  }

  /**
   * Redoes once
   */
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

  /**
   * Undoes once
   */
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
   * Updates history's `lastEntry` to latest editor state. This is necessary when
   * doing undo / redo, which itself does not commit to history, but updates the
   * editor state in a way that would break `shouldCreateEntry` which relies on `lastEntry`
   * to reflect last committable history state.
   *
   * We cannot update `lastEntry` from within history when calling undo / redo because
   * the action potentially mutates editorState / layers before storing it
   * @param editorState
   * @param layers
   */
  setCurrentState(editorState: EditorState, layers: readonly Layer[]): void {
    this.lastEntry = this.hydrateHistoryEntry(
      this.generateEntry(editorState, layers)
    );
  }

  /**
   * Resumes history recording
   */
  resumeRecording(): void {
    this.recording = true;
  }

  /**
   * Records the current editor state
   * @param state Editor state
   * @param layers Layers
   */
  record(state: EditorState, layers: readonly Layer[]): void {
    if (this.recording) {
      this.pushEntry(state, layers);
      this.recording = false;
    }
  }
}
