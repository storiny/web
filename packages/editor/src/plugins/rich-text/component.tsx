import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useLexicalEditable from "@lexical/react/useLexicalEditable";
import React from "react";

import { useCanShowPlaceholder } from "../../hooks/useCanShowPlaceholder";
import { ErrorBoundaryType, useDecorators } from "../../hooks/useDecorators";
import { useRichText } from "../../hooks/useRichText";

const Placeholder = ({
  content
}: {
  content:
    | ((isEditable: boolean) => null | React.ReactElement)
    | null
    | React.ReactElement;
}): null | React.ReactElement => {
  const [editor] = useLexicalComposerContext();
  const showPlaceholder = useCanShowPlaceholder(editor);
  const editable = useLexicalEditable();

  if (!showPlaceholder) {
    return null;
  }

  if (typeof content === "function") {
    return content(editable);
  } else {
    return content;
  }
};

const RichTextPlugin = ({
  contentEditable,
  placeholder,
  ErrorBoundary
}: {
  ErrorBoundary: ErrorBoundaryType;
  contentEditable: React.ReactElement;
  placeholder:
    | ((isEditable: boolean) => null | React.ReactElement)
    | null
    | React.ReactElement;
}): React.ReactElement => {
  const [editor] = useLexicalComposerContext();
  const decorators = useDecorators(editor, ErrorBoundary);
  useRichText(editor);

  return (
    <React.Fragment>
      {contentEditable}
      <Placeholder content={placeholder} />
      {decorators}
    </React.Fragment>
  );
};

export default RichTextPlugin;
