import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useSetAtom as use_set_atom } from "jotai";
import { $getRoot as $get_root, LexicalEditor } from "lexical";
import React from "react";
import { createPortal as create_portal } from "react-dom";
import { Doc, Transaction, UndoManager, YEvent } from "yjs";

import { awareness_atom, doc_status_atom } from "../../atoms";
import { ExcludedProperties } from "../../collaboration/bindings";
import { Binding, create_binding } from "../../collaboration/bindings";
import {
  CollabLocalState,
  init_local_state,
  Provider
} from "../../collaboration/provider";
import { initialize_editor } from "../../utils/initialize-editor";
import { sync_cursor_positions } from "../../utils/sync-cursor-positions";
import { sync_lexical_update_to_yjs } from "../../utils/sync-lexical-update-to-yjs";
import { sync_yjs_changes_to_lexical } from "../../utils/sync-yjs-changes-to-lexical";

/**
 * Creates the editor (skipping collab)
 * @param editor Editor
 * @param binding Binding
 */
const clear_editor_skip_collab = (
  editor: LexicalEditor,
  binding: Binding
): void => {
  // Reset editor state
  editor.update(
    () => {
      const root = $get_root();
      root.clear();
      root.select();
    },
    {
      tag: "skip-collab"
    }
  );

  if (binding.cursors == null) {
    return;
  }

  const cursors = binding.cursors;
  const cursors_container = binding.cursors_container;

  if (cursors == null || cursors_container == null) {
    return;
  }

  // Reset cursors in the DOM
  const cursors_arr = Array.from(cursors.values());

  for (let i = 0; i < cursors_arr.length; i++) {
    const cursor = cursors_arr[i];
    const selection = cursor.selection;

    if (selection && selection.selections != null) {
      const selections = selection.selections;

      for (let j = 0; j < selections.length; j++) {
        cursors_container.removeChild(selections[i]);
      }
    }
  }
};

/**
 * Hook for using yjs collaboration
 * @param name User name
 * @param doc_map Document map
 * @param should_bootstrap Whether to bootstrap
 * @param excluded_properties Excluded properties
 * @param local_state Local collab state
 */
export const use_yjs_collaboration = ({
  doc_map,
  provider,
  excluded_properties,
  should_bootstrap,
  local_state
}: {
  doc_map: Map<string, Doc>;
  excluded_properties?: ExcludedProperties;
  local_state: Omit<
    CollabLocalState,
    "provider" | "awareness_data" | "focusing"
  > &
    Partial<Pick<CollabLocalState, "awareness_data">>;
  provider: Provider;
  should_bootstrap: boolean;
}): [React.ReactElement, Binding] => {
  const [editor] = use_lexical_composer_context();
  const is_reloading_doc = React.useRef(false);
  const connected_once_ref = React.useRef<boolean>(false);
  const set_doc_status = use_set_atom(doc_status_atom);
  const set_awareness = use_set_atom(awareness_atom);
  const [doc, set_doc] = React.useState(doc_map.get("main"));
  const binding = React.useMemo(
    () => create_binding(editor, doc, doc_map, excluded_properties),
    [doc, doc_map, editor, excluded_properties]
  );

  const connect = React.useCallback(() => {
    provider.connect();
  }, [provider]);

  const disconnect = React.useCallback(() => {
    try {
      provider.disconnect();
    } catch {
      // NOOP
    }
  }, [provider]);

  React.useEffect(() => {
    const { root } = binding;
    const { awareness } = provider;

    /**
     * Handles status updates
     * @param status Status
     */
    const handle_status = ({
      status
    }: {
      status: "connecting" | "connected" | "disconnected";
    }): void => {
      set_doc_status(
        status === "connecting" && connected_once_ref.current
          ? "reconnecting"
          : status
      );

      if (status === "connected") {
        connected_once_ref.current = true;
      }
    };

    /**
     * Handles provider authentication
     * @param reason Rejection reason
     */
    const handle_auth = (reason: "forbidden" | "overloaded"): void => {
      set_doc_status(reason);
    };

    /**
     * Handles sync event
     * @param is_synced Synced flag
     */
    const handle_sync = (is_synced: boolean): void => {
      if (
        should_bootstrap &&
        is_synced &&
        root.is_empty() &&
        root._xml_text._length === 0 &&
        !is_reloading_doc.current
      ) {
        initialize_editor(editor);
      }

      set_doc_status("connected");
      is_reloading_doc.current = false;
    };

    /**
     * Handles reload event
     * @param next_doc YDoc
     */
    const handle_reload = (next_doc: Doc): void => {
      clear_editor_skip_collab(editor, binding);
      set_doc(next_doc);
      doc_map.set("main", next_doc);
      set_doc_status("syncing");
      is_reloading_doc.current = true;
    };

    /**
     * Handles awareness update
     */
    const handle_awareness_update = (): void => {
      sync_cursor_positions(binding, provider);
    };

    set_awareness(awareness);
    init_local_state({
      ...local_state,
      provider,
      focusing: document.activeElement === editor.getRootElement(),
      awareness_data: local_state.awareness_data || {}
    });

    provider.on("reload", handle_reload);
    provider.on("status", handle_status);
    provider.on("sync", handle_sync);
    provider.on("auth", handle_auth);
    awareness.on("update", handle_awareness_update);

    const on_yjs_tree_changes = (
      // The below `any` type is taken directly from the vendor types for yjs
      events: Array<YEvent<any>>,
      transaction: Transaction
    ): void => {
      const origin = transaction.origin;
      if (origin !== binding) {
        const is_from_undo_manager = origin instanceof UndoManager;
        sync_yjs_changes_to_lexical({
          binding,
          provider,
          events,
          is_from_undo_manager
        });
      }
    };

    // This updates the local editor state when we receive updates from other clients
    root.get_shared_type().observeDeep(on_yjs_tree_changes);

    const remove_listener = editor.registerUpdateListener(
      ({
        prevEditorState: prev_editor_state,
        editorState: curr_editor_state,
        dirtyLeaves: dirty_leaves,
        dirtyElements: dirty_elements,
        normalizedNodes: normalized_nodes,
        tags
      }) => {
        if (!tags.has("skip-collab")) {
          sync_lexical_update_to_yjs({
            binding,
            provider,
            dirty_elements,
            dirty_leaves,
            tags,
            normalized_nodes,
            prev_editor_state,
            curr_editor_state
          });
        }
      }
    );

    // Connect to server
    connect();

    return () => {
      if (!is_reloading_doc.current) {
        disconnect();
      }

      provider.off("reload", handle_reload);
      provider.off("status", handle_status);
      provider.off("sync", handle_sync);
      provider.off("auth", handle_auth);
      awareness.off("update", handle_awareness_update);
      root.get_shared_type().unobserveDeep(on_yjs_tree_changes);
      doc_map.delete("main");
      remove_listener();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    binding,
    connect,
    disconnect,
    doc_map,
    editor,
    provider,
    local_state,
    should_bootstrap
  ]);

  /**
   * Cursors container
   */
  const cursors_container = React.useMemo(
    () =>
      create_portal(
        <div
          aria-hidden
          ref={(element: HTMLElement | null): void => {
            binding.cursors_container = element;
          }}
        />,
        document.body
      ),
    [binding]
  );

  return [cursors_container, binding];
};
