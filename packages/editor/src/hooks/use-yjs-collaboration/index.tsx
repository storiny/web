import { InitialEditorStateType } from "@lexical/react/LexicalComposer";
import { mergeRegister } from "@lexical/utils";
import {
  Binding,
  CONNECTED_COMMAND,
  createBinding,
  createUndoManager,
  ExcludedProperties,
  initLocalState,
  Provider,
  setLocalStateFocus,
  syncCursorPositions,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
  TOGGLE_CONNECT_COMMAND
} from "@lexical/yjs";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  FOCUS_COMMAND,
  LexicalEditor,
  REDO_COMMAND,
  UNDO_COMMAND
} from "lexical";
import React from "react";
import { createPortal } from "react-dom";
import { Doc, Transaction, UndoManager, YEvent } from "yjs";

export type CursorsContainerRef = React.MutableRefObject<HTMLElement | null>;

export const useYjsCollaboration = (
  editor: LexicalEditor,
  id: string,
  provider: Provider,
  docMap: Map<string, Doc>,
  name: string,
  color: string,
  shouldBootstrap: boolean,
  cursorsContainerRef?: CursorsContainerRef,
  initialEditorState?: InitialEditorStateType,
  excludedProperties?: ExcludedProperties,
  awarenessData?: object
): [React.ReactElement, Binding] => {
  const isReloadingDoc = React.useRef(false);
  const [doc, setDoc] = React.useState(docMap.get(id));
  const binding = React.useMemo(
    () => createBinding(editor, provider, id, doc, docMap, excludedProperties),
    [editor, provider, id, docMap, doc, excludedProperties]
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

    const onStatus = ({ status }: { status: string }): void => {
      editor.dispatchCommand(CONNECTED_COMMAND, status === "connected");
    };

    const onSync = (isSynced: boolean): void => {
      if (
        shouldBootstrap &&
        isSynced &&
        root.isEmpty() &&
        root._xmlText._length === 0 &&
        !isReloadingDoc.current
      ) {
        initializeEditor(editor, initialEditorState);
      }

      isReloadingDoc.current = false;
    };

    const onAwarenessUpdate = (): void => {
      syncCursorPositions(binding, provider);
    };

    const onYjsTreeChanges = (
      // The below `any` type is taken directly from the vendor types for YJS.
      events: Array<YEvent<any>>,
      transaction: Transaction
    ): void => {
      const origin = transaction.origin;
      if (origin !== binding) {
        const isFromUndoManger = origin instanceof UndoManager;
        syncYjsChangesToLexical(binding, provider, events, isFromUndoManger);
      }
    };

    initLocalState(
      provider,
      name,
      color,
      document.activeElement === editor.getRootElement(),
      awarenessData || {}
    );

    const onProviderDocReload = (ydoc: Doc): void => {
      clearEditorSkipCollab(editor, binding);
      setDoc(ydoc);
      docMap.set(id, ydoc);
      isReloadingDoc.current = true;
    };

    provider.on("reload", onProviderDocReload);
    provider.on("status", onStatus);
    provider.on("sync", onSync);
    awareness.on("update", onAwarenessUpdate);
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
          syncLexicalUpdateToYjs(
            binding,
            provider,
            prevEditorState,
            editorState,
            dirtyElements,
            dirtyLeaves,
            normalizedNodes,
            tags
          );
        }
      }
    );

    connect();

    return () => {
      if (!isReloadingDoc.current) {
        disconnect();
      }

      provider.off("sync", onSync);
      provider.off("status", onStatus);
      provider.off("reload", onProviderDocReload);
      awareness.off("update", onAwarenessUpdate);
      root.getSharedType().unobserveDeep(onYjsTreeChanges);
      docMap.delete(id);
      removeListener();
    };
  }, [
    binding,
    color,
    connect,
    disconnect,
    docMap,
    editor,
    id,
    initialEditorState,
    name,
    provider,
    shouldBootstrap,
    awarenessData
  ]);

  const cursorsContainer = React.useMemo(() => {
    const ref = (element: null | HTMLElement): void => {
      binding.cursorsContainer = element;
    };

    return createPortal(
      <div ref={ref} />,
      cursorsContainerRef?.current || document.body
    );
  }, [binding, cursorsContainerRef]);

  React.useEffect(
    () =>
      editor.registerCommand(
        TOGGLE_CONNECT_COMMAND,
        (payload) => {
          if (connect !== undefined && disconnect !== undefined) {
            if (payload) {
              // eslint-disable-next-line no-console
              console.log("Collaboration connected!");
              connect();
            } else {
              // eslint-disable-next-line no-console
              console.log("Collaboration disconnected!");
              disconnect();
            }
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
    [connect, disconnect, editor]
  );

  return [cursorsContainer, binding];
};

export const useYjsFocusTracking = (
  editor: LexicalEditor,
  provider: Provider,
  name: string,
  color: string,
  awarenessData?: object
): void => {
  React.useEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          FOCUS_COMMAND,
          () => {
            setLocalStateFocus(
              provider,
              name,
              color,
              true,
              awarenessData || {}
            );
            return false;
          },
          COMMAND_PRIORITY_EDITOR
        ),
        editor.registerCommand(
          BLUR_COMMAND,
          () => {
            setLocalStateFocus(
              provider,
              name,
              color,
              false,
              awarenessData || {}
            );
            return false;
          },
          COMMAND_PRIORITY_EDITOR
        )
      ),
    [color, editor, name, provider, awarenessData]
  );
};

export const useYjsHistory = (
  editor: LexicalEditor,
  binding: Binding
): (() => void) => {
  const undoManager = React.useMemo(
    () => createUndoManager(binding, binding.root.getSharedType()),
    [binding]
  );

  React.useEffect(() => {
    const undo = (): void => {
      undoManager.undo();
    };

    const redo = (): void => {
      undoManager.redo();
    };

    return mergeRegister(
      editor.registerCommand(
        UNDO_COMMAND,
        () => {
          undo();
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        REDO_COMMAND,
        () => {
          redo();
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  });

  return React.useCallback(() => {
    undoManager.clear();
  }, [undoManager]);
};

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

  if (cursors == null) {
    return;
  }

  const cursorsContainer = binding.cursorsContainer;

  if (cursorsContainer == null) {
    return;
  }

  // Reset cursors in DOM
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
