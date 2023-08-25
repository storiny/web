import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useSetAtom } from "jotai";
import React from "react";

import { documentLoadingAtom } from "../../atoms";
import { useRegisterTools } from "../../hooks/useRegisterTools";
import EditorContentEditable from "../content-editable";
import EditorPlaceholder from "../placeholder";

const EditorBody = (): React.ReactElement => {
  useRegisterTools();
  const setDocumentLoading = useSetAtom(documentLoadingAtom);

  React.useEffect(() => {
    setDocumentLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <React.Fragment>
      <RichTextPlugin
        ErrorBoundary={LexicalErrorBoundary}
        contentEditable={<EditorContentEditable />}
        placeholder={<EditorPlaceholder />}
      />
      <HistoryPlugin />
    </React.Fragment>
  );
};

export default EditorBody;
