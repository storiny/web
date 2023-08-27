import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React from "react";

const AutoFocusPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(
    () => (editor.isEditable() ? editor.focus() : undefined),
    [editor]
  );

  return null;
};

export default AutoFocusPlugin;
