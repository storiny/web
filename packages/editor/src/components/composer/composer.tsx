import {
  InitialConfigType,
  LexicalComposer
} from "@lexical/react/LexicalComposer";
import { dev_console } from "../../../../shared/src/utils/dev-log";
import React from "react";

import { EditorNamespace } from "../../constants";
import { editorNodes } from "../../nodes";
import { editorTheme } from "../../theme";

const EditorComposer = ({
  children,
  ignoreTheme,
  ignoreNodes,
  readOnly
}: {
  children: React.ReactElement;
  ignoreNodes?: boolean;
  ignoreTheme?: boolean;
  readOnly?: boolean;
}): React.ReactElement => {
  const initialConfig: InitialConfigType = {
    editorState: null, // `null` is required here to allow yjs to set the initial state
    namespace: EditorNamespace.MAIN,
    onError: dev_console.error,
    nodes: ignoreNodes ? undefined : editorNodes,
    theme: ignoreTheme ? undefined : editorTheme,
    editable: !readOnly
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>{children}</LexicalComposer>
  );
};

export default EditorComposer;
