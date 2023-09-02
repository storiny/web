import { mergeRegister } from "@lexical/utils";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  LexicalEditor,
  REDO_COMMAND,
  UNDO_COMMAND
} from "lexical";
import React from "react";

import { Binding } from "../../collab/bindings";
import { createUndoManager } from "../../collab/history";

/**
 * Hook for using yjs history
 * @param editor Editor
 * @param binding Binding
 */
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

  React.useEffect(() => {
    const updateUndoRedoStates = (): void => {
      editor.dispatchCommand(
        CAN_UNDO_COMMAND,
        undoManager.undoStack.length > 0
      );
      editor.dispatchCommand(
        CAN_REDO_COMMAND,
        undoManager.redoStack.length > 0
      );
    };

    undoManager.on("stack-item-added", updateUndoRedoStates);
    undoManager.on("stack-item-popped", updateUndoRedoStates);
    undoManager.on("stack-cleared", updateUndoRedoStates);

    return () => {
      undoManager.off("stack-item-added", updateUndoRedoStates);
      undoManager.off("stack-item-popped", updateUndoRedoStates);
      undoManager.off("stack-cleared", updateUndoRedoStates);
    };
  }, [editor, undoManager]);

  return React.useCallback(() => {
    undoManager.clear();
  }, [undoManager]);
};
