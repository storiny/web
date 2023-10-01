import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import use_lexical_editable from "@lexical/react/useLexicalEditable";
import React from "react";

import { use_can_show_placeholder } from "../../hooks/use-can-show-placeholder";
import { ErrorBoundaryType, use_decorators } from "../../hooks/use-decorators";
import { use_rich_text } from "../../hooks/use-rich-text";

const Placeholder = ({
  content
}: {
  content:
    | ((is_editable: boolean) => null | React.ReactElement)
    | null
    | React.ReactElement;
}): null | React.ReactElement => {
  const [editor] = use_lexical_composer_context();
  const show_placeholder = use_can_show_placeholder(editor);
  const editable = use_lexical_editable();

  if (!show_placeholder) {
    return null;
  }

  if (typeof content === "function") {
    return content(editable);
  } else {
    return content;
  }
};

const RichTextPlugin = ({
  content_editable,
  placeholder,
  ErrorBoundary
}: {
  ErrorBoundary: ErrorBoundaryType;
  content_editable: React.ReactElement;
  placeholder:
    | ((is_editable: boolean) => null | React.ReactElement)
    | null
    | React.ReactElement;
}): React.ReactElement => {
  const [editor] = use_lexical_composer_context();
  const decorators = use_decorators(editor, ErrorBoundary);
  use_rich_text(editor);

  return (
    <React.Fragment>
      {content_editable}
      <Placeholder content={placeholder} />
      {decorators}
    </React.Fragment>
  );
};

export default RichTextPlugin;
