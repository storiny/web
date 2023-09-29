import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import React from "react";

const AutoFocusPlugin = (): null => {
  const [editor] = use_lexical_composer_context();

  React.useEffect(
    () => (editor.isEditable() ? editor.focus() : undefined),
    [editor]
  );

  return null;
};

export default AutoFocusPlugin;
