import { mergeRegister } from "@lexical/utils";
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
  setLocalStateFocus
} from "../../collab/provider";

/**
 * Hook for using yjs focus tracking
 * @param editor Editor
 * @param provider Provider
 * @param localState Collab local state
 */
export const useYjsFocusTracking = (
  editor: LexicalEditor,
  provider: Provider,
  localState: Omit<
    CollabLocalState,
    "provider" | "focusing" | "awarenessData"
  > &
    Partial<Pick<CollabLocalState, "awarenessData">>
): void => {
  React.useEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          FOCUS_COMMAND,
          () => {
            setLocalStateFocus({
              ...localState,
              provider,
              focusing: true,
              awarenessData: localState.awarenessData || {}
            });
            return false;
          },
          COMMAND_PRIORITY_EDITOR
        ),
        editor.registerCommand(
          BLUR_COMMAND,
          () => {
            setLocalStateFocus({
              ...localState,
              provider,
              focusing: false,
              awarenessData: localState.awarenessData || {}
            });
            return false;
          },
          COMMAND_PRIORITY_EDITOR
        )
      ),
    [localState, editor, provider]
  );
};
