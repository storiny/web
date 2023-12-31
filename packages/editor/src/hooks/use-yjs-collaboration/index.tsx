import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtom as use_atom, useSetAtom as use_set_atom } from "jotai";
import { $getRoot as $get_root, LexicalEditor } from "lexical";
import React from "react";
import { createPortal as create_portal } from "react-dom";
import { Doc, Transaction, UndoManager, YEvent } from "yjs";

import { awareness_atom, DOC_STATUS, doc_status_atom } from "../../atoms";
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

// The websocket connection close code to document status map. Keep this in
// sync with the `EnterRealmError` enum on the server.
const ERROR_CODE_TO_DOC_STATUS_MAP: Record<
  string,
  (typeof DOC_STATUS)[keyof typeof DOC_STATUS]
> = {
  "3001": DOC_STATUS.join_missing_story,
  "3002": DOC_STATUS.join_realm_full,
  "3003": DOC_STATUS.join_unauthorized,
  "3004": DOC_STATUS.join_unauthorized,
  "3005": DOC_STATUS.doc_corrupted,
  "4000": DOC_STATUS.internal
};

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
 * Hook for using yjs collaboration.
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
}): [React.ReactPortal, Binding] => {
  const [editor] = use_lexical_composer_context();
  const is_reloading_doc = React.useRef(false);
  const connected_once_ref = React.useRef<boolean>(false);
  const [doc_status, set_doc_status] = use_atom(doc_status_atom);
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
      // Noop
    }
  }, [provider]);

  React.useEffect(
    () => {
      const { root } = binding;
      const { awareness } = provider;

      /**
       * Handles the websocket connection status updates.
       * @param status The next connection status.
       */
      const handle_status = ({
        status
      }: {
        status: "connecting" | "connected" | "disconnected";
      }): void => {
        set_doc_status((prev_value) =>
          status === "connecting"
            ? connected_once_ref.current
              ? DOC_STATUS.reconnecting
              : DOC_STATUS.connecting
            : status === "connected"
              ? DOC_STATUS.connected
              : [
                    DOC_STATUS.connecting,
                    DOC_STATUS.connected,
                    DOC_STATUS.reconnecting,
                    DOC_STATUS.syncing,
                    DOC_STATUS.synced
                  ].includes(prev_value)
                ? DOC_STATUS.disconnected
                : prev_value
        );

        if (status === "connected") {
          connected_once_ref.current = true;
        }
      };

      /**
       * Handles the peer authentication login.
       *
       * We currently do not use this method to authenticate the peer.
       * The user authentication logic is handled during the handshake
       * request and the rejection is catched by examining the event code
       * of the websocket `connection-close` event.
       */
      const handle_auth = (): void => {
        set_doc_status(DOC_STATUS.join_unauthorized);
      };

      /**
       * Handles the sync event.
       * @param is_synced The synced boolean flag.
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

        set_doc_status(DOC_STATUS.synced);
        is_reloading_doc.current = false;
      };

      /**
       * Handles the reload event.
       * @param next_doc The next document instance.
       */
      const handle_reload = (next_doc: Doc): void => {
        clear_editor_skip_collab(editor, binding);
        set_doc(next_doc);

        doc_map.set("main", next_doc);
        set_doc_status(DOC_STATUS.syncing);

        is_reloading_doc.current = true;
      };

      /**
       * Handles an awareness update.
       */
      const handle_awareness_update = (): void => {
        sync_cursor_positions(binding, provider);
      };

      /**
       * Handles an internal realm destroy event.
       * @param reason The destroy reason.
       */
      const handle_destroy = (
        reason:
          | "story_published"
          | "story_unpublished"
          | "story_deleted"
          | "doc_overload"
          | "lifetime_exceeded"
          | "internal"
      ): void => {
        set_doc_status(
          reason === "story_published"
            ? DOC_STATUS.published
            : reason === "story_unpublished"
              ? DOC_STATUS.unpublished
              : reason === "story_deleted"
                ? DOC_STATUS.deleted
                : reason === "lifetime_exceeded"
                  ? DOC_STATUS.lifetime_exceeded
                  : DOC_STATUS.internal
        );
      };

      /**
       * Handles an event fired when the current peer has been
       * disconnceted for being inactive for too long.
       */
      const handle_stale = (): void => {
        set_doc_status(DOC_STATUS.stale_peer);
      };

      /**
       * Handles errors received while joining the realm.
       * @param event The connection close event from the handshake request.
       */
      const handle_connection_close = (event: CloseEvent): void => {
        const error_code = event.code;
        set_doc_status(
          ERROR_CODE_TO_DOC_STATUS_MAP[error_code] || DOC_STATUS.internal
        );
      };

      /**
       * Handles the websocket connection errors.
       */
      const handle_connection_error = (): void => {
        if (
          [
            DOC_STATUS.connecting,
            DOC_STATUS.connected,
            DOC_STATUS.reconnecting,
            DOC_STATUS.syncing
          ].includes(doc_status)
        ) {
          set_doc_status(DOC_STATUS.disconnected);
        }
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
      provider.on("stale", handle_stale);
      provider.on("destroy", handle_destroy);
      provider.on("connection-close", handle_connection_close);
      provider.on("connection-error", handle_connection_error);

      awareness.on("update", handle_awareness_update);

      const on_yjs_tree_changes = (
        // The below `any` type is taken directly from the vendor types
        // for Yjs.
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

      // This updates the local editor state when we receive updates from
      // other clients.
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

      // Connect to realm server.
      connect();

      return () => {
        if (!is_reloading_doc.current) {
          disconnect();
        }

        // Cleanup listeners.
        provider.off("reload", handle_reload);
        provider.off("status", handle_status);
        provider.off("sync", handle_sync);
        provider.off("auth", handle_auth);
        provider.off("stale", handle_stale);
        provider.off("destroy", handle_destroy);
        provider.off("connection-close", handle_connection_close);
        provider.off("connection-error", handle_connection_error);

        awareness.off("update", handle_awareness_update);

        root.get_shared_type().unobserveDeep(on_yjs_tree_changes);
        doc_map.delete("main");

        remove_listener();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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

  return [cursors_container as React.ReactPortal, binding];
};
