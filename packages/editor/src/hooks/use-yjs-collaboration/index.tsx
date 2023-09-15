"use client";

import { InitialEditorStateType } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useSetAtom } from "jotai";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  LexicalEditor
} from "lexical";
import React from "react";
import { createPortal } from "react-dom";
import { Doc, Transaction, UndoManager, YEvent } from "yjs";

import { awarenessAtom, docStatusAtom } from "../../atoms";
import { ExcludedProperties } from "../../collab/bindings";
import { Binding, createBinding } from "../../collab/bindings";
import { CONNECTED_COMMAND } from "../../collab/commands";
import {
  CollabLocalState,
  initLocalState,
  Provider
} from "../../collab/provider";
import { syncCursorPositions } from "../../utils/sync-cursor-positions";
import { syncLexicalUpdateToYjs } from "../../utils/sync-lexical-update-to-yjs";
import { syncYjsChangesToLexical } from "../../utils/sync-yjs-changes-to-lexical";

/**
 * Initializes the editor
 * @param editor Editor
 * @param initialEditorState Initial editor state
 */
const initializeEditor = (
  editor: LexicalEditor,
  initialEditorState?: InitialEditorStateType
): void => {
  editor.update(
    () => {
      const root = $getRoot();

      if (root.isEmpty()) {
        if (initialEditorState) {
          switch (typeof initialEditorState) {
            case "string": {
              const parsedEditorState =
                editor.parseEditorState(initialEditorState);
              editor.setEditorState(parsedEditorState, {
                tag: "history-merge"
              });
              break;
            }
            case "object": {
              editor.setEditorState(initialEditorState, {
                tag: "history-merge"
              });
              break;
            }
            case "function": {
              editor.update(
                () => {
                  const root1 = $getRoot();
                  if (root1.isEmpty()) {
                    initialEditorState(editor);
                  }
                },
                { tag: "history-merge" }
              );
              break;
            }
          }
        } else {
          const paragraph = $createParagraphNode();
          root.append(paragraph);
          const { activeElement } = document;

          if (
            $getSelection() !== null ||
            (activeElement !== null &&
              activeElement === editor.getRootElement())
          ) {
            paragraph.select();
          }
        }
      }
    },
    {
      tag: "history-merge"
    }
  );
};

/**
 * Creates the editor (skipping collab)
 * @param editor Editor
 * @param binding Binding
 */
const clearEditorSkipCollab = (
  editor: LexicalEditor,
  binding: Binding
): void => {
  // Reset editor state
  editor.update(
    () => {
      const root = $getRoot();
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
  const cursorsContainer = binding.cursorsContainer;

  if (cursors == null || cursorsContainer == null) {
    return;
  }

  // Reset cursors in the DOM
  const cursorsArr = Array.from(cursors.values());

  for (let i = 0; i < cursorsArr.length; i++) {
    const cursor = cursorsArr[i];
    const selection = cursor.selection;

    if (selection && selection.selections != null) {
      const selections = selection.selections;

      for (let j = 0; j < selections.length; j++) {
        cursorsContainer.removeChild(selections[i]);
      }
    }
  }
};

/**
 * Hook for using yjs collaboration
 * @param id ID
 * @param name User name
 * @param docMap Document map
 * @param shouldBootstrap Whether to bootstrap
 * @param initialEditorState Initial editor state
 * @param excludedProperties Excluded properties
 * @param isMainEditor Main editor flag
 * @param localState Local collab state
 */
export const useYjsCollaboration = ({
  id,
  docMap,
  provider,
  initialEditorState,
  excludedProperties,
  shouldBootstrap,
  isMainEditor,
  localState
}: {
  docMap: Map<string, Doc>;
  excludedProperties?: ExcludedProperties;
  id: string;
  initialEditorState?: InitialEditorStateType;
  isMainEditor?: boolean;
  localState: Omit<
    CollabLocalState,
    "provider" | "awarenessData" | "focusing"
  > &
    Partial<Pick<CollabLocalState, "awarenessData">>;
  provider: Provider;
  shouldBootstrap: boolean;
}): [React.ReactElement, Binding] => {
  const [editor] = useLexicalComposerContext();
  const isReloadingDoc = React.useRef(false);
  const connectedOnceRef = React.useRef<boolean>(false);
  const setDocStatus = useSetAtom(docStatusAtom);
  const setAwareness = useSetAtom(awarenessAtom);
  const [doc, setDoc] = React.useState(docMap.get(id));
  const binding = React.useMemo(
    () => createBinding(editor, id, doc, docMap, excludedProperties),
    [editor, id, docMap, doc, excludedProperties]
  );

  const connect = React.useCallback(() => {
    provider.connect();
  }, [provider]);

  const disconnect = React.useCallback(() => {
    try {
      provider.disconnect();
    } catch {
      // noop
    }
  }, [provider]);

  React.useEffect(() => {
    const { root } = binding;
    const { awareness } = provider;

    // TODO: Handle `overloaded` status

    /**
     * Handles status updates
     * @param status Status
     */
    const handleStatus = ({
      status
    }: {
      status: "connecting" | "connected" | "disconnected";
    }): void => {
      if (isMainEditor) {
        setDocStatus(
          status === "connecting" && connectedOnceRef.current
            ? "reconnecting"
            : status
        );
      }

      if (status === "connected") {
        connectedOnceRef.current = true;
      }

      editor.dispatchCommand(CONNECTED_COMMAND, status === "connected");
    };

    /**
     * Handles sync event
     * @param isSynced Synced flag
     */
    const handleSync = (isSynced: boolean): void => {
      if (
        shouldBootstrap &&
        isSynced &&
        root.isEmpty() &&
        root._xmlText._length === 0 &&
        !isReloadingDoc.current
      ) {
        initializeEditor(editor, initialEditorState);
      }

      if (isMainEditor) {
        setDocStatus("connected");
      }

      isReloadingDoc.current = false;
    };

    /**
     * Handles reload event
     * @param ydoc YDoc
     */
    const handleReload = (ydoc: Doc): void => {
      clearEditorSkipCollab(editor, binding);
      setDoc(ydoc);
      docMap.set(id, ydoc);

      if (isMainEditor) {
        setDocStatus("syncing");
      }

      isReloadingDoc.current = true;
    };

    /**
     * Handles awareness update
     */
    const handleAwarenessUpdate = (): void => {
      syncCursorPositions(binding, provider);
    };

    setAwareness(awareness);
    initLocalState({
      ...localState,
      provider,
      focusing: document.activeElement === editor.getRootElement(),
      awarenessData: localState.awarenessData || {}
    });

    provider.on("reload", handleReload);
    provider.on("status", handleStatus);
    provider.on("sync", handleSync);
    awareness.on("update", handleAwarenessUpdate);

    const onYjsTreeChanges = (
      // The below `any` type is taken directly from the vendor types for yjs
      events: Array<YEvent<any>>,
      transaction: Transaction
    ): void => {
      const origin = transaction.origin;
      if (origin !== binding) {
        const isFromUndoManger = origin instanceof UndoManager;
        syncYjsChangesToLexical(binding, provider, events, isFromUndoManger);
      }
    };

    // This updates the local editor state when we recieve updates from other clients
    root.getSharedType().observeDeep(onYjsTreeChanges);

    const removeListener = editor.registerUpdateListener(
      ({
        prevEditorState,
        editorState,
        dirtyLeaves,
        dirtyElements,
        normalizedNodes,
        tags
      }) => {
        if (!tags.has("skip-collab")) {
          syncLexicalUpdateToYjs({
            binding,
            provider,
            dirtyElements,
            dirtyLeaves,
            tags,
            normalizedNodes,
            prevEditorState,
            currEditorState: editorState
          });
        }
      }
    );

    // Connect to server
    connect();

    return () => {
      if (!isReloadingDoc.current) {
        disconnect();
      }

      provider.off("reload", handleReload);
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      awareness.off("update", handleAwarenessUpdate);

      root.getSharedType().unobserveDeep(onYjsTreeChanges);
      docMap.delete(id);
      removeListener();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    binding,
    connect,
    disconnect,
    docMap,
    editor,
    id,
    initialEditorState,
    isMainEditor,
    provider,
    localState,
    shouldBootstrap
  ]);

  /**
   * Cursors container
   */
  const cursorsContainer = React.useMemo(
    () =>
      createPortal(
        <div
          aria-hidden
          ref={(element: HTMLElement | null): void => {
            binding.cursorsContainer = element;
          }}
        />,
        document.body
      ),
    [binding]
  );

  return [cursorsContainer, binding];
};
