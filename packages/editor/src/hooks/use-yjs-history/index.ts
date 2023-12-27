import { mergeRegister as merge_register } from "@lexical/utils";
import { useSetAtom as use_set_atom } from "jotai";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  LexicalEditor,
  REDO_COMMAND,
  UNDO_COMMAND
} from "lexical";
import React from "react";

import { undo_manager_atom } from "../../atoms";
import { Binding } from "../../collaboration/bindings";
import { create_undo_manager } from "../../collaboration/history";

/**
 * Hook for using yjs history
 * @param editor Editor
 * @param binding Binding
 */
export const use_yjs_history = (
  editor: LexicalEditor,
  binding: Binding
): (() => void) => {
  const set_undo_manager = use_set_atom(undo_manager_atom);
  const undo_manager = React.useMemo(
    () => create_undo_manager(binding, binding.root.get_shared_type()),
    [binding]
  );

  React.useEffect(() => {
    set_undo_manager(undo_manager);
  }, [set_undo_manager, undo_manager]);

  React.useEffect(() => {
    const undo = (): void => {
      undo_manager.undo();
    };

    const redo = (): void => {
      undo_manager.redo();
    };

    return merge_register(
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
  }, [editor, undo_manager]);

  React.useEffect(() => {
    const update_undo_redo_states = (): void => {
      editor.dispatchCommand(
        CAN_UNDO_COMMAND,
        undo_manager.undoStack.length > 0
      );
      editor.dispatchCommand(
        CAN_REDO_COMMAND,
        undo_manager.redoStack.length > 0
      );
    };

    undo_manager.on("stack-item-added", update_undo_redo_states);
    undo_manager.on("stack-item-popped", update_undo_redo_states);
    undo_manager.on("stack-cleared", update_undo_redo_states);

    return () => {
      undo_manager.off("stack-item-added", update_undo_redo_states);
      undo_manager.off("stack-item-popped", update_undo_redo_states);
      undo_manager.off("stack-cleared", update_undo_redo_states);
    };
  }, [editor, undo_manager]);

  return React.useCallback(() => {
    undo_manager.clear();
  }, [undo_manager]);
};
