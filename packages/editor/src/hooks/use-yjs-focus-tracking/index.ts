import { mergeRegister } from "@lexical/utils";
import {
  BLUR_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  FOCUS_COMMAND,
  LexicalEditor
} from "lexical";
import React from "react";

import { Provider, setLocalStateFocus } from "../../collab/provider";

/**
 * Hook for using yjs focus tracking
 * @param editor Editor
 * @param awarenessData Awareness data
 * @param rest Local state props
 */
export const useYjsFocusTracking = ({
  editor,
  awarenessData,
  ...rest
}: {
  avatarHex: string | null;
  avatarId: string | null;
  awarenessData?: object;
  color: string;
  editor: LexicalEditor;
  name: string;
  provider: Provider;
}): void => {
  React.useEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          FOCUS_COMMAND,
          () => {
            setLocalStateFocus({
              ...rest,
              focusing: true,
              awarenessData: awarenessData || {}
            });
            return false;
          },
          COMMAND_PRIORITY_EDITOR
        ),
        editor.registerCommand(
          BLUR_COMMAND,
          () => {
            setLocalStateFocus({
              ...rest,
              focusing: false,
              awarenessData: awarenessData || {}
            });
            return false;
          },
          COMMAND_PRIORITY_EDITOR
        )
      ),
    [awarenessData, editor, rest]
  );
};
