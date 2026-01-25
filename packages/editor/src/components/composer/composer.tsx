import {
  InitialConfigType,
  LexicalComposer
} from "@lexical/react/LexicalComposer";
import { dev_console } from "@storiny/shared/src/utils/dev-log";
import React from "react";

import { EditorNamespace } from "../../constants";
import { EDITOR_NODES } from "../../nodes";
import { EDITOR_THEME } from "../../theme";

const EditorComposer = ({
  children,
  ignore_theme,
  ignore_nodes,
  read_only
}: {
  children: React.ReactElement;
  ignore_nodes?: boolean;
  ignore_theme?: boolean;
  read_only?: boolean;
}): React.ReactElement => {
  const INITIAL_CONFIG: InitialConfigType = {
    editorState: null, // `null` is required here to allow yjs to set the initial state
    namespace: EditorNamespace.MAIN,

    onError: dev_console.error,
    nodes: ignore_nodes ? undefined : EDITOR_NODES,
    theme: ignore_theme ? undefined : EDITOR_THEME,
    editable: !read_only
  };

  return (
    <LexicalComposer initialConfig={INITIAL_CONFIG}>{children}</LexicalComposer>
  );
};

export default EditorComposer;
