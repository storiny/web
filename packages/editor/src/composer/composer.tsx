import {
  InitialConfigType,
  LexicalComposer
} from "@lexical/react/LexicalComposer";
import { devConsole } from "@storiny/shared/src/utils/devLog";
import React from "react";

import { EditorNamespace } from "../constants";
import { editorNodes } from "../nodes";
import { editorTheme } from "../theme";

const EditorComposer = ({
  children,
  ignoreTheme,
  ignoreNodes
}: {
  children: React.ReactElement;
  ignoreNodes?: boolean;
  ignoreTheme?: boolean;
}): React.ReactElement => {
  const initialConfig: InitialConfigType = {
    editorState: null, // `null` is required here to allow yjs to set the initial state
    namespace: EditorNamespace.MAIN,
    onError: devConsole.error,
    nodes: ignoreNodes ? undefined : editorNodes,
    theme: ignoreTheme ? undefined : editorTheme,
    editable: true
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>{children}</LexicalComposer>
  );
};

export default EditorComposer;
