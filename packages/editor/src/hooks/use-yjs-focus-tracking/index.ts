import { mergeRegister as merge_register } from "@lexical/utils";
import {
  BLUR_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  FOCUS_COMMAND,
  LexicalEditor
} from "lexical";
import React from "react";

import {
  CollabLocalState,
  Provider,
  set_local_state_focus
} from "../../collaboration/provider";

/**
 * Hook for using yjs focus tracking
 * @param editor Editor
 * @param provider Provider
 * @param local_state Collab local state
 */
export const use_yjs_focus_tracking = (
  editor: LexicalEditor,
  provider: Provider,
  local_state: Omit<
    CollabLocalState,
    "provider" | "focusing" | "awareness_data"
  > &
    Partial<Pick<CollabLocalState, "awareness_data">>
): void => {
  React.useEffect(
    () =>
      merge_register(
        editor.registerCommand(
          FOCUS_COMMAND,
          () => {
            set_local_state_focus({
              ...local_state,
              provider,
              focusing: true,
              awareness_data: local_state.awareness_data || {}
            });
            return false;
          },
          COMMAND_PRIORITY_EDITOR
        ),
        editor.registerCommand(
          BLUR_COMMAND,
          () => {
            set_local_state_focus({
              ...local_state,
              provider,
              focusing: false,
              awareness_data: local_state.awareness_data || {}
            });
            return false;
          },
          COMMAND_PRIORITY_EDITOR
        )
      ),
    [local_state, editor, provider]
  );
};
