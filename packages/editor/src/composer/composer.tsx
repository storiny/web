import {
  InitialConfigType,
  LexicalComposer
} from "@lexical/react/LexicalComposer";
import { devConsole } from "@storiny/shared/src/utils/devLog";
import React from "react";

import { EditorNamespace } from "../constants";
import { editorNodes } from "../nodes";

const EditorComposer = ({
  children
}: {
  children: React.ReactElement;
}): React.ReactElement => {
  const initialConfig: InitialConfigType = {
    namespace: EditorNamespace.MAIN,
    onError: devConsole.error,
    nodes: editorNodes,
    editable: true
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>{children}</LexicalComposer>
  );
};

export default EditorComposer;
