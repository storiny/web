import { Annotation, Facet, StateCommand } from "@codemirror/state";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { UndoManager } from "yjs";

import { YRange } from "./range";
import {
  code_block_sync_annotation,
  code_block_sync_facet,
  YSyncConfig
} from "./sync";

export class CodeBlockUndoManagerConfig {
  /**
   * Ctor
   * @param undo_manager The undo manager instance
   */
  constructor(undo_manager: UndoManager) {
    this.undo_manager = undo_manager;
  }

  /**
   * The undo manager instance
   * @private
   */
  private readonly undo_manager: UndoManager;

  /**
   * Returns the undo manager instance
   */
  public get_undo_manager(): UndoManager {
    return this.undo_manager;
  }

  public add_tracked_origin(origin: any): void {
    this.undo_manager.addTrackedOrigin(origin);
  }

  public remove_tracked_origin(origin: any): void {
    this.undo_manager.removeTrackedOrigin(origin);
  }

  /**
   * Undo last changes on the type and returns a boolean value indicating
   * whether a change was undone.
   */
  public undo(): boolean {
    return this.undo_manager.undo() != null;
  }

  /**
   * Redo last undo operation on the type and returns a boolean value indicating
   * whether a change was redone.
   */
  public redo(): boolean {
    return this.undo_manager.redo() != null;
  }
}

export const code_block_undo_manager_facet = Facet.define<
  CodeBlockUndoManagerConfig,
  CodeBlockUndoManagerConfig
>({
  combine: (inputs) => inputs[inputs.length - 1]
});

export const code_block_undo_manager_annotation =
  Annotation.define<CodeBlockUndoManagerConfig>();

class CodeBlockUndoManagerPluginValue {
  /**
   * Ctor
   * @param view
   */
  constructor(view: EditorView) {
    this.view = view;
    this.conf = view.state.facet(code_block_undo_manager_facet);
    this.undo_manager = this.conf.get_undo_manager();
    this.sync_conf = view.state.facet(code_block_sync_facet);
    this.before_change_selection = null;

    this.on_stack_item_added = this.on_stack_item_added.bind(this);
    this.on_stack_item_popped = this.on_stack_item_popped.bind(this);

    this.undo_manager.on("stack-item-added", this.on_stack_item_added);
    this.undo_manager.on("stack-item-popped", this.on_stack_item_popped);
    this.undo_manager.addTrackedOrigin(this.sync_conf);
  }

  /**
   * View
   * @private
   */
  private view: EditorView;
  /**
   * Undo manager config
   * @private
   */
  private conf: CodeBlockUndoManagerConfig;
  /**
   * Undo manager instance
   * @private
   */
  private undo_manager: UndoManager;
  /**
   * Yjs range
   * @private
   */
  private before_change_selection: YRange | null;
  /**
   * Yjs sync config
   * @private
   */
  private readonly sync_conf: YSyncConfig;

  private store_selection(): void {
    // Store the selection before the change is applied so we can restore
    // it with the undo manager.
    this.before_change_selection = this.sync_conf.to_y_range(
      this.view.state.selection.main
    );
  }

  private on_stack_item_added({
    stackItem: stack_item,
    changedParentTypes: changed_parent_types
  }: any): void {
    // Only store metadata if this type was affected.
    if (
      changed_parent_types.has(this.sync_conf.ytext) &&
      this.before_change_selection &&
      !stack_item.meta.has(this)
    ) {
      // Do not overwrite the previous stored selection.
      stack_item.meta.set(this, this.before_change_selection);
    }
  }

  private on_stack_item_popped({ stackItem: stack_item }: any): void {
    const sel = stack_item.meta.get(this);

    if (sel) {
      const selection = this.sync_conf.from_y_range(sel);
      this.view.dispatch(this.view.state.update({ selection }));
      this.store_selection();
    }
  }

  public update(update: ViewUpdate): void {
    if (
      update.selectionSet &&
      (update.transactions.length === 0 ||
        update.transactions[0].annotation(code_block_sync_annotation) !==
          this.sync_conf)
    ) {
      // This only works when the UndoManagerPlugin is included before the sync
      // plugin.
      this.store_selection();
    }
  }

  public destroy(): void {
    this.undo_manager.off("stack-item-added", this.on_stack_item_added);
    this.undo_manager.off("stack-item-popped", this.on_stack_item_popped);
    this.undo_manager.removeTrackedOrigin(this.sync_conf);
  }
}

export const code_block_undo_manager = ViewPlugin.fromClass(
  CodeBlockUndoManagerPluginValue
);

export const undo: StateCommand = ({ state }) =>
  state.facet(code_block_undo_manager_facet).undo() || true;

export const redo: StateCommand = ({ state }) =>
  state.facet(code_block_undo_manager_facet).redo() || true;
