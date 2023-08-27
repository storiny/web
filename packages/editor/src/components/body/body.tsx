import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useSetAtom } from "jotai";
import React from "react";

import { documentLoadingAtom } from "../../atoms";
import { useRegisterTools } from "../../hooks/useRegisterTools";
import AutoFocusPlugin from "../../plugins/auto-focus";
import LinkPlugin from "../../plugins/link";
import ListMaxIndentLevelPlugin from "../../plugins/list-max-indent-level";
import MaxLengthPlugin from "../../plugins/max-length";
import RichTextPlugin from "../../plugins/rich-text";
import TabFocusPlugin from "../../plugins/tab-focus";
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
      <LinkPlugin />
      <ListMaxIndentLevelPlugin />
      <MaxLengthPlugin />
      <TabFocusPlugin />
      <AutoFocusPlugin />
    </React.Fragment>
  );
};

export default EditorBody;
