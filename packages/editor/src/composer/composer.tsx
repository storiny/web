import {
  InitialConfigType,
  LexicalComposer
} from "@lexical/react/LexicalComposer";
import { devConsole } from "@storiny/shared/src/utils/devLog";
import React from "react";

import { EditorNamespace } from "../constants";

const EditorComposer = ({
  children
}: {
  children: React.ReactElement;
}): React.ReactElement => {
  const initialConfig: InitialConfigType = {
    namespace: EditorNamespace.MAIN,
    onError: devConsole.error,
    editable: true
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>{children}</LexicalComposer>
  );
};

export default EditorComposer;
